const validateFilterFormData = (formData) => {
  let isValid = true

  const time = formData["expires_in_hours"],
    status = formData["status"]

  if (!time) {
    isValid = false
    toaster.error("Trường thời gian đến hạn không được phép trống!")
  }
  if (!status || status === "none") {
    isValid = false
    toaster.error("Trường trạng thái đơn không hợp lệ!")
  }

  return isValid
}

const filterBookings = (e) => {
  e.preventDefault() // Ngăn form gửi trực tiếp

  let form = new FormData(e.target)

  let params = new URLSearchParams()

  // Chỉ thêm các field có giá trị vào URL
  form.forEach((value, key) => {
    if (value.trim() !== "" && value.trim() !== "none" && value.trim() !== "All") {
      params.append(key, value)
    }
  })
  window.location.href = window.location.pathname + "?" + params.toString()
}

const getBookingId = (submitBtn) =>
  submitBtn.closest(".booking-card").getAttribute("data-kb-booking-id")

const approveBooking = (e) => {
  e.preventDefault()
  const submitBtn = e.currentTarget
  const backupContent = e.target.innerHTML
  submitBtn.innerHTML = createLoading()
  processBookingService
    .approveBooking(getBookingIdFromBtn(submitBtn))
    .then(() => {
      toaster.success("Duyệt đơn thành công.", "", () => {
        reloadPage()
      })
    })
    .catch((error) => {
      toaster.error(extractErrorMessage(error))
    })
    .finally(() => {
      submitBtn.innerHTML = backupContent
    })
}

const completeBooking = (e) => {
  e.preventDefault()
  const submitBtn = e.currentTarget
  const backupContent = e.target.innerHTML
  submitBtn.innerHTML = createLoading()
  processBookingService
    .completeBooking(getBookingIdFromBtn(submitBtn))
    .then(() => {
      toaster.success("Hoàn thành đơn thành công.", "", () => {
        reloadPage()
      })
    })
    .catch((error) => {
      toaster.error(extractErrorMessage(error))
    })
    .finally(() => {
      submitBtn.innerHTML = backupContent
    })
}

const arrivedCustomer = (e) => {
  e.preventDefault()
  const submitBtn = e.currentTarget
  const backupContent = e.target.innerHTML
  submitBtn.innerHTML = createLoading()
  processBookingService
    .arrivedCustomer(getBookingIdFromBtn(submitBtn))
    .then(() => {
      toaster.success("Khách đã đến thành công.", "", () => {
        reloadPage()
      })
    })
    .catch((error) => {
      toaster.error(extractErrorMessage(error))
    })
    .finally(() => {
      submitBtn.innerHTML = backupContent
    })
}

// const setArrivedStatus = (e) => {
//    const submitBtn = e.currentTarget
//    const backupContent = e.target.innerHTML
//    submitBtn.innerHTML = createLoading()
//    bookingService
//       .updateBooking(getBookingId(submitBtn), { Reason: "Khách không đến" })
//       .then(() => {
//          reloadPage()
//       })
//       .catch((error) => {
//          toaster.error(error.message)
//       })
//       .finally(() => {
//          submitBtn.innerHTML = backupContent
//       })
// }

const showConfirmCancelBookingModal = (e) => {
  const bookingData = JSON.parse(e.currentTarget.getAttribute("data-kb-booking-data"))
  const confirmSection = document.getElementById("confirm-cancel-form")
  confirmSection
    .querySelector(".submit-btn")
    .setAttribute("data-kb-booking-id", bookingData.ReservationID)
  const formGroups = document.querySelector(
    "#cancel-booking-modal .modal-body .booking-details .form-groups"
  )
  formGroups.querySelector(".full-name p").textContent = bookingData.Cus_FullName
  formGroups.querySelector(".phone p").textContent = bookingData.Cus_Phone
  formGroups.querySelector(".date-time p").textContent = bookingData.ArrivalTime
  formGroups.querySelector(".people-count p").textContent =
    bookingData.NumAdults + bookingData.NumChildren
  formGroups.querySelector(".note p").textContent = bookingData.Note || "Không có"
  formGroups.querySelector(".created-at p").textContent = bookingData.CreatedAt

  const confirmBooking = new bootstrap.Modal("#cancel-booking-modal")
  confirmBooking.show()
}

