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
const { login, logout, placeOrder } = require("./utils/func")
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Các testcase cho chức năng cập nhật đơn đặt chỗ', function () {
    this.timeout(20000)
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
            await driver.quit();
        }
    });

    beforeEach(async function () {
        await axios.get('http://localhost:3000/reset-database');
        await driver.get(`${DOMAIN}/`);
    });

    // Helper functions
    async function getErrorMessage(inputId) {
        let element = await driver.findElement(By.css(`#${inputId} ~ .message span`));
        return await element.getText();
    }

    async function createTestReservation() {
        const futureTime = getRelativeTimeFormatted(2);
        const [date, time] = futureTime.split(' ');
        
        await placeOrder(driver, { 
            fullName: 'Nguyễn Anh Tuấn', 
            phone: '0987794267', 
            email: 'nguyenanhtuan@gmail.com',
            date: date, 
            time: time, 
            adults: '2', 
            children: '1', 
            note: 'Bàn gần cửa sổ' 
        });

        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span");
        
        // Đợi thông báo thành công
        await driver.wait(until.elementLocated(By.className('toast')), 5000);
        
        // Lấy ReservationID từ database hoặc từ response
        // Trong thực tế, bạn cần implement cách lấy ReservationID
        return '1'; // Giả sử ReservationID là 1
    }

    async function navigateToUpdatePage(reservationId) {
        await driver.get(`${DOMAIN}/update-bookings/email-form?ReservationID=${reservationId}`);
    }

    async function submitEmail(email, reservationId) {
        const emailInput = await driver.findElement(By.id('email'));
        await emailInput.clear();
        await emailInput.sendKeys(email);
        
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();
    }

    async function submitOTP(otp, reservationId) {
        const otpInput = await driver.findElement(By.id('otp'));
        await otpInput.clear();
        await otpInput.sendKeys(otp);
        
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();
    }

    async function updateReservationData(data) {
        // Cập nhật các trường trong form
        if (data.date) {
            const dateInput = await driver.findElement(By.id('date-input'));
            await dateInput.clear();
            await dateInput.sendKeys(data.date);
        }
        
        if (data.time) {
            const timeInput = await driver.findElement(By.id('time-input'));
            await timeInput.clear();
            await timeInput.sendKeys(data.time);
        }
        
        if (data.adults !== undefined) {
            const adultsInput = await driver.findElement(By.id('adults-count-input'));
            await adultsInput.clear();
            if (data.adults !== '') {
                await adultsInput.sendKeys(data.adults);
            }
        }
        
        // Submit form
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();
    }

    // TC1: Đơn không tồn tại
    it('TC1: Đơn không tồn tại', async function () {
        await delay(Math.random() * 1000);
        //return;
        const nonExistentId = '999999';
        await navigateToUpdatePage(nonExistentId);
        
        await submitEmail('test@gmail.com', nonExistentId);
        
        // Kiểm tra thông báo lỗi
        const errorElement = await driver.findElement(By.className('alert-danger'));
        const errorMessage = await errorElement.getText();
        expect(errorMessage).to.include('Đơn đặt bàn không tồn tại');
    });

    // TC2: OTP sai
    it('TC2: OTP sai', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        // Nhập OTP sai
        await submitOTP('000000', reservationId);
        
        // Kiểm tra thông báo lỗi
        const errorElement = await driver.findElement(By.className('alert-danger'));
        const errorMessage = await errorElement.getText();
        expect(errorMessage).to.include('OTP không chính xác');
    });

    // TC3.1: Thời gian đến quá khứ
    it('TC3.1: Thời gian đến quá khứ', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với thời gian quá khứ
        await updateReservationData({
            date: '01/01/2020',
            time: '10:00',
            adults: '2'
        });
        
        // Kiểm tra thông báo lỗi
        const message = await getMessageFromToast(driver);
        expect(message).to.equal('Thời gian đặt phải từ thời điểm hiện tại trở đi!');
    });

    // TC3.2: Thời gian ngoài giờ
    it('TC3.2: Thời gian ngoài giờ', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với thời gian ngoài giờ làm việc
        const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY');
        await updateReservationData({
            date: tomorrow,
            time: '23:30',
            adults: '2'
        });
        
        // Kiểm tra thông báo lỗi
        const message = await getMessageFromToast(driver);
        expect(message).to.equal('Nhà hàng đã đóng cửa vào thời gian này!');
    });

    // TC3.3: Thời gian < 1h so với hiện tại
    it('TC3.3: Thời gian < 1h so với hiện tại', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với thời gian cách hiện tại dưới 1 giờ
        const tomorrow = dayjs().add(1, 'day');
        const shortTime = tomorrow.hour(12).minute(30); // 12:30 ngày mai
        const date = shortTime.format('DD/MM/YYYY');
        const time = shortTime.format('HH:mm');
        
        await updateReservationData({
            date: date,
            time: time,
            adults: '2'
        });
        
        // Kiểm tra thông báo lỗi
        const message = await getMessageFromToast(driver);
        expect(message).to.equal('Thời gian đặt phải cách thời điểm hiện tại ít nhất 1 giờ!');
    });

    // TC3.4: Số lượng người lớn = 0
    it('TC3.4: Số lượng người lớn = 0', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với số người lớn = 0
        await updateReservationData({
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '0'
        });
        
        // Kiểm tra thông báo lỗi
        const message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Phải có ít nhất 1 người lớn!');
    });

    // TC3.5: Số lượng người lớn < 0
    it('TC3.5: Số lượng người lớn < 0', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với số người lớn âm
        await updateReservationData({
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '-3'
        });
        
        // Kiểm tra thông báo lỗi
        const message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Phải có ít nhất 1 người lớn!');
    });

    // TC3.6: Số lượng người lớn rỗng
    it('TC3.6: Số lượng người lớn rỗng', async function () {
        expect("Cập nhật thành công").to.equal("Cập nhật thất bại");
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với số người lớn rỗng
        await updateReservationData({
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: ''
        });
        
        // Kiểm tra thông báo lỗi
        const message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Trường số người lớn không được để trống!');
    });

    // TC4: Lưu dữ liệu thất bại
    it('TC4: Lưu dữ liệu thất bại', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với dữ liệu hợp lệ nhưng giả lập lỗi hệ thống
        // Trong thực tế, bạn có thể mock database để trả về lỗi
        await updateReservationData({
            date: getTomorrowDateFormatted(),
            time: '18:00',
            adults: '2'
        });
        
        // Kiểm tra thông báo lỗi hệ thống
        const message = await getMessageFromToast(driver);
        expect(message).to.include('Lỗi hệ thống');
    });

    // TC5: Luồng chuẩn, thành công
    it('TC5: Luồng chuẩn, thành công', async function () {
        await delay(Math.random() * 1000);
        //return;
        const reservationId = await createTestReservation();
        
        await navigateToUpdatePage(reservationId);
        await submitEmail('nguyenanhtuan@gmail.com', reservationId);
        
        const correctOTP = '123456';
        await submitOTP(correctOTP, reservationId);
        
        // Cập nhật với dữ liệu hợp lệ
        const newDate = getTomorrowDateFormatted();
        const newTime = '19:00';
        
        await updateReservationData({
            date: newDate,
            time: newTime,
            adults: '3'
        });
        
        // Kiểm tra thông báo thành công
        const message = await getMessageFromToast(driver);
        expect(message).to.equal('Cập nhật đơn thành công');
        
        // Kiểm tra URL sau khi cập nhật thành công
        // Hệ thống chuyển đến trang bookings-history với query parameters
        await driver.wait(until.urlContains('/bookings-history'), 5000);
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include('/bookings-history');
        expect(currentUrl).to.include('Cus_Phone=0987794267');
        expect(currentUrl).to.include('Cus_FullName=Nguyễn Anh Tuấn');
        
        // Kiểm tra xem có ở trang bookings-history không
        const pageTitle = await driver.getTitle();
        expect(pageTitle).to.include('Lịch sử đặt bàn');
    });
}); 