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

describe('Các testcase cho chức năng đặt đơn đặt chỗ', function () {
    this.timeout(15000)
    let driver;

    before(async function () {
        let options = new chrome.Options();
        // options.addArguments('--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');

        options.addArguments('--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
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

    it('Không nhập Họ Và Tên', async function () {
        await placeOrder(driver, { phone: '0987654321', email: 'nguyenvana@gmail.com', date: getTomorrowDateFormatted(), time: '18:00', adults: '2' });
        let message = await getErrorMessage("full-name-input");
        expect(message).to.equal('Trường họ và tên không được để trống!');
    });

    it('Nhập Họ và Tên chứa kí tự đặc biệt', async function () {
        await placeOrder(driver, { fullName: 'Nguyễn Văn A!', phone: '0987654321', email: 'nguyenvana@gmail.com', date: getTomorrowDateFormatted(), time: '18:00', adults: '2' });
        let message = await getErrorMessage("full-name-input");
        expect(message).to.equal('Trường họ và tên không hợp lệ!');
    });
    it('Nhập Họ và Tên chứa kí tự số', async function () {
        await placeOrder(driver, { fullName: 'Nguyễn Văn A6', phone: '0987654321', email: 'nguyenvana@gmail.com', date: getTomorrowDateFormatted(), time: '18:00', adults: '2' });
        let message = await getErrorMessage("full-name-input");
        expect(message).to.equal('Trường họ và tên không hợp lệ!');
    });
    it('Không nhập Số điện thoại', async function () {
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '', email: 'nguyenvana@gmail.com', date: getTomorrowDateFormatted(), time: '18:00', adults: '2' });
        let message = await getErrorMessage("phone-input");
        expect(message).to.equal('Số điện thoại không được để trống!');
    });
    it('Số điện thoại không hợp lệ', async function () {
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '12345', email: 'nguyenvana@gmail.com', date: getTomorrowDateFormatted(), time: '18:00', adults: '2' });
        let message = await getErrorMessage("phone-input");
        expect(message).to.equal('Số điện thoại không hợp lệ!');
    });

    it('Không nhập Ngày đặt', async function () {
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', time: '18:00', adults: '2' });
        let message = await getErrorMessage("date-input");
        expect(message).to.equal('Trường ngày đặt không được để trống!');
    });

    it('Không nhập giờ', async function () {
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: getTomorrowDateFormatted(), adults: '2' });
        let message = await getErrorMessage("time-inp");
        expect(message).to.equal('Trường giờ đặt không được để trống!');
    });

    it('Nhập số người lớn là số âm', async function () {
        this.timeout(10000)
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: '01-04-2025', time: '18:00', adults: '-1' });
        let message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Phải có ít nhất 1 người lớn!');
    });

    it('Nhập số người lớn là số 0', async function () {
        this.timeout(10000)
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: '01-04-2025', time: '18:00', adults: '0' });
        let message = await getErrorMessage("adults-count-input");
        expect(message).to.equal('Phải có ít nhất 1 người lớn!');
    });

    it('Nhập số trẻ em là số âm', async function () {
        this.timeout(10000)
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: '01-04-2025', time: '18:00', adults: '1', children: '-1' });
        let message = await getErrorMessage("children-count-input");
        expect(message).to.equal('Số trẻ em phải lớn hơn hoặc bằng 0!');
    });

    it('Nhập các trường đúng yêu cầu', async function () {
        this.timeout(10000)
        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: getTomorrowDateFormatted(), time: '19:00', adults: '2', children: '1', note: 'Bàn gần cửa sổ' });

        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")

        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');

    });

    

    it('Tạo đơn với thời gian là trong quá khứ', async function () {
        this.timeout(10000)
        const firstTime = getRelativeTimeFormatted(-1)
        const [date, time] = firstTime.split(' ')

        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date, time: time, adults: '2', children: '1', note: 'Bàn gần cửa sổ' });
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Thời gian đặt phải từ thời điểm hiện tại trở đi!');
    });

    it('Tạo đơn với thời gian cách thời gian hiện tại 2 tháng', async function () {
        this.timeout(10000)
        const nextDate = getRelativeDateFormatted(65) //61 ngày
        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: nextDate, time: "11:00", adults: '2', children: '1', note: 'Bàn gần cửa sổ' });
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Thời gian đặt không được quá 2 tháng kể từ thời điểm hiện tại!');
    });

    it('Tạo đơn cùng họ và tên, số điện thoại đặt vào thời gian nhỏ hơn 1 giờ', async function () {
        this.timeout(10000)
        const firstTime = getRelativeTimeFormatted(2) // lấy thời gian của 2 tiếng tới 
        const [date1, time1] = firstTime.split(" ")
        const sencondTime = addMinutesToDate(firstTime, 59) //59 phút kể từ firstTime
        const [date2, time2] = sencondTime.split(" ")

        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date1, time: time1, adults: '2', children: '1', note: 'Bàn gần cửa sổ' });
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button')

        await driver.get(DOMAIN)
        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date2, time: time2, adults: '2', children: '1', note: 'Bàn gần cửa sổ' });
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button')

        let message = await getMessageFromToast(driver)

        expect(message).to.equal('Bạn chỉ có thể đặt chỗ cách nhau ít nhất 1 giờ.');
    });
    it('Tạo đơn cùng họ và tên, số điện thoại đặt vào thời gian lớn hơn 1 giờ', async function () {
        this.timeout(10000)
        const firstTime = getRelativeTimeFormatted(2) // lấy thời gian của 2 tiếng tới 
        const [date1, time1] = firstTime.split(" ")
        const sencondTime = addMinutesToDate(firstTime, 61) //61 phút kể từ firstTime
        const [date2, time2] = sencondTime.split(" ")

        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date1, time: time1, adults: '2', children: '1', note: 'Bàn gần cửa sổ' });
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button')

        await driver.get(DOMAIN)
        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date2, time: time2, adults: '2', children: '1', note: 'Bàn gần cửa sổ' });
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button')

        let message = await getMessageFromToast(driver)

        expect(message).to.equal('Đặt bàn thành công');
    });

    it("Tra cứu đơn", async function () {
        this.timeout(15000)
        const firstTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date1, time1] = firstTime.split(" ")
        const dataR = { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date1, time: time1, adults: '2', children: '1', note: 'Bàn gần cửa sổ' }

        // Encode URL parameters để tránh lỗi với ký tự tiếng Việt
        const encodedPhone = encodeURIComponent(dataR.phone)
        const encodedName = encodeURIComponent(dataR.fullName)
        await driver.get(`${DOMAIN}/bookings-history/?Cus_Phone=${encodedPhone}&Cus_FullName=${encodedName}`)

        // Đợi trang load xong
        await driver.wait(until.elementLocated(By.tagName('main')), 5000)

        let cardElements
        try {
            cardElements = await driver.wait(until.elementsLocated(By.className('card-info')), 3000);
        } catch (e) {
            cardElements = []
        }
        let isHas = false;
        for (let i = 0; i < cardElements.length; i++) {
            let contentText = await cardElements[i].getText();
            // Kiểm tra tất cả điều kiện bằng .every()
            const isMatch = [
                dataR.time,
                dataR.fullName,
                dataR.phone,
                convertDateFormat(dataR.date),
                dataR.children,
                dataR.adults,
                dataR.note
            ].every(value => contentText.includes(String(value)));

            if (isMatch) {
                isHas = true;
                break; // Dừng vòng lặp ngay khi tìm thấy phần tử phù hợp
            }
        }
        expect(isHas).to.be.false;

        // Đặt bàn mới
        await driver.get(DOMAIN)
        await placeOrder(driver, dataR);
        await clickButton(driver, '//*[@id="confirm-booking-details"]/button/span')

        // Tra cứu lại sau khi đặt bàn
        await driver.get(`${DOMAIN}/bookings-history/?Cus_Phone=${encodedPhone}&Cus_FullName=${encodedName}`)

        // Đợi trang load và element xuất hiện
        await driver.wait(until.elementLocated(By.className('card-info')), 5000);
        cardElements = await driver.findElements(By.className('card-info'));
        
        isHas = false;
        for (let i = 0; i < cardElements.length; i++) {
            let contentText = await cardElements[i].getText();
            // Kiểm tra tất cả điều kiện bằng .every()
            const isMatch = [
                dataR.time,
                dataR.fullName,
                dataR.phone,
                convertDateFormat(dataR.date),
                dataR.children,
                dataR.adults,
                dataR.note
            ].every(value => contentText.includes(String(value)));

            if (isMatch) {
                isHas = true;
                break; // Dừng vòng lặp ngay khi tìm thấy phần tử phù hợp
            }
        }
        expect(isHas).to.be.true;
    })

    // Test cases cho email
    it('Không nhập Email', async function () {
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: '', date: date, time: time, adults: '2' });
        let message = await getErrorMessage("email-input");
        expect(message).to.equal('Trường email không được để trống!');
    });

    it('Email không hợp lệ - thiếu @', async function () {
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana.com', date: date, time: time, adults: '2' });
        let message = await getErrorMessage("email-input");
        expect(message).to.equal('Email không hợp lệ!');
    });

    it('Email không hợp lệ - thiếu domain', async function () {
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@', date: date, time: time, adults: '2' });
        let message = await getErrorMessage("email-input");
        expect(message).to.equal('Email không hợp lệ!');
    });

    it('Email không hợp lệ - có ký tự đặc biệt', async function () {
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyen!van@a.com', date: date, time: time, adults: '2' });
        let message = await getErrorMessage("email-input");
        expect(message).to.equal('Email không hợp lệ!');
    });

    it('Email hợp lệ', async function () {
        this.timeout(10000)
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: date, time: time, adults: '2' });
        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');
    });

    it('Email hợp lệ với dấu chấm', async function () {
        this.timeout(10000)
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyen.van.a@gmail.com', date: date, time: time, adults: '2' });
        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');
    });

    // Test cases cho giờ làm việc
    it('Đặt bàn trước giờ mở cửa', async function () {
        this.timeout(10000)
        const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: tomorrow, time: '07:00', adults: '2' });
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Nhà hàng chưa mở cửa vào thời gian này!');
    });

    it('Đặt bàn sau giờ đóng cửa', async function () {
        this.timeout(10000)
        const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: tomorrow, time: '23:00', adults: '2' });
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Nhà hàng đã đóng cửa vào thời gian này!');
    });

    it('Đặt bàn trong giờ làm việc', async function () {
        this.timeout(10000)
        const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: tomorrow, time: '12:00', adults: '2' });
        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');
    });

    // Test cases cho ngày nghỉ lễ
    it('Đặt bàn vào ngày nghỉ lễ - 1/1', async function () {
        this.timeout(10000)
        const nextMonth = dayjs().add(1, 'month')
        const newYearDate = nextMonth.format('DD/MM/YYYY')
        await placeOrder(driver, { fullName: 'Nguyễn Văn A', phone: '0987654321', email: 'nguyenvana@gmail.com', date: newYearDate, time: '12:00', adults: '2' });
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Nhà hàng đóng cửa vào ngày này!');
    });

    // Test case đặt bàn thành công với đầy đủ thông tin
    it('Đặt bàn thành công với đầy đủ thông tin', async function () {
        this.timeout(10000)
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
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

        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")

        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');
    });

    it('Tên hợp lệ với dấu tiếng Việt', async function () {
        this.timeout(10000)
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Thị Ánh', phone: '0987654321', email: 'nguyenthi@gmail.com', date: date, time: time, adults: '2' });
        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');
    });

    it('Số điện thoại hợp lệ với đầu số khác nhau', async function () {
        this.timeout(10000)
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Văn B', phone: '0371234567', email: 'nguyenvanb@gmail.com', date: date, time: time, adults: '2' });
        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');
    });

    it('Nhập các trường đúng yêu cầu', async function () {
        this.timeout(10000)
        const futureTime = getRelativeTimeFormatted(2) // 2 giờ tới
        const [date, time] = futureTime.split(' ')
        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date, time: time, adults: '2', children: '1', note: 'Bàn gần cửa sổ' });

        await clickButton(driver, "//*[@id='confirm-booking-details']/button/span")

        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Đặt bàn thành công');
    });

    it('Tạo đơn với thời gian nhỏ hơn 1 giờ từ hiện tại', async function () {
        this.timeout(10000)
        const tomorrow = dayjs().add(1, 'day')
        const shortTime = tomorrow.hour(12).minute(30) // 12:30 ngày mai
        const date = shortTime.format('DD/MM/YYYY')
        const time = shortTime.format('HH:mm')

        await placeOrder(driver, { fullName: 'Nguyễn Anh Tuấn', phone: '0987794267', email: 'nguyenanhtuan@gmail.com', date: date, time: time, adults: '2', children: '1', note: 'Bàn gần cửa sổ' });
        let message = await getMessageFromToast(driver)
        expect(message).to.equal('Thời gian đặt phải cách thời điểm hiện tại ít nhất 1 giờ!');
    });

});