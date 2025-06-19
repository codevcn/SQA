const searchFormEle = document.getElementById("search-form")

const validateSearchData = (formData) => {
  const phone = formData["Cus_Phone"],
    nameOfUser = formData["Cus_FullName"]

  console.log(">>> data to validate:", {
    phone,
    nameOfUser,
  })

  if (!phone || phone.length < 10) {
    toaster.error("Cảnh báo", "Trường số điện thoại phải có ít nhất 10 chữ số!")
    return false
  } else if (!isValidVietnamPhone(phone)) {
    toaster.error("Cảnh báo", "Trường số điện thoại không hợp lệ!")
    return false
  }
  if (!nameOfUser) {
    toaster.error("Cảnh báo", "Trường tên không được để trống!")
    return false
  }

  return true
}

const showSearchLoading = (show) => {
  const submitBtn = searchFormEle.querySelector(".submit-btn")
  submitBtn.innerHTML = ""
  if (show) {
    submitBtn.innerHTML = createLoading()
  }
}

const searchBookings = (e) => {
  // e.preventDefault()
  // const formData = extractFormData(e.target)
  // if (validateSearchData(formData)) {
  //   showSearchLoading(true)
  //   navigateWithPayload("/bookings-history", {
  //     Cus_Phone: formData["Cus_Phone"],
  //     Cus_FullName: formData["Cus_FullName"],
  //   })
  // }
  e.preventDefault()
  const formData = extractFormData(e.target)
  if (validateSearchData(formData)) {
    showSearchLoading(true)
    const phone = encodeURIComponent(formData["Cus_Phone"])
    const fullName = encodeURIComponent(formData["Cus_FullName"])
    const searchUrl = `/bookings-history/?Cus_Phone=${phone}&Cus_FullName=${fullName}`
    window.location.href = searchUrl
  }
}

// Xử lý nút cập nhật đơn đặt bàn
const handleUpdateBooking = (e) => {
  const button = e.currentTarget
  const bookingId = button.getAttribute("data-booking-id")

  // Lấy dữ liệu từ các data attributes
  // const bookingData = {
  //    ReservationID: bookingId,
  //    Cus_FullName: button.getAttribute('data-full-name'),
  //    Cus_Email: button.getAttribute('data-email'),
  //    Cus_Phone: button.getAttribute('data-phone'),
  //    ArrivalTime: button.getAttribute('data-arrival-time'),
  //    NumAdults: parseInt(button.getAttribute('data-adults')) || 0,
  //    NumChildren: parseInt(button.getAttribute('data-children')) || 0,
  //    Note: button.getAttribute('data-note'),
  //    Status: button.getAttribute('data-status')
  // }

  // // Hiển thị thông báo xác nhận
  // toaster.info("Tính năng đang phát triển", "Chức năng cập nhật đơn đặt bàn sẽ được hoàn thiện trong phiên bản tiếp theo!")

  window.location.href = `/update-bookings?ReservationID=${bookingId}`
}

const autoFillForm = () => {
  const { Cus_FullName, Cus_Phone } = getQueryParams()
  if (Cus_FullName && Cus_Phone) {
    document.getElementById("name-input").value = decodeURIComponent(Cus_FullName)
    document.getElementById("phone-input").value = decodeURIComponent(Cus_Phone)
  } else {
    document.getElementById("name-input").value = "Nguyễn Văn A"
    document.getElementById("phone-input").value = "0909090909"
  }
}

const toastMessage = () => {
  const { message } = getQueryParams()
  if (message) {
    toaster.info("Cảnh báo", decodeURIComponent(message))
  }
}

const init = () => {
  searchFormEle.addEventListener("submit", searchBookings)

  // Thêm event listener cho các nút cập nhật
  // const updateButtons = document.querySelectorAll('.update-booking-btn')
  // for (const button of updateButtons) {
  //    button.addEventListener('click', handleUpdateBooking)
  // }

  // autoFillForm()
  toastMessage()
}
init()
function getQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    Cus_FullName: params.get("Cus_FullName"),
    Cus_Phone: params.get("Cus_Phone"),
    message: params.get("message"),
  }
}

function fillForm() {
  console.log(">>> run into fillForm")
  const { Cus_FullName, Cus_Phone } = getQueryParams()
  if (Cus_FullName) {
    document.getElementsByName("Cus_FullName")[0].value = decodeURIComponent(Cus_FullName)
  }

  if (Cus_Phone) {
    document.getElementsByName("Cus_Phone")[0].value = decodeURIComponent(Cus_Phone)
  }
}

window.onload = fillForm