const showConfirmArrivedCusModal = (e) => {
  const bookingData = JSON.parse(e.currentTarget.getAttribute("data-kb-booking-data"))
  const confirmSection = document.getElementById("arrived-cus-modal")
  confirmSection
    .querySelector(".submit-btn")
    .setAttribute("data-kb-booking-id", bookingData.ReservationID)
  const formGroups = document.querySelector(
    "#arrived-cus-modal .modal-body .booking-details .form-groups"
  )
  formGroups.querySelector(".full-name p").textContent = bookingData.Cus_FullName
  formGroups.querySelector(".phone p").textContent = bookingData.Cus_Phone
  formGroups.querySelector(".date-time p").textContent = bookingData.ArrivalTime
  formGroups.querySelector(".people-count p").textContent =
    bookingData.NumAdults + bookingData.NumChildren
  formGroups.querySelector(".note p").textContent = bookingData.Note || "Không có"
  formGroups.querySelector(".created-at p").textContent = bookingData.CreatedAt

  const confirmBooking = new bootstrap.Modal("#arrived-cus-modal")
  confirmBooking.show()
}

const showConfirmRejectBookingModal = (e) => {
  const bookingData = JSON.parse(e.currentTarget.getAttribute("data-kb-booking-data"))
  const confirmSection = document.getElementById("confirm-reject-form")
  confirmSection
    .querySelector(".submit-btn")
    .setAttribute("data-kb-booking-id", bookingData.ReservationID)
  const formGroups = document.querySelector(
    "#reject-booking-modal .modal-body .booking-details .form-groups"
  )
  formGroups.querySelector(".full-name p").textContent = bookingData.Cus_FullName
  formGroups.querySelector(".phone p").textContent = bookingData.Cus_Phone
  formGroups.querySelector(".date-time p").textContent = bookingData.ArrivalTime
  formGroups.querySelector(".people-count p").textContent =
    bookingData.NumAdults + bookingData.NumChildren
  formGroups.querySelector(".note p").textContent = bookingData.Note
  formGroups.querySelector(".created-at p").textContent = bookingData.CreatedAt

  const confirmBooking = new bootstrap.Modal("#reject-booking-modal")
  confirmBooking.show()
}

const showConfirmApproveBookingModal = (e) => {
  const bookingData = JSON.parse(e.currentTarget.getAttribute("data-kb-booking-data"))
  const confirmSection = document.getElementById("confirm-approve-form")
  confirmSection
    .querySelector(".submit-btn")
    .setAttribute("data-kb-booking-id", bookingData.ReservationID)
  const formGroups = document.querySelector(
    "#approve-booking-modal .modal-body .booking-details .form-groups"
  )
  formGroups.querySelector(".full-name p").textContent = bookingData.Cus_FullName
  formGroups.querySelector(".phone p").textContent = bookingData.Cus_Phone
  formGroups.querySelector(".date-time p").textContent = bookingData.ArrivalTime
  formGroups.querySelector(".people-count p").textContent =
    bookingData.NumAdults + bookingData.NumChildren
  formGroups.querySelector(".note p").textContent = bookingData.Note
  formGroups.querySelector(".created-at p").textContent = bookingData.CreatedAt

  const confirmBooking = new bootstrap.Modal("#approve-booking-modal")
  confirmBooking.show()
}

const showConfirmCompleteBookingModal = (e) => {
  const bookingData = JSON.parse(e.currentTarget.getAttribute("data-kb-booking-data"))
  const confirmSection = document.getElementById("confirm-complete-form")
  confirmSection
    .querySelector(".submit-btn")
    .setAttribute("data-kb-booking-id", bookingData.ReservationID)
  const formGroups = document.querySelector(
    "#complete-booking-modal .modal-body .booking-details .form-groups"
  )
  formGroups.querySelector(".full-name p").textContent = bookingData.Cus_FullName
  formGroups.querySelector(".phone p").textContent = bookingData.Cus_Phone
  formGroups.querySelector(".date-time p").textContent = bookingData.ArrivalTime
  formGroups.querySelector(".people-count p").textContent =
    bookingData.NumAdults + bookingData.NumChildren
  formGroups.querySelector(".note p").textContent = bookingData.Note
  formGroups.querySelector(".created-at p").textContent = bookingData.CreatedAt

  const confirmBooking = new bootstrap.Modal("#complete-booking-modal")
  confirmBooking.show()
}

