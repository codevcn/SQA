const bookingFormEle = document.getElementById("booking-form")

const bookingDetails = document.getElementById("confirm-booking-details")

const getPageData = () => {
  const reservationInStr = document.getElementById("main-section").dataset.reservation
  return reservationInStr ? JSON.parse(reservationInStr) : null
}

const getAppMessage = () => {
  const appMessageEle = document.getElementById("app-message-placeholder")
  const appStatus = appMessageEle ? appMessageEle.dataset.appStatus : null
  const appMessage = appMessageEle ? appMessageEle.dataset.appMessage : null
  return { appStatus, appMessage }
}

const initArrivalTime = (reservation) => {
  const dateInput = document.getElementById("date-input")
  const timeInput = document.getElementById("time-input")
  const date = new Date(reservation.ArrivalTime)
  dateInput.value = date.toLocaleDateString("en-GB").split("/").join("/") // Format d/m/Y
  timeInput.value = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) // Format H:i
}

const disableInputs = (reservation) => {
  if (reservation.Status !== "Pending") {
    const inputs = document.querySelectorAll(".form-field")
    for (const input of inputs) {
      input.disabled = true
    }
  }
}

const createFormGroupMessage = (message) => {
  const messageEle = document.createElement("div")
  messageEle.classList.add("message")
  messageEle.innerHTML = `
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>${message}</span>`
  return messageEle
}

const validateBooking = (formData) => {
  let isValid = true
  const fullName = formData["Cus_FullName"],
    email = formData["Cus_Email"],
    phone = formData["Cus_Phone"],
    date = formData["ArrivalTime"],
    time = formData["ArrivalTime"],
    adultsCount = formData["NumAdults"],
    childrenCount = formData["NumChildren"]

  const warning = (formGroupClassName, message) => {
    isValid = false
    const formGroup = bookingFormEle.querySelector(`.form-group.${formGroupClassName}`)
    formGroup.classList.add("warning")
    formGroup.querySelector(".message")?.remove()
    formGroup.appendChild(createFormGroupMessage(message))
  }

  if (!fullName) {
    warning("full-name", "Trường họ và tên không được để trống!")
  }
  if (fullName && !isValidFullName(fullName)) {
    warning("full-name", "Trường họ và tên không hợp lệ!")
  }
  if (!email) {
    warning("email", "Trường email không được để trống!")
  } else if (!isValidEmail(email)) {
    warning("email", "Email không hợp lệ!")
  }
  if (phone && !validator.isMobilePhone(phone)) {
    warning("phone", "Số điện thoại không hợp lệ!")
  } else if (!phone) {
    warning("phone", "Số điện thoại không được để trống!")
  }
  if (date && time) {
    dayjs.extend(dayjs_plugin_customParseFormat)
    const now = dayjs() // Thời gian hiện tại
    console.log(`${date} ${time}`)
    const bookingDateTime = dayjs(`${date} ${time}`, "DD/MM/YYYY HH:mm")
    const maxBookingDate = now.add(2, "month")
    console.log(bookingDateTime, now)
    if (bookingDateTime.isBefore(now)) {
      isValid = false
      toaster.error("Thời gian đặt phải từ thời điểm hiện tại trở đi!")
    } else if (bookingDateTime.isAfter(maxBookingDate)) {
      isValid = false
      toaster.error("Thời gian đặt không được quá 2 tháng kể từ thời điểm hiện tại!")
    }
  } else {
    if (!date) warning("date", "Trường ngày đặt không được để trống!")
    if (!time) warning("time", "Trường giờ đặt không được để trống!")
  }
  if (!adultsCount || !validator.isInt(adultsCount, { min: 1 })) {
    warning("adults-count", "Phải có ít nhất 1 người lớn!")
  }
  if (childrenCount) {
    if (!validator.isInt(childrenCount, { min: 0 })) {
      warning("children-count", "Số trẻ em phải lớn hơn hoặc bằng 0!")
    }
  }

  return isValid
}

// const showConfirmBooking = (formData) => {
//   bookingDetails.querySelector(".form-group.full-name p").textContent = formData["full-name"]
//   bookingDetails.querySelector(".form-group.email p").textContent = formData["email"]
//   bookingDetails.querySelector(".form-group.phone p").textContent = formData["phone"]
//   bookingDetails.querySelector(".form-group.date-time p").textContent = `${formData["date"]}, ${
//     formData["time"]
//   } (${convertTo12HourFormat(formData["time"])[1] === "AM" ? "Buổi sáng" : "Buổi chiều"})`
//   bookingDetails.querySelector(".form-group.people-count p").textContent = `${
//     formData["adults-count"]
//   } người lớn và ${formData["children-count"] || 0} trẻ em`
//   const noteMessageEle = bookingDetails.querySelector(".form-group.note p")
//   noteMessageEle.classList.remove("empty")
//   if (formData["note"]) {
//     noteMessageEle.textContent = formData["note"]
//   } else {
//     noteMessageEle.classList.add("empty")
//     noteMessageEle.textContent = "Không có"
//   }

//   const confirmBooking = new bootstrap.Modal("#confirm-booking-modal")
//   confirmBooking.show()
// }

function isValidFullName(username) {
  // Kiểm tra nếu rỗng hoặc không phải là chuỗi
  if (!username || typeof username !== "string") return false

  // Biểu thức chính quy kiểm tra họ và tên hợp lệ
  const regex = /^[A-ZÀ-Ỹ][a-zà-ỹ]*(?: [A-ZÀ-Ỹ][a-zà-ỹ]*)*$/

  return regex.test(username.trim())
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const submitBooking = (e) => {
  e.preventDefault()
  const formData = extractFormData(e.target)
  console.log(">>> form data:", formData)
  if (validateBooking(formData)) {
    reservationPageShares.bookingData = formData
    // showConfirmBooking(formData)
      e.target.submit()
  }
}

// const showCofirmBookingLoading = (show) => {
//   bookingDetails.querySelector(".submit-btn").innerHTML = show
//     ? createLoading()
//     : `<span>Xác nhận đặt chỗ</span>`
// }

// const confirmBooking = () => {
//   showCofirmBookingLoading(true)
//   console.log(">>> booking data:", reservationPageShares.bookingData)
//   bookingService
//     .updateBooking(reservationPageShares.bookingData)
//     .then(() => {
//       toaster.success("Đặt bàn thành công", "", () => {
//         //   window.location.href = `/bookings-history?Cus_FullName=${reservationPageShares.bookingData["full-name"]}&Cus_Phone=${reservationPageShares.bookingData["phone"]}`
//         window.location.href = `/bookings-history`
//       })
//     })
//     .catch((error) => {
//       toaster.error(extractErrorMessage(error))
//     })
//     .finally(() => {
//       showCofirmBookingLoading(false)
//     })
// }

const init = () => {
  const reservation = getPageData()
  console.log(">>> reservation:", reservation)
  if (reservation) {
    disableInputs(reservation)
    initArrivalTime(reservation)
  }
  const { appMessage, appStatus } = getAppMessage()
  if (appMessage) {
    if (appStatus === "success") {
      toaster.success("Cập nhật đơn đặt bàn", appMessage)
    } else {
      toaster.error("Cập nhật đơn đặt bàn", appMessage)
    }
  }

  bookingFormEle.addEventListener("submit", submitBooking)
  const formFields = bookingFormEle.elements
  for (const field of formFields) {
    field.addEventListener("input", (e) => {
      field.closest(".form-group").classList.remove("warning")
    })
  }
  // bookingDetails.querySelector(".submit-btn").addEventListener("click", confirmBooking)
}
init()
