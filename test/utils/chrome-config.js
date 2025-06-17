const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/**
 * Tạo ChromeDriver với cấu hình tùy chỉnh
 * @param {Object} options - Chrome options
 * @returns {WebDriver} - Chrome driver instance
 */
async function createChromeDriver(options = {}) {
    const chromeOptions = new chrome.Options();
    
    // Thêm các options mặc định
    chromeOptions.addArguments('--no-sandbox');
    chromeOptions.addArguments('--disable-dev-shm-usage');
    chromeOptions.addArguments('--disable-gpu');
    
    // Thêm các options tùy chỉnh
    if (options.headless) {
        chromeOptions.addArguments('--headless');
    }
    
    if (options.windowSize) {
        chromeOptions.addArguments(`--window-size=${options.windowSize}`);
    }
    
    // Cấu hình ChromeDriver từ thư mục tùy chỉnh
    const chromeDriverPath = 'D:\\A_DOANMONHOC_NEW\\MONT4\\chrome-win64\\chromedriver.exe';
    const service = new chrome.ServiceBuilder(chromeDriverPath);
    
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .setChromeService(service)
        .build();
    
    // Cấu hình timeout mặc định
    await driver.manage().setTimeouts({ 
        implicit: options.implicitTimeout || 5000,
        pageLoad: options.pageLoadTimeout || 10000,
        script: options.scriptTimeout || 10000
    });
    
    return driver;
}

module.exports = {
    createChromeDriver
}; 