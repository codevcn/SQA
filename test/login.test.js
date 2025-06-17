require('dotenv').config();
const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
require('chromedriver');
const chrome = require('selenium-webdriver/chrome');

const DOMAIN = process.env.DOMAIN;
if (!DOMAIN) {
    throw new Error("DOMAIN environment variable is not set.");
}

console.log(`Testing on: ${DOMAIN}`);

// Hàm đăng nhập
async function login(driver, username, password) {
    try {
        if (username) {
            await driver.findElement(By.id("username-input")).sendKeys(username);
        }
        if (password) {
            await driver.findElement(By.id("password-input")).sendKeys(password, Key.RETURN);
        } else {
            await driver.findElement(By.id("password-input")).sendKeys(Key.RETURN);
        }

        // Chờ thông báo xuất hiện
        const alertElement = await driver.wait(until.elementLocated(By.id("swal2-title")), 10000);
        await driver.wait(until.elementIsVisible(alertElement), 10000);
        const message = await alertElement.getText();

        // Nhấn nút xác nhận trong hộp thoại cảnh báo
        const okButton = await driver.findElement(By.xpath("//button[contains(@class, 'swal2-confirm swal2-styled')]"));
        await okButton.click();

        // Chờ quay lại trang chính
        await driver.wait(until.elementLocated(By.tagName("body")), 10000);

        return message;
    } catch (error) {
        console.error(`Error in login function: ${error.message}`);
        throw error;
    }
}

// Hàm đăng xuất
async function logout(driver) {
    try {
        await driver.findElement(By.id("logout-btn")).click();
        const okButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(@class, 'swal2-confirm swal2-styled')]")),
            5000
        );
        await okButton.click();

        // Chờ quay lại màn hình đăng nhập
        await driver.wait(until.elementLocated(By.id("login_with_admin")), 10000);
    } catch (error) {
        console.error(`Error in logout function: ${error.message}`);
        throw error;
    }
}

// Test suite
describe('Nhóm testcase cho chức năng đăng nhập', function () {
    this.timeout(15000); // Tăng timeout để tránh lỗi timeout khi chạy kiểm thử
    let driver;

    before(async function () {
        let options = new chrome.Options();
        // options.addArguments('--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'); // Uncomment nếu cần chạy headless
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
        await driver.manage().setTimeouts({ implicit: 5000 });
    });

    after(async function () {
        if (driver) {
            await driver.quit();
        }
    });

    beforeEach(async function () {
        await driver.get(`${DOMAIN}/admin/login/`);
    });

    it('Đăng nhập với username và password chính xác', async function () {
        const message = await login(driver, 'admin', '123456');
        expect(message).to.equal('Đăng nhập thành công.');
        await logout(driver);
    });

    it('Đăng nhập với username đúng và mật khẩu sai', async function () {
        const message = await login(driver, 'admin', 'wrong_pass');
        expect(message).to.equal('Thông tin đăng nhập không chính xác.');
    });

    it('Đăng nhập với username và password đều sai', async function () {
        const message = await login(driver, 'wrong_user', 'wrong_pass');
        expect(message).to.equal('Thông tin đăng nhập không chính xác.');
    });

    it('Đăng nhập mà không nhập password', async function () {
        const message = await login(driver, 'admin', null);
        expect(message).to.equal('Trường mật khẩu không được để trống!');
    });

    it('Đăng nhập mà không nhập username', async function () {
        const message = await login(driver, null, '123456');
        expect(message).to.equal('Trường username không được để trống!');
    });
});
