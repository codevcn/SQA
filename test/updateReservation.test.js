require("dotenv").config()
const { Builder, By, Key, until } = require("selenium-webdriver")
const { expect } = require("chai")
require("chromedriver")
const axios = require("axios")
const chrome = require("selenium-webdriver/chrome")
const dayjs = require("dayjs")

const DOMAIN = process.env.DOMAIN
console.log(`Testing on: ${DOMAIN}`)

const {
  convertDateFormat,
  addMinutesToDate,
  getRelativeTimeFormatted,
  getTomorrowDateFormatted,
  clickButton,
  clickOkToast,
  getRelativeDateFormatted,
  extractContentFromToast,
  extractErrorMessageFromInput,
  getMessageFromToast,
} = require("./utils/helper")
const { login, logout, placeOrderOnStaticForm } = require("./utils/func")
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const TEST_CASE_TIMEOUT = 1000000

const dataOnTestingFlow = {
  GENERAL: {
    bookingData: (isPhoneEmpty, isFullNameEmpty) => ({
      Cus_Email: "hanmunmun000@gmail.com",
      Cus_FullName: isFullNameEmpty ? "" : "Nguyễn Văn A",
      Cus_Phone: isPhoneEmpty ? "" : "0909090909",
      ArrivalTime: "28/06/2025 18:00",
      NumAdults: 2,
    }),
  },
  PLACE_ORDER: (date, time, adultsCount, childrenCount) => ({
    fullName: "Nguyễn Văn A",
    phone: "0987654321",
    email: "nguyenvana@gmail.com",
    date: date,
    time: time,
    adults: adultsCount || "2",
    children: childrenCount || "0",
    note: "Bàn gần cửa sổ",
  }),
}

const obfuscateTextContent = (data) => {
  return {
    ...data,
    Cus_FullName: data.Cus_FullName.split("").reverse().join(""),
  }
}

