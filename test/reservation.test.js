require('dotenv').config();
const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
require('chromedriver');
const axios = require('axios');
const chrome = require('selenium-webdriver/chrome');
const dayjs = require('dayjs');

const DOMAIN = process.env.DOMAIN;
console.log(`Testing on: ${DOMAIN}`);

const { convertDateFormat, addMinutesToDate, getRelativeTimeFormatted, getTomorrowDateFormatted, getMessageFromToast, clickButton, clickOkToast, getRelativeDateFormatted } = require("./utils/helper")
const { login, logout, placeOrder, getBookingDetails } = require("./utils/func")

describe('Các testcase cho chức năng đặt đơn đặt chỗ', function () {
    this.timeout(15000)
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

        options.addArguments('--log-level=3');  // 3 = ERROR
        options.addArguments('--silent');
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
            await driver.quit();
        }
    });

    beforeEach(async function () {
        await axios.get('http://localhost:3000/reset-database');
        await driver.get(`${DOMAIN}/`);
    });

    async function getErrorMessage(inputId) {
        let element = await driver.findElement(By.css(`#${inputId} ~ .message span`));
        return await element.getText();
    }

    // TC1: C1 – Họ tên - "Nguyen@VanA" - Ký tự đặc biệt
    it('TC1: Họ tên chứa ký tự đặc biệt', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyen@VanA',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2'
        });
        let message = await getErrorMessage("full-name-input");
        expect(message).to.equal('Trường họ và tên không hợp lệ!');
    });

    // TC2: C1 – Họ tên - "Nguyen 9A" - Chứa số
    it('TC2: Họ tên chứa ký tự số', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyen 9A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2'
        });
        let message = await getErrorMessage("full-name-input");
        expect(message).to.equal('Trường họ và tên không hợp lệ!');
    });

    // TC3: C1 – Họ tên - "" - Rỗng
    it('TC3: Họ tên rỗng', async function () {
        await placeOrder(driver, {
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2'
        });
        let message = await getErrorMessage("full-name-input");
        expect(message).to.equal('Trường họ và tên không được để trống!');
    });

    // TC4: C2 – SĐT - "12345" - Dưới 10 số
    it('TC4: Số điện thoại dưới 10 số', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '12345',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2'
        });
        let message = await getErrorMessage("phone-input");
        expect(message).to.equal('Số điện thoại không hợp lệ!');
    });

    // TC5: C2 – SĐT - "09ab567890" - Có ký tự chữ
    it('TC5: Số điện thoại chứa ký tự chữ', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '09ab567890',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2'
        });
        let message = await getErrorMessage("phone-input");
        expect(message).to.equal('Số điện thoại không hợp lệ!');
    });

    // TC6: C2 – SĐT - "" - Rỗng
    it('TC6: Số điện thoại rỗng', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2'
        });
        let message = await getErrorMessage("phone-input");
        expect(message).to.equal('Số điện thoại không được để trống!');
    });

    // TC7: C3 – Email - "abcgmail.com" - Thiếu ký tự @
    it('TC7: Email thiếu ký tự @', async function () {
        const futureTime = getRelativeTimeFormatted(2);
        const [date, time] = futureTime.split(' ');
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'abcgmail.com',
            date: date,
            time: time,
            adults: '2'
        });
        let message = await getErrorMessage("email-input");
        expect(message).to.equal('Email không hợp lệ!');
    });

    // TC8: C3 – Email - "" - Rỗng
    it('TC8: Email rỗng', async function () {
        const futureTime = getRelativeTimeFormatted(2);
        const [date, time] = futureTime.split(' ');
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: '',
            date: date,
            time: time,
            adults: '2'
        });
        let message = await getErrorMessage("email-input");
        expect(message).to.equal('Trường email không được để trống!');
    });

    // TC9: C4 – Ngày giờ - "23:30 12/08/2025" - Ngoài khung giờ
    it('TC9: Đặt bàn ngoài khung giờ làm việc', async function () {
        const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY');
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: tomorrow,
            time: '23:30',
            adults: '2'
        });
        let message = await getMessageFromToast(driver);
        expect(message).to.equal('Nhà hàng đã đóng cửa vào thời gian này!');
    });

    // TC10: C4 – Ngày giờ - "10:00 01/01/2022" - Quá khứ
    it('TC10: Đặt bàn trong quá khứ', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: '01/01/2022',
            time: '10:00',
            adults: '2'
        });
        let message = await getMessageFromToast(driver);
        expect(message).to.equal('Thời gian đặt phải cách thời điểm hiện tại ít nhất 1 giờ!');
    });

    // TC11: C4 – Ngày giờ - "" - Rỗng
    it('TC11: Ngày đặt rỗng', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            time: '18:00',
            adults: '2'
        });
        let message = await getErrorMessage("date-input");
        expect(message).to.equal('Trường ngày đặt không được để trống!');
    });

    // TC12: C5 – Thời điểm - Hiện tại + 30 phút - Cách hiện tại < 1 giờ
    it('TC12: Đặt bàn cách hiện tại dưới 1 giờ', async function () {
        const now = dayjs();
        const shortTime = now.add(30, 'minute');
        const date = shortTime.format('DD/MM/YYYY');
        const time = shortTime.format('HH:mm');

        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: date,
            time: time,
            adults: '2'
        });
        let message = await getMessageFromToast(driver);
        expect(message).to.equal('Thời gian đặt phải cách thời điểm hiện tại ít nhất 1 giờ!');
    });

    // TC13: C6 – Ngày nghỉ - "01/01/2025" - Ngày nhà hàng nghỉ
    it('TC13: Đặt bàn vào ngày nghỉ lễ', async function () {
        const nextMonth = dayjs().add(1, 'month');
        const newYearDate = nextMonth.format('DD/MM/YYYY');
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: '01/01/2026',
            time: '12:00',
            adults: '2'
        });
        let message = await getMessageFromToast(driver);
        expect(message).to.equal('Nhà hàng đóng cửa vào ngày này!');
    });

    // TC14: C6 – Ngày nghỉ - "" - Rỗng (đã test ở TC11)
    it('TC14: Giờ đặt rỗng', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            adults: '2'
        });
        let message = await getErrorMessage("time-inp");
        expect(message).to.equal('Trường giờ đặt không được để trống!');
    });

    // TC15: C7 – Số lượng người lớn - 0 - Bằng 0
    it('TC15: Số người lớn bằng 0', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '0'
        });
        let message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Phải có ít nhất 1 người lớn!');
    });

    // TC16: C7 – Số lượng người lớn - -3 - Âm
    it('TC16: Số người lớn âm', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '-3'
        });
        let message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Phải có ít nhất 1 người lớn!');
    });

    // TC17: C7 – Số lượng người lớn - "" - Rỗng
    it('TC17: Số người lớn rỗng', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00'
        });
        let message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Phải có ít nhất 1 người lớn!');
    });

    // TC18: C8 – Số lượng trẻ em - -2 - Âm
    it('TC18: Số lượng trẻ em âm', async function () {
        await placeOrder(driver, {
            fullName: 'Nguyễn Văn A',
            phone: '0987654321',
            email: 'nguyenvana@gmail.com',
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2',
            children: '-2'
        });
        let message = await getErrorMessage("children-count-input");
        expect(message).to.equal('Số trẻ em phải lớn hơn hoặc bằng 0!');
    });

    // TC19: Tất cả hợp lệ - Tất cả giá trị hợp lệ - Đặt bàn thành công
    it('TC19: Đặt bàn thành công với tất cả thông tin hợp lệ', async function () {
        const fullName = 'Nguyễn Anh Tuấn';
        const phone = '0987794267';
        const email = 'nguyenanhtuan@gmail.com';
        const note = 'Bàn gần cửa sổ';
        const adults = '2';
        const children = '1';
        const futureTime = getRelativeTimeFormatted(2); // 2 giờ tới
        const [date, time] = futureTime.split(' ');

        await placeOrder(driver, {
            fullName,
            phone,
            email,
            date: date,
            time: '12:00',
            adults,
            children,
            note
        });

        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span");

        let message = await getMessageFromToast(driver);
        expect(message).to.equal('Đặt bàn thành công');
        await clickOkToast(driver);

        // Chuyển hướng sang trang tra cứu với query đúng
        const encodedName = encodeURIComponent(fullName);
        const encodedPhone = encodeURIComponent(phone);
        await driver.get(`${DOMAIN}/bookings-history/?Cus_Phone=${encodedPhone}&Cus_FullName=${encodedName}`);

        // Lấy danh sách booking-card và kiểm tra thông tin
        const bookings = await getBookingDetails(driver);
        // Kiểm tra có ít nhất 1 booking đúng thông tin
        const found = bookings.some(b =>
            b.fullName.includes(fullName) &&
            b.phone.includes(phone) &&
            b.note.includes(note) &&
            b.adultsChildren.includes(adults) &&
            b.status // Có trạng thái
        );
        expect(found).to.equal(true);
    });



}); 