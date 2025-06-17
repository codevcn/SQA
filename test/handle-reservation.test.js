require('dotenv').config();
const { By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const axios = require('axios');
const { createChromeDriver } = require('./utils/chrome-config');

const DOMAIN = process.env.DOMAIN;
console.log(`Testing on: ${DOMAIN}`);

const { convertDateFormat, getTomorrowDateFormatted, clickButton, clickOkToast } = require("./utils/helper")
const { login, logout, placeOrder,getBookingDetails } = require("./utils/func")

describe('Các testcase cho Admin', function () {
    this.timeout(15000)
    let driver;

    before(async function () {
        // Sử dụng helper để tạo ChromeDriver
        driver = await createChromeDriver({
            headless: false, // Set true nếu muốn chạy headless
            windowSize: '1920,1080',
            implicitTimeout: 5000
        });
    });

    after(async function () {
        if (driver) {
            await driver.get(`${DOMAIN}/api/admin/logout`)
            await driver.quit();
        }
    });
    beforeEach(async function () {
        await axios.get(`${DOMAIN}/reset-database`);
    });
    it("Từ chối đơn đặt chỗ", async function () {
        this.timeout(20000)
        //Đăng nhập
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456")
        await driver.get(DOMAIN)

        const dataTest = { fullName: 'Nguyễn Văn A', phone: '0987654321', date: getTomorrowDateFormatted(), time: '18:00', adults: '2' }
        await placeOrder(driver, dataTest);
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button')
        await driver.sleep(1)

        // await clickButton(driver,'//*[@id="complete-booking-btn"]/span')
        await driver.get(`${DOMAIN}/admin/all-bookings/`)
        let bookingList = await getBookingDetails(driver);
        let book = bookingList.find(
            (value) =>
                value.fullName.trim().includes(dataTest.fullName.trim()) &&
                value.phone.trim().includes(dataTest.phone.trim()) &&
                value.status.trim().includes("Chưa được xử lý") &&
                value.arrivalTime.trim().includes(convertDateFormat(dataTest.date)) &&
                value.arrivalTime.trim().includes((dataTest.time))
        );
        expect(book).to.exist;
        if (book) {
            book.rejectButton.click()
        }
        await driver.sleep(1)
        await clickButton(driver, '//*[@id="confirm-reject-form"]/div[2]/button')
        await driver.sleep(1)
        await clickOkToast(driver)

        await driver.sleep(3000)
        await driver.get(`${DOMAIN}/admin/all-bookings/`)
        bookingList = await getBookingDetails(driver);
        book = bookingList.find(
            (value) =>
                value.fullName.trim().includes(dataTest.fullName.trim()) &&
                value.phone.trim().includes(dataTest.phone.trim()) &&
                value.status.trim().includes("Đã từ chối") &&
                value.arrivalTime.trim().includes(convertDateFormat(dataTest.date)) &&
                value.arrivalTime.trim().includes((dataTest.time))
        );
        expect(book).to.exist;
        await logout(driver)
    })
    it("Duyệt đơn đặt chỗ", async function () {
        this.timeout(20000)
        //Đăng nhập
        await driver.get(`${DOMAIN}/admin/login`);
        await login(driver, "admin", "123456")
        await driver.get(DOMAIN)

        const dataTest = { fullName: 'Nguyễn Văn A', phone: '0987654321', date: getTomorrowDateFormatted(), time: '18:00', adults: '2' }
        await placeOrder(driver, dataTest);
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button')
        await driver.sleep(1)

        // await clickButton(driver,'//*[@id="complete-booking-btn"]/span')
        await driver.get(`${DOMAIN}/admin/all-bookings/`)
        let bookingList = await getBookingDetails(driver);
        let book = bookingList.find(
            (value) =>
                value.fullName.trim().includes(dataTest.fullName.trim()) &&
                value.phone.trim().includes(dataTest.phone.trim()) &&
                value.status.trim().includes("Chưa được xử lý") &&
                value.arrivalTime.trim().includes(convertDateFormat(dataTest.date)) &&
                value.arrivalTime.trim().includes((dataTest.time))
        );
        expect(book).to.exist;
        if (book) {
            book.approveButton.click()
        }
        await driver.sleep(1)
        await clickButton(driver, '//*[@id="confirm-complete-form"]/div/button/span')
        await driver.sleep(1)
        await clickOkToast(driver)


        await driver.get(`${DOMAIN}/admin/all-bookings/`)
        bookingList = await getBookingDetails(driver);
        book = bookingList.find(
            (value) =>
                value.fullName.trim().includes(dataTest.fullName.trim()) &&
                value.phone.trim().includes(dataTest.phone.trim()) &&
                value.status.trim().includes("Đã duyệt") &&
                value.arrivalTime.trim().includes(convertDateFormat(dataTest.date)) &&
                value.arrivalTime.trim().includes((dataTest.time))
        );
        expect(book).to.exist;
        await logout(driver)
    })
});
