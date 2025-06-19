const { Builder, By, Key, until } = require("selenium-webdriver")
/**
 * Lấy danh sách booking từ trang web.
 * @param {WebDriver} driver - Đối tượng WebDriver của Selenium.
 * @returns {Promise<Array>} - Mảng chứa thông tin từng booking-card.
 */
async function getBookingDetails(driver) {
  let bookings = []

  // Tìm tất cả các thẻ "booking-card"
  let bookingCards = await driver.findElements(By.className("booking-card"))

  for (let card of bookingCards) {
    let bookingData = {}

    // Lấy thông tin từ phần card-info
    bookingData.fullName = await card
      .findElement(By.xpath(".//p[strong[text()='Họ tên:']]"))
      .getText()
    bookingData.phone = await card
      .findElement(By.xpath(".//p[strong[text()='Số điện thoại:']]"))
      .getText()
    bookingData.arrivalTime = await card
      .findElement(By.xpath(".//p[strong[text()='Thời gian đến:']]"))
      .getText()
    bookingData.adultsChildren = await card
      .findElement(By.xpath(".//p[strong[text()='Người lớn:']]"))
      .getText()
    bookingData.note = await card.findElement(By.xpath(".//p[strong[text()='Ghi chú:']]")).getText()
    bookingData.createdAt = await card
      .findElement(By.xpath(".//p[strong[text()='Ngày tạo đơn:']]"))
      .getText()

    // Lấy trạng thái đơn (Đã từ chối, Chưa xử lý, ...)
    let statusElements = await card.findElements(By.xpath(".//div[contains(@class, 'status')]"))
    bookingData.status =
      statusElements.length > 0 ? await statusElements[0].getText() : "Không có trạng thái"
    // Lấy 2 nút "Từ chối đơn" & "Duyệt đơn" (nếu có)
    let rejectButton = await card.findElements(By.id("reject-booking-btn"))
    let approveButton = await card.findElements(By.id("complete-booking-btn"))

    bookingData.rejectButton = rejectButton.length > 0 ? rejectButton[0] : null
    bookingData.approveButton = approveButton.length > 0 ? approveButton[0] : null

    // Thêm vào danh sách bookings
    bookings.push(bookingData)
  }

  return bookings
}
async function login(driver, username, password) {
  try {
    if (username) {
      await driver.findElement(By.id("username-input")).sendKeys(username)
    }
    if (password) {
      await driver.findElement(By.id("password-input")).sendKeys(password, Key.RETURN)
    } else {
      await driver.findElement(By.id("password-input")).sendKeys(Key.RETURN)
    }

    // Chờ thông báo xuất hiện
    const alertElement = await driver.wait(until.elementLocated(By.id("swal2-title")), 10000)
    await driver.wait(until.elementIsVisible(alertElement), 10000)
    const message = await alertElement.getText()

    // Nhấn nút xác nhận trong hộp thoại cảnh báo
    const okButton = await driver.findElement(
      By.xpath("//button[contains(@class, 'swal2-confirm swal2-styled')]")
    )
    await okButton.click()

    // Chờ quay lại trang chính
    await driver.wait(until.elementLocated(By.tagName("body")), 10000)

    return message
  } catch (error) {
    console.error(`Error in login function: ${error.message}`)
    throw error
  }
}
async function logout(driver) {
  try {
    await driver.findElement(By.id("logout-btn")).click()
    const okButton = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(@class, 'swal2-confirm swal2-styled')]")),
      5000
    )
    await okButton.click()

    // Chờ quay lại màn hình đăng nhập
    await driver.wait(until.elementLocated(By.id("login_with_admin")), 10000)
  } catch (error) {
    console.error(`Error in logout function: ${error.message}`)
    throw error
  }
}

