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

    // Lấy trạng thái đơn (Đã từ chối, Chưa xử lý, ...)
    let statusElements = await card.findElements(By.xpath(".//div[contains(@class, 'status')]"))
    bookingData.status =
      statusElements.length > 0 ? await statusElements[0].getText() : "Không có trạng thái"
    // Lấy 2 nút "Từ chối đơn" & "Duyệt đơn" (nếu có)
    bookingData.rejectButton = null
    bookingData.approveButton = null
    bookingData.cancelButton = null
    bookingData.completeBookingButton = null

    try {
      let btn = await card.findElement(By.id("reject-booking-btn"))
      bookingData.rejectButton = btn
    } catch (e) {}
    try {
      let btn = await card.findElement(By.id("approve-booking-btn"))
      bookingData.approveButton = btn
    } catch (e) {}
    try {
      let btn = await card.findElement(By.id("cancel-booking-btn"))
      bookingData.cancelButton = btn
    } catch (e) {}
    try {
      let btn = await card.findElement(By.id("complete-booking-btn"))
      bookingData.completeBookingButton = btn
    } catch (e) {}

    bookings.push(bookingData)
  }
  // Thêm vào danh sách bookings
  bookings.push(bookingData)
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

/**
 * Lọc đơn đặt bàn theo các tiêu chí
 * @param {WebDriver} driver - Đối tượng WebDriver của Selenium
 * @param {Object} filters - Các tiêu chí lọc
 * @returns {Promise<Array>} - Mảng chứa các đơn đặt bàn sau khi lọc
 */
async function filterBookings(driver, filters) {
  try {
    // Chọn trạng thái đơn nếu có
    if (filters.status) {
      // Click dropdown
      const statusDropdown = await driver.findElement(By.css("#booking-status-select > button"))
      await statusDropdown.click()
      await driver.sleep(200) // Đợi dropdown mở

      // Chọn item theo text tiếng Việt
      let statusText = ""
      switch (filters.status) {
        case "Chưa được xử lý":
          statusText = "Chưa được xử lý"
          break
        case "Đã duyệt":
          statusText = "Đã duyệt"
          break
        case "Đã từ chối":
          statusText = "Đã từ chối"
          break
        case "Tất cả":
          statusText = "Tất cả"
          break
        default:
          statusText = filters.status
      }
      const statusOption = await driver.findElement(
        By.xpath(`//div[contains(@class, 'dropdown-item') and text()='${statusText}']`)
      )
      await statusOption.click()
      await driver.sleep(200)
    }

    // Nhập số điện thoại nếu có
    if (filters.phone) {
      const phoneInput = await driver.findElement(By.css('input[name="phonenumber"]'))
      await phoneInput.clear()
      await phoneInput.sendKeys(filters.phone)
    }

    // Nhập ngày nếu có
    if (filters.date) {
      const dateInput = await driver.findElement(By.css('input[name="date"]'))
      await dateInput.clear()
      const [dd, mm, yyyy] = filters.date.split("/")
      const formattedDate = `${mm}/${dd}/${yyyy}`
      await dateInput.sendKeys(formattedDate)
    }

    // Nhập số giờ đến hạn nếu có
    if (filters.expires_in_hours) {
      const hourInput = await driver.findElement(By.css('input[name="expires_in_hours"]'))
      await hourInput.clear()
      await hourInput.sendKeys(filters.expires_in_hours)
    }

    // Click nút áp dụng bộ lọc (bạn cần xác nhận lại selector, ví dụ id='apply-filter-btn')
    const applyFilterBtn = await driver.findElement(
      By.xpath('//*[@id="filter-bookings-form"]/div[2]/button')
    )
    await applyFilterBtn.click()

    // Đợi loading
    await driver.sleep(1000)

    // Lấy kết quả sau khi lọc
    return await getBookingDetails(driver)
  } catch (error) {
    console.error("Error in filterBookings:", error)
    throw error
  }
}

async function waitForFlatpickrReady(driver, selector, timeout = 15000) {
  await driver.wait(async () => {
    return await driver.executeScript(
      `
      const el = document.querySelector(arguments[0]);
      return el && el._flatpickr != null;
    `,
      selector
    )
  }, timeout)
}

async function placeOrderOnStaticForm(driver, data, missingFields = []) {
  console.log(">>> data at placeOrderOnStaticForm:", data)
  try {
    await waitForFlatpickrReady(driver, "#date-input", 3000)
    await waitForFlatpickrReady(driver, "#time-input", 3000)

    // Set ngày/giờ nếu có
    if (!missingFields.includes("date") && data.date) {
      await driver.executeScript(
        `if (document.getElementById("date-input")._flatpickr) {
						document.getElementById("date-input")._flatpickr.setDate(arguments[0], true, "d/m/Y");
					}`,
        data.date
      )
    }
    if (!missingFields.includes("time") && data.time) {
      await driver.executeScript(
        `if (document.getElementById("time-input")._flatpickr) {
		         document.getElementById("time-input")._flatpickr.setDate(arguments[0], true, "H:i");
	        }`,
        data.time
      )
    }

    // Sau khi set xong Flatpickr, tìm lại các element input còn lại:
    // const dateInput = await driver.wait(until.elementLocated(By.id("date-input")), 5000)
    // const timeInput = await driver.wait(until.elementLocated(By.id("time-inp")), 5000)
    const adultsInput = await driver.wait(until.elementLocated(By.id("adults-count-input")), 5000)
    const childrenInput = await driver.wait(
      until.elementLocated(By.id("children-count-input")),
      5000
    )
    const noteInput = await driver.wait(until.elementLocated(By.id("note-input")), 5000)

    if (!missingFields.includes("adults") && data.adults) {
      await adultsInput.clear()
      await adultsInput.sendKeys(data.adults)
    }

    if (!missingFields.includes("children") && data.children !== undefined) {
      await childrenInput.clear()
      await childrenInput.sendKeys(data.children)
    }

    if (!missingFields.includes("note") && data.note) {
      await noteInput.clear()
      await noteInput.sendKeys(data.note)
    }

    if (missingFields.includes("date")) {
      await driver.executeScript(`
        document.querySelector("#date-input")._flatpickr.clear();
      `)
    }
    if (missingFields.includes("time")) {
      await driver.executeScript(`
        document.querySelector("#time-input")._flatpickr.clear();
      `)
    }
    if (missingFields.includes("adults")) await adultsInput.clear()
    if (missingFields.includes("children")) await childrenInput.clear()
    if (missingFields.includes("note")) await noteInput.clear()

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
  filterBookings,
}
