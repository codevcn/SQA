const bookingFormEle = document.getElementById("booking-form")

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
  if (reservation.Status === "Completed" || reservation.Status === "Cancelled") {
    const inputs = document.querySelectorAll(".form-field")
    for (const input of inputs) {
      input.disabled = true
    }
  }
}

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
}
init()
