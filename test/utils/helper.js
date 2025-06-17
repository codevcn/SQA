require('dotenv').config();
const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
require('chromedriver');
const axios = require('axios');
const chrome = require('selenium-webdriver/chrome');

const DOMAIN = process.env.DOMAIN;
function convertDateFormat(dateStr) {
    const [day, month, year] = dateStr.split('/'); // Tách ngày, tháng, năm
    return `${year}-${month}-${day}`; // Ghép theo định dạng YYYY-MM-DD
}

async function clickButton(driver, xpath, timeout = 5000) {
    try {
        // Chờ phần tử xuất hiện và sẵn sàng để click
        let confirmButton = await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
        confirmButton = await driver.wait(until.elementIsVisible(confirmButton), timeout);
        confirmButton = await driver.wait(until.elementIsEnabled(confirmButton), timeout);

       // Cuộn đến phần tử trước khi click
       await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", confirmButton);

       await confirmButton.click();
    } catch (error) {
        console.error(`Không thể click vào nút: ${xpath}`, error);
    }
}
async function getMessageFromToast(driver) {
    const element = await driver.wait(until.elementLocated(By.id("swal2-title")), 10000);
    await driver.wait(until.elementIsVisible(element), 10000);
    const message = await element.getText()
    return message
}
async function clickOkToast(driver) {
    let okButton = await driver.findElement(By.xpath("//button[contains(@class, 'swal2-confirm swal2-styled')]"));
    await okButton.click();
    await driver.wait(until.elementLocated(By.tagName("body")), 10000);
}
function getTomorrowDateFormatted() {
    let today = new Date();
    today.setDate(today.getDate() + 1); 

    let day = today.getDate().toString().padStart(2, '0');
    let month = (today.getMonth() + 1).toString().padStart(2, '0'); 
    let year = today.getFullYear();

    return `${day}/${month}/${year}`;
}
function getRelativeDateFormatted(x) {
    let targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + x); // Cộng/trừ x ngày

    let day = targetDate.getDate().toString().padStart(2, '0'); // Định dạng 2 chữ số
    let month = (targetDate.getMonth() + 1).toString().padStart(2, '0'); // Tháng +1 do tháng bắt đầu từ 0
    let year = targetDate.getFullYear();

    return `${day}/${month}/${year}`;
}
/**
 * Trả về ngày và giờ sau khi cộng/trừ số giờ nhất định.
 * 
 * @param {number} x - Số giờ cần cộng (dương) hoặc trừ (âm) so với thời gian hiện tại.
 * @returns {string} Ngày và giờ sau khi tính toán theo định dạng "dd/mm/yyyy HH:MM".
 */
function getRelativeTimeFormatted(x) {
    let targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + x); // Cộng/trừ số giờ

    let day = targetDate.getDate().toString().padStart(2, '0'); // Định dạng ngày 2 chữ số
    let month = (targetDate.getMonth() + 1).toString().padStart(2, '0'); // Định dạng tháng 2 chữ số
    let year = targetDate.getFullYear();
    let hours = targetDate.getHours().toString().padStart(2, '0'); // Định dạng giờ 2 chữ số
    let minutes = targetDate.getMinutes().toString().padStart(2, '0'); // Định dạng phút 2 chữ số

    return `${day}/${month}/${year} ${hours}:${minutes}:00`;
}
/**
 * Tính toán thời gian mới sau khi cộng/trừ số phút từ một thời gian cụ thể.
 * 
 * @param {string} y - Thời gian ban đầu theo định dạng "dd/mm/yyyy HH:MM".
 * @param {number} x - Số phút cần cộng (dương) hoặc trừ (âm).
 * @returns {string} - Thời gian mới theo định dạng "dd/mm/yyyy HH:MM".
 */
function addMinutesToDate(y, x) {
    // Tách ngày và giờ từ chuỗi đầu vào
    let [datePart, timePart] = y.split(' ');
    let [day, month, year] = datePart.split('/').map(Number);
    let [hours, minutes] = timePart.split(':').map(Number);

    // Tạo đối tượng Date
    let date = new Date(year, month - 1, day, hours, minutes); // month - 1 vì tháng trong JS bắt đầu từ 0

    // Cộng/trừ số phút
    date.setMinutes(date.getMinutes() + x);

    // Định dạng lại kết quả
    let newDay = date.getDate().toString().padStart(2, '0');
    let newMonth = (date.getMonth() + 1).toString().padStart(2, '0'); // Tháng +1 để đúng với định dạng dd/mm/yyyy
    let newYear = date.getFullYear();
    let newHours = date.getHours().toString().padStart(2, '0');
    let newMinutes = date.getMinutes().toString().padStart(2, '0');

    return `${newDay}/${newMonth}/${newYear} ${newHours}:${newMinutes}`;
}
module.exports = {convertDateFormat,addMinutesToDate,getRelativeTimeFormatted,clickButton,getMessageFromToast,clickOkToast,getTomorrowDateFormatted,getRelativeDateFormatted}