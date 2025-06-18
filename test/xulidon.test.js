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
const { login, logout, placeOrder, getBookingDetails } = require("./utils/func");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Test Cases cho chức năng xử lý đơn đặt chỗ', function () {
    this.timeout(30000);
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
                await clickButton(driver, '//*[@id="confirm-cancel-form"]/div[2]/button');
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

    // TC4: Hoàn thành đơn khi trạng thái Pending - Thất bại (TEST FAIL)
    it('TC4: Hoàn thành đơn khi trạng thái Pending - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn D', 
            phone: '0987654324', 
            email: 'test4@example.com',
            date: getTomorrowDateFormatted(), 
            time: '21:00', 
            adults: '2' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        
        // Test này sẽ fail vì cố gắng hoàn thành đơn pending
        try {
            await changeBookingStatus(booking, 'complete');
            // Nếu thành công thì test fail
            expect.fail('Should not be able to complete pending booking');
        } catch (error) {
            // Mong đợi lỗi
            expect(error.message).to.include('not available');
        }
        
        await logout(driver);
    });

    // TC5: Hoàn thành đơn khi trạng thái Approved - Thành công
    it('TC5: Hoàn thành đơn khi trạng thái Approved - Thành công', async function () {
        
        
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

    // TC6: Huỷ đơn khi trạng thái Approved - Thành công
    it('TC6: Huỷ đơn khi trạng thái Approved - Thành công', async function () {
        
        
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

    // TC7: Duyệt lại đơn khi trạng thái Approved - Thất bại
    it('TC7: Duyệt lại đơn khi trạng thái Approved - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn G', 
            phone: '0987654327', 
            email: 'test7@example.com',
            date: getTomorrowDateFormatted(), 
            time: '20:30', 
            adults: '2' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'approve');

        booking = await findBookingByInfo(testData, "Đã duyệt");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút duyệt
        expect(booking.approveButton).to.be.null;
        
        await logout(driver);
    });

    // TC8: Từ chối lại đơn khi trạng thái Approved - Thất bại
    it('TC8: Từ chối lại đơn khi trạng thái Approved - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn H', 
            phone: '0987654328', 
            email: 'test8@example.com',
            date: getTomorrowDateFormatted(), 
            time: '21:30', 
            adults: '4' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'approve');

        booking = await findBookingByInfo(testData, "Đã duyệt");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút từ chối
        expect(booking.rejectButton).to.be.null;
        
        await logout(driver);
    });

    // TC9: Duyệt đơn đã bị từ chối (trạng thái Rejected) - Thất bại
    it('TC9: Duyệt đơn đã bị từ chối (trạng thái Rejected) - Thất bại', async function () {
        
        
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

    // TC10: Hoàn thành đơn đã bị từ chối (trạng thái Rejected) - Thất bại
    it('TC10: Hoàn thành đơn đã bị từ chối (trạng thái Rejected) - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn J', 
            phone: '0987654330', 
            email: 'test10@example.com',
            date: getTomorrowDateFormatted(), 
            time: '19:15', 
            adults: '3' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'reject');

        booking = await findBookingByInfo(testData, "Đã từ chối");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút hoàn thành
        try {
            await driver.findElement(By.id('complete-booking-btn'));
            expect.fail('Complete button should not be available for rejected booking');
        } catch (error) {
            expect(error.name).to.equal('NoSuchElementError');
        }
        
        await logout(driver);
    });

    // TC11: Huỷ đơn đã bị từ chối (trạng thái Rejected) - Thất bại
    it('TC11: Huỷ đơn đã bị từ chối (trạng thái Rejected) - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn K', 
            phone: '0987654331', 
            email: 'test11@example.com',
            date: getTomorrowDateFormatted(), 
            time: '20:15', 
            adults: '2' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'reject');

        booking = await findBookingByInfo(testData, "Đã từ chối");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút hủy
        try {
            await driver.findElement(By.id('cancel-booking-btn'));
            expect.fail('Cancel button should not be available for rejected booking');
        } catch (error) {
            expect(error.name).to.equal('NoSuchElementError');
        }
        
        await logout(driver);
    });

    // TC12: Duyệt đơn đã bị huỷ (trạng thái Cancelled) - Thất bại
    it('TC12: Duyệt đơn đã bị huỷ (trạng thái Cancelled) - Thất bại', async function () {
        
        
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

    // TC13: Hoàn thành đơn đã bị huỷ (trạng thái Cancelled) - Thất bại
    it('TC13: Hoàn thành đơn đã bị huỷ (trạng thái Cancelled) - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn M', 
            phone: '0987654333', 
            email: 'test13@example.com',
            date: getTomorrowDateFormatted(), 
            time: '18:45', 
            adults: '2' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'cancel');

        booking = await findBookingByInfo(testData, "Đã hủy");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút hoàn thành
        try {
            await driver.findElement(By.id('complete-booking-btn'));
            expect.fail('Complete button should not be available for cancelled booking');
        } catch (error) {
            expect(error.name).to.equal('NoSuchElementError');
        }
        
        await logout(driver);
    });

    // TC14: Từ chối đơn đã bị huỷ (trạng thái Cancelled) - Thất bại
    it('TC14: Từ chối đơn đã bị huỷ (trạng thái Cancelled) - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn N', 
            phone: '0987654334', 
            email: 'test14@example.com',
            date: getTomorrowDateFormatted(), 
            time: '19:45', 
            adults: '3' 
        };
        await createTestReservation(testData);

        let booking = await findBookingByInfo(testData, "Chưa được xử lý");
        expect(booking).to.exist;
        await changeBookingStatus(booking, 'cancel');

        booking = await findBookingByInfo(testData, "Đã hủy");
        expect(booking).to.exist;
        
        // Kiểm tra không có nút từ chối
        expect(booking.rejectButton).to.be.null;
        
        await logout(driver);
    });

    // TC15: Duyệt lại đơn đã hoàn thành (trạng thái Completed) - Thất bại
    it('TC15: Duyệt lại đơn đã hoàn thành (trạng thái Completed) - Thất bại', async function () {
        
        
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

    // TC16: Hoàn thành lại đơn đã hoàn thành (trạng thái Completed) - Thất bại (TEST FAIL)
    it('TC16: Hoàn thành lại đơn đã hoàn thành (trạng thái Completed) - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn P', 
            phone: '0987654336', 
            email: 'test16@example.com',
            date: getTomorrowDateFormatted(), 
            time: '21:45', 
            adults: '4' 
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
        
        // Test này sẽ fail vì cố gắng hoàn thành lại đơn đã hoàn thành
        try {
            await driver.findElement(By.id('complete-booking-btn'));
            expect.fail('Complete button should not be available for completed booking');
        } catch (error) {
            expect(error.name).to.equal('NoSuchElementError');
        }
        
        await logout(driver);
    });

    // TC17: Từ chối lại đơn đã hoàn thành (trạng thái Completed) - Thất bại
    it('TC17: Từ chối lại đơn đã hoàn thành (trạng thái Completed) - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn Q', 
            phone: '0987654337', 
            email: 'test17@example.com',
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
        
        // Kiểm tra không có nút từ chối
        expect(booking.rejectButton).to.be.null;
        
        await logout(driver);
    });

    // TC18: Huỷ lại đơn đã hoàn thành (trạng thái Completed) - Thất bại (TEST FAIL)
    it('TC18: Huỷ lại đơn đã hoàn thành (trạng thái Completed) - Thất bại', async function () {
        
        
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456");

        const testData = { 
            fullName: 'Nguyễn Văn R', 
            phone: '0987654338', 
            email: 'test18@example.com',
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
        await changeBookingStatus(booking, 'complete');

        booking = await findBookingByInfo(testData, "Đã hoàn thành");
        expect(booking).to.exist;
        
        // Test này sẽ fail vì cố gắng hủy đơn đã hoàn thành
        try {
            await driver.findElement(By.id('cancel-booking-btn'));
            expect.fail('Cancel button should not be available for completed booking');
        } catch (error) {
            expect(error.name).to.equal('NoSuchElementError');
        }
        
        await logout(driver);
    });
}); 