describe("Các testcase cho chức năng cập nhật đơn đặt chỗ", function () {
  this.timeout(TEST_CASE_TIMEOUT)
  let driver
  let savedData = {}

  before(async function () {
    let options = new chrome.Options()
    // Tắt các cảnh báo và log không cần thiết
    options.addArguments(
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-logging",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      "--log-level=3",
      "--silent",
      "--disable-extensions",
      "--disable-plugins",
      "--disable-images",
      "--disable-javascript-harmony-shipping",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection"
    )

    // Tắt console log
    options.setLoggingPrefs({
      browser: "OFF",
      driver: "OFF",
      performance: "OFF",
    })

    driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build()
    await driver.manage().setTimeouts({ implicit: 5000 })
    await driver.get(`${DOMAIN}/`)
  })

  after(async function () {
    if (driver) {
      await driver.quit()
    }
  })

  beforeEach(async function () {
    await axios.get("http://localhost:3000/reset-database")
  })

  async function waitForSoLong() {
    await delay(500000)
  }

  async function waitForLooking() {
    await delay(3000)
  }

  async function waitForCloseToast() {
    await delay(3000)
  }

  async function seedTestReservationData(type) {
    switch (type) {
      case "GENERAL":
        /**
         * required fields: "Cus_Email", "Cus_FullName", "Cus_Phone", "ArrivalTime", "NumAdults"
         */
        const { data } = await axios.post(
          `${DOMAIN}/api/reservations/reserve`,
          dataOnTestingFlow["GENERAL"].bookingData()
        )
        return data.reservation
    }
  }

  async function submitOTP(otp) {
    const otpInput = await driver.wait(until.elementLocated(By.id("otp")), 5000)
    await otpInput.clear()
    await otpInput.sendKeys(otp)

    // Chờ layout ổn định nhẹ sau khi nhập OTP (giúp browser render UI)
    await driver.sleep(300)

    // Re-locate lại submit button để đảm bảo bounding box chuẩn
    const submitBtn = await driver.wait(
      until.elementLocated(By.css('#otp-form button[type="submit"]')),
      5000
    )
    await driver.wait(until.elementIsEnabled(submitBtn), 5000)

    // Sử dụng Selenium Actions để click trực tiếp theo element reference, không phụ thuộc pixel tọa độ cũ
    const actions = driver.actions({ bridge: true })
    await actions.move({ origin: submitBtn }).click().perform()
  }

  async function autoSubmitSearchForm(data) {
    await driver.findElement(By.id("name-input")).sendKeys(data.Cus_FullName)
    await driver.findElement(By.id("phone-input")).sendKeys(data.Cus_Phone)
    await driver.findElement(By.css('#search-form button[type="submit"]')).click()
  }

  async function clickUpdateBookingButton() {
    await driver.wait(until.elementLocated(By.css(".booking-card")), 5000)
    const bookingCard = await driver.findElement(By.css(".booking-card"))
    await bookingCard.findElement(By.css(".update-booking-btn")).click()
  }

  async function isBookingsHistoryRoute(phone, fullName) {
    const fullNameEncoded = encodeURIComponent(fullName)
    const phoneEncoded = encodeURIComponent(phone)
    const searchUrl = `${DOMAIN}/bookings-history/?Cus_Phone=${phoneEncoded}&Cus_FullName=${fullNameEncoded}`

    await driver.wait(until.urlIs(searchUrl), 5000)
  }

  async function isUrl(url) {
    await driver.wait(until.urlIs(url), 5000)
  }

  async function isVerifyOTPRoute(reservationId) {
    const reservationIdEncoded = encodeURIComponent(reservationId)
    const url = `${DOMAIN}/update-bookings/verify-otp?ReservationID=${reservationIdEncoded}`
    await driver.wait(until.urlIs(url), 5000)
  }

  async function isSendOTPRoute(reservationId) {
    const reservationIdEncoded = encodeURIComponent(reservationId)
    const url = `${DOMAIN}/update-bookings/send-otp?ReservationID=${reservationIdEncoded}`
    await driver.wait(until.urlIs(url), 5000)
  }

  async function countOTPExpiry(timeInMiliseconds) {
    let count = 0
    const interval = setInterval(() => {
      console.log(`>>> OTP hết hạn sau ${Math.floor(count / 1000)} giây`)
      count += 1000
      if (count >= timeInMiliseconds) {
        clearInterval(interval)
      }
    }, 1000)
  }

  async function navToUpdateBookingPage(reservationId) {
    await driver.get(`${DOMAIN}/bookings-history`)
    const data = dataOnTestingFlow["GENERAL"].bookingData()
    await autoSubmitSearchForm(data)

    await isBookingsHistoryRoute(data.Cus_Phone, data.Cus_FullName)

    await clickUpdateBookingButton()

    await isSendOTPRoute(reservationId)

    const {
      data: { otp },
    } = await axios.get(`${DOMAIN}/api/get-otp?ReservationID=${reservationId}`)
    await submitOTP(otp)

    await isUrl(`${DOMAIN}/update-bookings/?ReservationID=${reservationId}`)
    const pageTitle = await driver.wait(
      until.elementLocated(By.id("update-bookings-page-title")),
      5000
    )
    expect(await pageTitle.getText()).to.equal("Cập nhật thông tin đặt bàn")
  }

  async function closeToast() {
    const swalOkBtn = await driver.wait(
      until.elementLocated(By.css(".swal2-actions .swal2-confirm")),
      5000
    )
    await swalOkBtn.click()
    await waitForCloseToast()
  }

  // // TC 1: Bỏ trống trường phone
  // it("TC 1: Bỏ trống trường phone", async function () {
  //   await seedTestReservationData("GENERAL")

  //   await driver.get(`${DOMAIN}/bookings-history`)
  //   await autoSubmitSearchForm(dataOnTestingFlow["GENERAL"].bookingData(true, false))

  //   await waitForLooking()

  //   const errorMessage = await extractContentFromToast(driver)
  //   expect(errorMessage).to.include("Trường số điện thoại phải có ít nhất 10 chữ số!")
  // })

  // // TC 2: Bỏ trống trường họ tên
  // it("TC 2: Bỏ trống trường họ tên", async function () {
  //   await seedTestReservationData("GENERAL")

  //   await driver.get(`${DOMAIN}/bookings-history`)
  //   await autoSubmitSearchForm(dataOnTestingFlow["GENERAL"].bookingData(false, true))

  //   await waitForLooking()

  //   const errorMessage = await extractContentFromToast(driver)
  //   expect(errorMessage).to.include("Trường tên không được để trống!")
  // })

  // // TC 3: Nhập sai định dạng phone
  // it("TC 3: Nhập sai định dạng số điện thoại", async function () {
  //   await seedTestReservationData("GENERAL")

  //   await driver.get(`${DOMAIN}/bookings-history`)
  //   await autoSubmitSearchForm({
  //     ...dataOnTestingFlow["GENERAL"].bookingData(),
  //     Cus_Phone: "1234567890",
  //   })

  //   await waitForLooking()

  //   const errorMessage = await extractContentFromToast(driver)
  //   expect(errorMessage).to.include("Trường số điện thoại không hợp lệ!")
  // })

  // TC 4: Đơn không tồn tại
  it("TC 1: Không tìm thấy đơn đặt bàn", async function () {
    await seedTestReservationData("GENERAL")

    await driver.get(`${DOMAIN}/bookings-history`)
    const obfuscatedData = obfuscateTextContent(dataOnTestingFlow["GENERAL"].bookingData())
    await autoSubmitSearchForm(obfuscatedData)

    await isBookingsHistoryRoute(obfuscatedData.Cus_Phone, obfuscatedData.Cus_FullName)

    await driver.wait(until.elementLocated(By.css(".empty-result")), 5000)
    const emptyText = await driver.findElement(By.css(".empty-content")).getText()
    expect(emptyText).to.include("Không có đơn đặt bàn nào")
  })

  // TC 5: OTP sai
  it("TC 5: Nhập OTP sai", async function () {
    const reservation = await seedTestReservationData("GENERAL")
    const { ReservationID } = reservation

    await driver.get(`${DOMAIN}/bookings-history`)
    const data = dataOnTestingFlow["GENERAL"].bookingData()
    await autoSubmitSearchForm(data)

    await isBookingsHistoryRoute(data.Cus_Phone, data.Cus_FullName)

    await clickUpdateBookingButton()

    await submitOTP("000000")

    await isVerifyOTPRoute(ReservationID)
    const errorMessage = await driver.wait(until.elementLocated(By.id("error-message")), 5000)
    expect(await errorMessage.getText()).to.equal("OTP không chính xác, vui lòng thử lại")
  })

  // TC 6: OTP hết hạn
  it("TC 6: OTP hết hạn", async function () {
    const reservation = await seedTestReservationData("GENERAL")
    const { ReservationID } = reservation

    await driver.get(`${DOMAIN}/bookings-history`)
    const data = dataOnTestingFlow["GENERAL"].bookingData()
    await autoSubmitSearchForm(data)

    await isBookingsHistoryRoute(data.Cus_Phone, data.Cus_FullName)

    await clickUpdateBookingButton()

    // chờ OTP hết hạn (hơn 1 phút)
    const timeToWait = 61000
    await countOTPExpiry(timeToWait)
    await delay(timeToWait)

    const {
      data: { otp },
    } = await axios.get(`${DOMAIN}/api/get-otp?ReservationID=${ReservationID}`)
    await submitOTP(otp)

    await isVerifyOTPRoute(ReservationID)
    const errorMessage = await driver.wait(until.elementLocated(By.id("error-message")), 5000)
    expect(await errorMessage.getText()).to.equal("OTP đã hết hạn, vui lòng thử lại")
  })

  // TC 7: Gửi lại OTP
  it("TC 7: Gửi lại OTP", async function () {
    const reservation = await seedTestReservationData("GENERAL")
    const { ReservationID } = reservation

    await driver.get(`${DOMAIN}/bookings-history`)
    const data = dataOnTestingFlow["GENERAL"].bookingData()
    await autoSubmitSearchForm(data)

    await isBookingsHistoryRoute(data.Cus_Phone, data.Cus_FullName)

    await clickUpdateBookingButton()
    await isSendOTPRoute(ReservationID)

    const {
      data: { otp: oldOTP },
    } = await axios.get(`${DOMAIN}/api/get-otp?ReservationID=${ReservationID}`)

    const resendOTPBtn = await driver.wait(until.elementLocated(By.id("resend-otp-btn")), 5000)
    await driver.wait(until.elementIsEnabled(resendOTPBtn), 5000)
    // Sử dụng Selenium Actions để click trực tiếp theo element reference, không phụ thuộc pixel tọa độ cũ
    const actions = driver.actions({ bridge: true })
    await actions.move({ origin: resendOTPBtn }).click().perform()

    await isUrl(`${DOMAIN}/update-bookings/resend-otp?ReservationID=${ReservationID}`)

    await submitOTP(oldOTP)

    await isVerifyOTPRoute(ReservationID)
    const errorMessage = await driver.wait(until.elementLocated(By.id("error-message")), 5000)
    expect(await errorMessage.getText()).to.equal("OTP không chính xác, vui lòng thử lại")

    const {
      data: { otp: newOTP },
    } = await axios.get(`${DOMAIN}/api/get-otp?ReservationID=${ReservationID}`)
    await submitOTP(newOTP)

    await isUrl(`${DOMAIN}/update-bookings/?ReservationID=${ReservationID}`)
    const pageTitle = await driver.wait(
      until.elementLocated(By.id("update-bookings-page-title")),
      5000
    )
    expect(await pageTitle.getText()).to.equal("Cập nhật thông tin đặt bàn")
  })

  // TC 8: Thời gian đến quá khứ
  it("TC 8: Thời gian đặt bàn ở quá khứ", async function () {
    const reservation = await seedTestReservationData("GENERAL")
    const { ReservationID } = reservation

    await navToUpdateBookingPage(ReservationID)

    const tomorrow = dayjs().add(0, "day")
    const shortTime = tomorrow.hour(0).minute(30) // 12:30 ngày mai
    const date = shortTime.format("DD/MM/YYYY")
    const time = shortTime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time))
    await waitForLooking()
    const message = await extractContentFromToast(driver)
		expect(message).to.equal("Thời gian đặt phải cách thời điểm hiện tại ít nhất 1 giờ!")
    await closeToast()
  })

  // TC 9: Thời gian ngoài giờ làm việc
	it("TC 9: Thời gian ngoài giờ làm việc", async function () {
		await seedTestReservationData("GENERAL")
		
    // đặt vào 23h
    const daysLater = dayjs().add(3, "day")
    const shortTimeV23h = daysLater.hour(23).minute(30)
    const dateV23h = shortTimeV23h.format("DD/MM/YYYY")
    const timeV23h = shortTimeV23h.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](dateV23h, timeV23h))
		const message = await extractContentFromToast(driver)
    expect(message).to.equal("Nhà hàng đã đóng cửa vào thời gian này!")

    await closeToast()

    // đặt vào 5h sáng
    const shortTimeV5h = daysLater.hour(5).minute(30)
    const dateV5h = shortTimeV5h.format("DD/MM/YYYY")
    const timeV5h = shortTimeV5h.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](dateV5h, timeV5h))
    await waitForLooking()
    const messageV5h = await extractContentFromToast(driver)
    expect(messageV5h).to.equal("Nhà hàng chưa mở cửa vào thời gian này!")
    await closeToast()
  })

  // TC 10: Đặt vào thời gian nghỉ của nhà hàng
	it("TC 10: Đặt vào thời gian nghỉ", async function () {
		await seedTestReservationData("GENERAL")

    const daytime = dayjs().month(8).date(2).add(1, "hours") // tháng 9 (0-based index nên là 8)
    const date = daytime.format("DD/MM/YYYY")
    const time = daytime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time))
    await waitForLooking()
    const message = await extractContentFromToast(driver)
    expect(message).to.equal("Nhà hàng đóng cửa vào ngày này!")
    await closeToast()
  })

  // TC 11: Thời gian < 1h so với hiện tại
	it("TC 11: Thời gian nhỏ hơn 1h so với hiện tại", async function () {
		await seedTestReservationData("GENERAL")

    const dayTime = dayjs().add(30, "minutes")
    const date = dayTime.format("DD/MM/YYYY")
    const time = dayTime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time))
    await waitForLooking()
    const message = await extractContentFromToast(driver)
    expect(message).to.equal("Thời gian đặt phải cách thời điểm hiện tại ít nhất 1 giờ!")
    await closeToast()
  })

  // TC 12: Bỏ trống trường số lượng người lớn
  it("TC 12: Bỏ trống trường số lượng người lớn", async function () {
		await seedTestReservationData("GENERAL")

    const dayTime = dayjs().hour(12).minute(30)
    const date = dayTime.format("DD/MM/YYYY")
    const time = dayTime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time), ["adults"])
    await waitForLooking()
    const message = await extractErrorMessageFromInput(
      driver,
      "#booking-form .form-group.adults-count .message"
    )
    expect(message).to.equal("Phải có ít nhất 1 người lớn!")
  })

  // TC 13: Số lượng người lớn = 0
  it("TC 13: Số lượng người lớn = 0", async function () {
		await seedTestReservationData("GENERAL")

    const dayTime = dayjs().hour(12).minute(30)
    const date = dayTime.format("DD/MM/YYYY")
    const time = dayTime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time, "0"))
    await waitForLooking()
    const message = await extractErrorMessageFromInput(
      driver,
      "#booking-form .form-group.adults-count .message"
    )
    expect(message).to.equal("Phải có ít nhất 1 người lớn!")
  })

  // TC 14: Số lượng người lớn < 0
  it("TC 14: Số lượng người lớn < 0", async function () {
		await seedTestReservationData("GENERAL")

    const dayTime = dayjs().hour(12).minute(30)
    const date = dayTime.format("DD/MM/YYYY")
    const time = dayTime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time, "-1"))
    await waitForLooking()
    const message = await extractErrorMessageFromInput(
      driver,
      "#booking-form .form-group.adults-count .message"
    )
    expect(message).to.equal("Phải có ít nhất 1 người lớn!")
  })

  // TC 15: Số lượng trẻ em < 0
  it("TC 15: Số lượng trẻ em < 0", async function () {
		await seedTestReservationData("GENERAL")

    const dayTime = dayjs().hour(12).minute(30)
    const date = dayTime.format("DD/MM/YYYY")
    const time = dayTime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time, "1", "-1"))
    await waitForLooking()
    const message = await extractErrorMessageFromInput(
      driver,
      "#booking-form .form-group.children-count .message"
    )
    expect(message).to.equal("Số trẻ em phải lớn hơn hoặc bằng 0!")
  })

  // TC 16: Luồng chuẩn, thành công (backbone)
  it("TC 16: Luồng chuẩn, thành công", async function () {
    const reservation = await seedTestReservationData("GENERAL")
    const { ReservationID } = reservation

    await navToUpdateBookingPage(ReservationID)

    const dayTime = dayjs().hour(12).minute(30)
    const date = dayTime.format("DD/MM/YYYY")
    const time = dayTime.format("HH:mm")

    await placeOrderOnStaticForm(driver, dataOnTestingFlow["PLACE_ORDER"](date, time))

    await waitForLooking()

    const message = await extractContentFromToast(driver)
    expect(message).to.equal("Cập nhật đơn thành công")
  })
})