async function placeOrder(driver, data) {
  try {
    // Đợi các input xuất hiện
    const fullNameInput = await driver.wait(until.elementLocated(By.id("full-name-input")), 5000)
    const phoneInput = await driver.wait(until.elementLocated(By.id("phone-input")), 5000)
    const emailInput = await driver.wait(until.elementLocated(By.id("email-input")), 5000)
    const dateInput = await driver.wait(until.elementLocated(By.id("date-input")), 5000)
    const timeInput = await driver.wait(until.elementLocated(By.id("time-inp")), 5000)
    const adultsInput = await driver.wait(until.elementLocated(By.id("adults-count-input")), 5000)
    const childrenInput = await driver.wait(
      until.elementLocated(By.id("children-count-input")),
      5000
    )
    const noteInput = await driver.wait(until.elementLocated(By.id("note-input")), 5000)

    // Clear và nhập dữ liệu
    await fullNameInput.clear()
    if (data.fullName) await fullNameInput.sendKeys(data.fullName)

    await phoneInput.clear()
    if (data.phone) await phoneInput.sendKeys(data.phone)

    await emailInput.clear()
    if (data.email) await emailInput.sendKeys(data.email)

    // Set ngày/giờ nếu có
    if (data.date) {
      await driver.executeScript(
        `
                if (document.querySelector("#date-input")._flatpickr) {
                  document.querySelector("#date-input")._flatpickr.setDate(arguments[0], true);
                }
            `,
        data.date
      )
    }
    if (data.time) {
      await driver.executeScript(
        `
                if (document.querySelector("#time-inp")._flatpickr) {
                  document.querySelector("#time-inp")._flatpickr.setDate(arguments[0], true);
                }
            `,
        data.time
      )
    }

    await adultsInput.clear()
    if (data.adults) await adultsInput.sendKeys(data.adults)

    await childrenInput.clear()
    if (data.children !== undefined) await childrenInput.sendKeys(data.children)

    await noteInput.clear()
    if (data.note) await noteInput.sendKeys(data.note)

    // Click submit button
    let confirmButton = await driver.wait(
      until.elementLocated(By.xpath("//*[@id='booking-form']/button")),
      5000
    )
    let actions = driver.actions()
    await actions.move({ origin: confirmButton }).click().perform()
  } catch (error) {
    console.error("Error in placeOrder:", error)
    throw error
  }
}

async function placeOrderOnStaticForm(driver, data) {
  console.log(">>> data at placeOrderOnStaticForm:", data)
  try {
    // Đợi các input xuất hiện
    // const dateInput = await driver.wait(until.elementLocated(By.id("date-input")), 5000)
    // const timeInput = await driver.wait(until.elementLocated(By.id("time-inp")), 5000)
    const adultsInput = await driver.wait(until.elementLocated(By.id("adults-count-input")), 5000)
    const childrenInput = await driver.wait(
      until.elementLocated(By.id("children-count-input")),
      5000
    )
    const noteInput = await driver.wait(until.elementLocated(By.id("note-input")), 5000)

    // Set ngày/giờ nếu có
    if (data.date) {
      await driver.executeScript(
        `if (document.querySelector("#date-input")._flatpickr) {
						document.querySelector("#date-input")._flatpickr.setDate(arguments[0], true);
					}`,
        data.date
      )
    }
    if (data.time) {
      await driver.executeScript(
        `if (document.querySelector("#time-inp")._flatpickr) {
		         document.querySelector("#time-inp")._flatpickr.setDate(arguments[0], true);
	        }`,
        data.time
      )
    }

    await adultsInput.clear()
    if (data.adults) await adultsInput.sendKeys(data.adults)

    await childrenInput.clear()
    if (data.children !== undefined) await childrenInput.sendKeys(data.children)

    await noteInput.clear()
    if (data.note) await noteInput.sendKeys(data.note)

    const submitButton = await driver.wait(
      until.elementLocated(By.css("#booking-form button[type='submit']")),
      5000
    )
    const actions = driver.actions()
    await actions.move({ origin: submitButton }).click().perform()
  } catch (error) {
    console.error(">>> Error in placeOrderOnStaticForm:", error)
    throw error
  }
}

module.exports = {
  login,
  logout,
  getBookingDetails,
  placeOrder,
  placeOrderOnStaticForm,
}