const getBookingIdFromBtn = (submitBtn) => submitBtn.getAttribute("data-kb-booking-id")

const validateReason = (reason) => {
  return true
}

const rejectBooking = (e) => {
  e.preventDefault()
  const reason = document.getElementById("reject-booking-input").value
  if (validateReason(reason)) {
    const submitBtn = e.currentTarget
    const backupContent = e.target.innerHTML
    submitBtn.innerHTML = createLoading()
    processBookingService
      .rejectBooking(getBookingIdFromBtn(submitBtn), reason)
      .then(() => {
        toaster.success("Từ chối đơn thành công.", "", () => {
          reloadPage()
        })
      })
      .catch((error) => {
        toaster.error(extractErrorMessage(error))
      })
      .finally(() => {
        submitBtn.innerHTML = backupContent
      })
  }
}

const cancelBooking = (e) => {
  e.preventDefault()
  const submitBtn = e.currentTarget
  const backupContent = e.target.innerHTML
  submitBtn.innerHTML = createLoading()
  processBookingService
    .cancelBooking(getBookingIdFromBtn(submitBtn))
    .then(() => {
      toaster.success("Hủy đơn thành công.", "", () => {
        reloadPage()
      })
    })
    .catch((error) => {
      toaster.error(extractErrorMessage(error))
    })
    .finally(() => {
      submitBtn.innerHTML = backupContent
    })
}

const init = () => {
  // table status dropdown
  const dropdownButton = document.querySelector("#booking-status-select .dropdown-toggle")
  const dropdownItems = document.querySelectorAll("#booking-status-select .dropdown-item")
  for (const item of dropdownItems) {
    item.onclick = () => {
      const selectedText = item.textContent
      const selectedStatus = item.getAttribute("data-kb-table-status")
      dropdownButton.textContent = selectedText
      document.getElementById("booking-status-input").value = selectedStatus
    }
  }

  document.getElementById("filter-bookings-form").addEventListener("submit", filterBookings)
  // document.getElementById("complete-booking-btn").addEventListener("click", completeBooking)
  // document.getElementById("set-arrived-cus-btn").addEventListener("click", setArrivedStatus)
  // document.getElementById("cancel-booking-btn").addEventListener("click", cancelBooking)
}
init()
document.addEventListener("DOMContentLoaded", function () {
  // Lấy tham số từ URL
  const params = new URLSearchParams(window.location.search)

  // Gán giá trị vào input trạng thái đơn
  const statusInput = document.querySelector("#booking-status-input")
  const statusButton = document.querySelector("#booking-status-select button")
  const selectedStatus = params.get("status")

  if (selectedStatus) {
    statusInput.value = selectedStatus
    const selectedItem = document.querySelector(
      `.dropdown-item[data-kb-table-status="${selectedStatus}"]`
    )
    if (selectedItem) {
      statusButton.textContent = selectedItem.textContent
    }
  }

  // Gán giá trị vào input thời gian nếu có
  const timeInput = document.querySelector('input[name="expires_in_hours"]')
  if (params.get("expires_in_hours")) {
    timeInput.value = params.get("expires_in_hours")
  }

  // Gán giá trị vào input ngày nếu có
  const dateInput = document.querySelector('input[name="date"]')
  if (params.get("date")) {
    dateInput.value = params.get("date")
  }

  // Gán giá trị vào input số điện thoại nếu có
  const phoneInput = document.querySelector('input[name="phonenumber"]')
  if (params.get("phonenumber")) {
    phoneInput.value = params.get("phonenumber")
  }

  // Reset thời gian khi nhập ngày & ngược lại
  dateInput.addEventListener("input", function () {
    if (dateInput.value) {
      timeInput.value = "" // Xóa giá trị của "Thời gian đến hạn"
    }
  })

  timeInput.addEventListener("input", function () {
    if (timeInput.value) {
      dateInput.value = "" // Xóa giá trị của "Trong ngày"
    }
  })
})
