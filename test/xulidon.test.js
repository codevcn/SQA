require('dotenv').config();
const { By, Key, until, Builder } = require('selenium-webdriver');
const { expect } = require('chai');
require('chromedriver');
const axios = require('axios');
const chrome = require('selenium-webdriver/chrome');
const dayjs = require('dayjs');

const DOMAIN = process.env.DOMAIN;
console.log(`Testing reservation processing on: ${DOMAIN}`);

const { convertDateFormat, getTomorrowDateFormatted, clickButton, clickOkToast, getMessageFromToast } = require("./utils/helper");
const { login, logout, placeOrder, getBookingDetails, filterBookings } = require("./utils/func");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function để tạo ngày động cho test với format dd/mm/yyyy
function getTestDate(daysFromNow = 1) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper function để tạo thời gian đặt bàn với format dd/mm/yyyy hh:mm
function getTestDateTime(daysFromNow = 1, time = '18:00') {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year} ${time}`;
}

// Helper function để xóa dữ liệu test cũ
async function cleanupTestData(cookies) {
    try {
        await axios.get(`${DOMAIN}/reset-database`, {
            headers: { Cookie: cookies.join('; ') }
        });
        console.log('✅ Đã xóa dữ liệu test cũ');
    } catch (error) {
        console.log('ℹ️ Không có dữ liệu test cũ để xóa');
    }
}

describe('Test Cases cho chức năng xử lý đơn đặt chỗ', function () {
    this.timeout(90000);
    let driver;

    before(async function () {
        let options = new chrome.Options();
        // Tắt các cảnh báo và log không cần thiết
        options.addArguments(
            '--disable-gpu', 
            '--no-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-logging',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--log-level=3',
            '--silent',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript-harmony-shipping',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
        );
        
        // Tắt console log
        options.setLoggingPrefs({
            'browser': 'OFF',
            'driver': 'OFF',
            'performance': 'OFF'
        });
        
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
        await driver.manage().setTimeouts({ implicit: 5000 });
    });

    after(async function () {
        if (driver) {
            await driver.get(`${DOMAIN}/api/admin/logout`);
            await driver.quit();
        }
    });

    beforeEach(async function () {
        await axios.get(`${DOMAIN}/reset-database`);
    });

    // Helper function để tạo đơn đặt chỗ test
    async function createTestReservation(testData) {
        await driver.get(DOMAIN);
        await placeOrder(driver, testData);
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button');
        await driver.sleep(1);
    }

    // Helper function để tìm đơn đặt chỗ theo thông tin
    async function findBookingByInfo(testData, expectedStatus = "Chưa được xử lý") {
        await driver.get(`${DOMAIN}/admin/all-bookings/`);
        let bookingList = await getBookingDetails(driver);
        let book = bookingList.find(
            (value) =>
                value.fullName.trim().includes(testData.fullName.trim()) &&
                value.phone.trim().includes(testData.phone.trim()) &&
                value.status.trim().includes(expectedStatus) &&
                value.arrivalTime.trim().includes(convertDateFormat(testData.date)) &&
                value.arrivalTime.trim().includes(testData.time)
        );
        return book;
    }

    // Helper function để thay đổi trạng thái đơn
    async function changeBookingStatus(booking, action) {
        if (!booking) {
            throw new Error('Booking not found');
        }

        switch (action) {
            case 'approve':
                if (booking.approveButton) {
                    await booking.approveButton.click();
                    await driver.sleep(1);
                    await clickButton(driver, '//*[@id="confirm-approve-form"]/div/button/span');
                } else {
                    throw new Error('Approve button not available');
                }
                break;
            case 'reject':
                if (booking.rejectButton) {
                    await booking.rejectButton.click();
                    await driver.sleep(1);
                    await clickButton(driver, '//*[@id="confirm-reject-form"]/div[2]/button');
                } else {
                    throw new Error('Reject button not available');
                }
                break;
            case 'complete':
                const completeButton = await driver.findElement(By.id('complete-booking-btn'));
                await completeButton.click();
                await driver.sleep(1);
                await clickButton(driver, '//*[@id="confirm-complete-form"]/div/button/span');
                break;
            case 'cancel':
                const cancelButton = await driver.findElement(By.id('cancel-booking-btn'));
                await cancelButton.click();
                await driver.sleep(1);
                await clickButton(driver, '//*[@id="confirm-cancel-form"]/div/button');
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        
        await driver.sleep(1);
        await clickOkToast(driver);
        await driver.sleep(2);
    }

    // TC1: Duyệt đơn khi trạng thái Pending - Thành công
    it('TC1: Duyệt đơn khi trạng thái Pending - Thành công', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn A', 
            phone: '0987654321', 
            email: 'test1@example.com',
            date: getTomorrowDateFormatted(), 
            time: '18:00', 
            adults: '2' 
        };
        await createTestReservation(testData);

        await driver.get(`${DOMAIN}/admin/all-bookings/`);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        
        await changeBookingStatus(booking, 'approve');

        booking = await findBookingByInfo(testData, "Đã duyệt");
        expect(booking).to.exist;
        
        await logout(driver);
    });

    // TC2: Từ chối đơn khi trạng thái Pending - Thành công
    it('TC2: Từ chối đơn khi trạng thái Pending - Thành công', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn B', 
            phone: '0987654322', 
            email: 'test2@example.com',
            date: getTomorrowDateFormatted(), 
            time: '19:00', 
            adults: '3' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        
        await changeBookingStatus(booking, 'reject');

        booking = await findBookingByInfo(testData, "Đã từ chối");
        expect(booking).to.exist;
        
        await logout(driver);
    });

    // TC3: Huỷ đơn khi trạng thái Pending - Thành công
    it('TC3: Huỷ đơn khi trạng thái Pending - Thành công', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn C', 
            phone: '0987654323', 
            email: 'test3@example.com',
            date: getTomorrowDateFormatted(), 
            time: '20:00', 
            adults: '4' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        
        await changeBookingStatus(booking, 'cancel');

        booking = await findBookingByInfo(testData, "Đã hủy");
        expect(booking).to.exist;
        
        await logout(driver);
    });

    // TC4: Hoàn thành đơn khi trạng thái Approved - Thành công
    it('TC4: Hoàn thành đơn khi trạng thái Approved - Thành công', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn E', 
            phone: '0987654325', 
            email: 'test5@example.com',
            date: getTomorrowDateFormatted(), 
            time: '18:30', 
            adults: '2' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'approve');

        booking = await findBookingByInfo(testData, "Đã duyệt");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'complete');

        booking = await findBookingByInfo(testData, "Đã hoàn thành");
        expect(booking).to.exist;
        
        await logout(driver);
    });

    // TC5: Huỷ đơn khi trạng thái Approved - Thành công
    it('TC5: Huỷ đơn khi trạng thái Approved - Thành công', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn F', 
            phone: '0987654326', 
            email: 'test6@example.com',
            date: getTomorrowDateFormatted(), 
            time: '19:30', 
            adults: '3' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'approve');

        booking = await findBookingByInfo(testData, "Đã duyệt");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'cancel');

        booking = await findBookingByInfo(testData, "Đã hủy");
        expect(booking).to.exist;
        
        await logout(driver);
    });

    // TC6: Duyệt đơn đã bị từ chối (trạng thái Rejected) - Thất bại
    it('TC6: Duyệt đơn đã bị từ chối (trạng thái Rejected) - Thất bại', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn I', 
            phone: '0987654329', 
            email: 'test9@example.com',
            date: getTomorrowDateFormatted(), 
            time: '18:15', 
            adults: '2' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'reject');

        booking = await findBookingByInfo(testData, "Đã từ chối");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút duyệt
        expect(booking.approveButton).to.be.null;
        
        await logout(driver);
    });

    // TC7: Duyệt đơn đã bị huỷ (trạng thái Cancelled) - Thất bại
    it('TC7: Duyệt đơn đã bị huỷ (trạng thái Cancelled) - Thất bại', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn L', 
            phone: '0987654332', 
            email: 'test12@example.com',
            date: getTomorrowDateFormatted(), 
            time: '21:15', 
            adults: '4' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'cancel');

        booking = await findBookingByInfo(testData, "Đã hủy");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút duyệt
        expect(booking.approveButton).to.be.null;
        
        await logout(driver);
    });

    // TC8: Duyệt lại đơn đã hoàn thành (trạng thái Completed) - Thất bại
    it('TC8: Duyệt lại đơn đã hoàn thành (trạng thái Completed) - Thất bại', async function () {
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn O', 
            phone: '0987654335', 
            email: 'test15@example.com',
            date: getTomorrowDateFormatted(), 
            time: '20:45', 
            adults: '2' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'approve');
        
        booking = await findBookingByInfo(testData, "Đã duyệt");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'complete');

        booking = await findBookingByInfo(testData, "Đã hoàn thành");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút duyệt
        expect(booking.approveButton).to.be.null;
        
        await logout(driver);
    });

    // // Test cases cho phần lọc đơn đặt bàn
    describe('Test Cases cho chức năng lọc đơn đặt bàn', function () {
        beforeEach(async function () {
            await driver.get(`${DOMAIN}/admin/login`);
            await login(driver, "admin", "123456");
            
            // Tạo một số đơn đặt bàn test
            const testOrders = [
                { 
                    fullName: 'Nguyễn Văn A', 
                    phone: '0987654321', 
                    email: 'test1@example.com',
                    date: getTomorrowDateFormatted(), 
                    time: '18:00', 
                    adults: '2' 
                },
                { 
                    fullName: 'Nguyễn Văn b', 
                    phone: '0987654322', 
                    email: 'test2@example.com',
                    date: getTomorrowDateFormatted(), 
                    time: '19:00', 
                    adults: '3' 
                },
                { 
                    fullName: 'Nguyễn Văn c', 
                    phone: '0987654323', 
                    email: 'test3@example.com',
                    date: getTomorrowDateFormatted(), 
                    time: '20:00', 
                    adults: '4' 
                }
            ];

            // Tạo từng đơn và xác nhận
            for (const order of testOrders) {
                await driver.get(DOMAIN);
                await placeOrder(driver, order);
                await clickButton(driver, '//*[@id="confirm-booking-details"]/button');
                await driver.sleep(1000);
                // Đợi và click nút OK trên thông báo
                await clickOkToast(driver);
                await driver.sleep(500); // Thêm delay ngắn sau mỗi lần tạo đơn
            }

            // Chuyển đến trang admin để xử lý đơn
            await driver.get(`${DOMAIN}/admin/all-bookings/`);
            await driver.sleep(1000); // Đợi trang load xong

            // Duyệt và từ chối một số đơn để có đa dạng trạng thái
            let bookings = await getBookingDetails(driver);
            
            // Xử lý đơn đầu tiên
            await changeBookingStatus(bookings[0], 'approve');
            await driver.sleep(1000); // Đợi hoàn tất thao tác
            
            // Refresh lại trang để lấy danh sách đơn mới
            await driver.get(`${DOMAIN}/admin/all-bookings/`);
            await driver.sleep(1000);
            bookings = await getBookingDetails(driver);
            
            // Xử lý đơn thứ hai
            await changeBookingStatus(bookings[1], 'reject');
            await driver.sleep(1000);
            
            // Đơn thứ 3 giữ nguyên trạng thái pending
        });

    //     // TC9: Lọc theo trạng thái Pending - Thành công
        it('TC9: Lọc theo trạng thái Pending - Thành công', async function () {
            const filteredBookings = await filterBookings(driver, {
                status: 'Chưa được xử lý'
            });
            
            expect(filteredBookings.length).to.be.greaterThan(0);
            filteredBookings.forEach(booking => {
                expect(booking.status).to.include('Chưa được xử lý');
            });
        });

        // TC10: Lọc theo trạng thái Approved - Thành công
        it('TC10: Lọc theo trạng thái Approved - Thành công', async function () {
            const filteredBookings = await filterBookings(driver, {
                status: 'Đã duyệt'
            });
            
            expect(filteredBookings.length).to.be.greaterThan(0);
            filteredBookings.forEach(booking => {
                expect(booking.status).to.include('Đã duyệt');
            });
        });

        // TC11: Lọc theo số điện thoại - Thành công
        it('TC11: Lọc theo số điện thoại - Thành công', async function () {
            const phoneNumber = '0987654321';
            const filteredBookings = await filterBookings(driver, {
                phone: phoneNumber
            });
            
            expect(filteredBookings.length).to.be.greaterThan(0);
            filteredBookings.forEach(booking => {
                expect(booking.phone).to.include(phoneNumber);
            });
        });

        // TC12: Lọc theo số giờ đến hạn - Thành công
        it('TC12: Lọc theo số giờ đến hạn - Thành công', async function () {
            const expiryHours = 24 // Lọc các đơn sẽ đến hạn trong 23h tới
            const filteredBookings = await filterBookings(driver, {
                expires_in_hours: expiryHours
            });
            
            expect(filteredBookings.length).to.be.greaterThan(0);
            // Kiểm tra thời gian đến của các đơn nằm trong khoảng 24h tới
            filteredBookings.forEach(booking => {
                const bookingTime = new Date(booking.arrivalTime);
                const now = new Date();
                const hoursDiff = (bookingTime - now) / (1000 * 60 * 60);
                expect(hoursDiff).to.be.at.most(expiryHours);
                expect(hoursDiff).to.be.at.least(0);
            });
        });

        // TC13: Lọc kết hợp nhiều tiêu chí - Thành công
        it('TC13: Lọc kết hợp nhiều tiêu chí - Thành công', async function () {
            const date = getTomorrowDateFormatted();
            const status = 'Đã duyệt';
            const phone = '0987654321';
            const expiryHours = 24;

            const filteredBookings = await filterBookings(driver, {
                date: date,
                status: status,
                phone: phone,
                expires_in_hours: expiryHours
            });
            
            expect(filteredBookings.length).to.be.greaterThan(0);
            filteredBookings.forEach(booking => {
                expect(booking.arrivalTime).to.include(convertDateFormat(date));
                expect(booking.status).to.include(status);
                expect(booking.phone).to.include(phone);
                
                // Kiểm tra thời gian đến hạn
                const bookingTime = new Date(booking.arrivalTime);
                const now = new Date();
                const hoursDiff = (bookingTime - now) / (1000 * 60 * 60);
                expect(hoursDiff).to.be.at.most(expiryHours);
                expect(hoursDiff).to.be.at.least(0);
            });
        });

    //     // TC14: Lọc với số điện thoại không tồn tại - Thành công (không có kết quả)
        it('TC14: Lọc với số điện thoại không tồn tại - Thành công (không có kết quả)', async function () {
            const filteredBookings = await filterBookings(driver, {
                phone: '0000000000'
            });
            
            expect(filteredBookings.length).to.equal(0);
        });

        afterEach(async function () {
            await logout(driver);
        });
    });
});
// White Box Testing - Test logic nghiệp vụ trực tiếp
describe('White Box Testing - Business Logic', function () {
    this.timeout(30000);

    // Helper function để đăng nhập admin và lấy session
    async function loginAdmin() {
        const loginResponse = await axios.post(`${DOMAIN}/api/admin/login`, {
            username: 'admin',
            password: '123456'
        });
        return loginResponse.headers['set-cookie'] || [];
    }

    // TC15: Test API updateReservationStatus - Reservation không tồn tại
    it('TC15: Test API updateReservationStatus - Reservation không tồn tại', async function () {
        const cookies = await loginAdmin();
        
        const response = await axios.put(`${DOMAIN}/api/reservations/update/99999`, {
            Status: 'Approved'
        }, {
            headers: {
                Cookie: cookies.join('; ')
            }
        }).catch(error => error.response);
        
        expect(response.status).to.equal(404);
        expect(response.data.message).to.include('Reservation not found');
    });
    // TC16: Test API updateReservationStatus - Status không hợp lệ
    it('TC16: Test API updateReservationStatus - Status không hợp lệ', async function () {
            
            const cookies = await loginAdmin();
            console.log('✅ Đăng nhập thành công');
            
            // Xóa dữ liệu test cũ trước khi tạo mới
            await cleanupTestData(cookies);
            
            // Tạo đơn test trước
            const testData = {
                Cus_Email: 'test@example.com',
                Cus_FullName: 'Test User',
                Cus_Phone: '0987654399',
                ArrivalTime: getTestDateTime(1, '18:00'),
                NumAdults: 2,
                NumChildren: 0,
                Note: ''
            };
            
            try {
                const createResponse = await axios.post(`${DOMAIN}/api/reservations/reserve`, testData, {
                    headers: {
                        Cookie: cookies.join('; ')
                    }
                });
                const reservationId = createResponse.data.reservation.ReservationID;
                console.log('✅ Tạo đơn thành công, ID:', reservationId);
                
                // Test với status không hợp lệ
                const response = await axios.put(`${DOMAIN}/api/reservations/update/${reservationId}`, {
                    Status: 'InvalidStatus'
                }, {
                    headers: {
                        Cookie: cookies.join('; ')
                    }
                }).catch(error => error.response);
                
                expect(response.status).to.equal(400);
                expect(response.data.message).to.include('Invalid status value');
                
                
            } catch (error) {
                console.error('❌ Lỗi trong test:', error.response?.data || error.message);
                throw error;
            }
        });
    // TC17: Test API rejectReservation - Đơn đã bị từ chối
    // it('TC17: Test API rejectReservation - Đơn đã bị từ chối', async function () {
    //     console.log('🔧 Bắt đầu test TC17...');
    //     const cookies = await loginAdmin();
    //     console.log('✅ Đăng nhập thành công');
    //     // Xóa dữ liệu test cũ trước khi tạo mới
    //     await cleanupTestData(cookies);
        
    //     // Tạo đơn test trước
    //     const testData = {
    //         Cus_Email: 'test3@example.com',
    //         Cus_FullName: 'Test User 3',
    //         Cus_Phone: '0987654397',
    //         ArrivalTime: getTestDateTime(1, '20:00'),
    //         NumAdults: 4,
    //         NumChildren: 0,
    //         Note: ''
    //     };

    //     console.log(`Creating test reservation with data: ${JSON.stringify(testData)}`);
        
    //     const createResponse = await axios.post(`${DOMAIN}/api/reservations/reserve`, testData, {
    //         headers: {
    //             Cookie: cookies.join('; ')
    //         }
    //     });
    //     const reservationId = createResponse.data.reservation.ReservationID;

    //     console.log(`Created reservation with ID: ${reservationId}`);
        
    //     // Từ chối lần đầu
    //     await axios.post(`${DOMAIN}/api/reservations/rejectReservation/${reservationId}`, {
    //         reject_reason: 'Lý do từ chối lần 1'
    //     }, {
    //         headers: {
    //             Cookie: cookies.join('; ')
    //         }
    //     });

    //     console.log("Rejected reservation for the first time done");
        
    //     // Từ chối lần thứ 2 (sẽ fail)
    //     const response = await axios.post(`${DOMAIN}/api/reservations/rejectReservation/${reservationId}`, {
    //         reject_reason: 'Lý do từ chối lần 2'
    //     }, {
    //         headers: {
    //             Cookie: cookies.join('; ')
    //         }
    //     }).catch(error => error.response);

    //     console.log("Rejected reservation for the second time done");
        
    //     expect(response.status).to.equal(400);
    //     expect(response.data.message).to.include('Đơn đặt chỗ đã bị từ chối');
    // });
}); 
