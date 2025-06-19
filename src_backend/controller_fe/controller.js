// Nếu dùng định dạng có thời gian, bạn nên import plugin "customParseFormat"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat.js"

dayjs.extend(customParseFormat)

export const getReservationPage = (req, res, next) => {
  const isAdmin = req.session.admin
  if (isAdmin) {
    return res.render("reservation/reservation-page", { isAdmin: true })
  } else {
    return res.render("reservation/reservation-page", { isAdmin: false })
  }
}
import { Op } from "sequelize"
import {
  getReservationsByUserInfo,
  getReservationById,
  updateReservation,
} from "../services/reservation.service.js"

export const getBookingsHistoryPage = async (req, res, next) => {
  // Sử dụng email từ session user đã xác thực
  const data = await getReservationsByUserInfo(req.query)

  const isAdmin = req.session.admin
  if (isAdmin) {
    return res.render("bookings-history/bookings-history-page", { bookings: data, isAdmin: true })
  } else {
    res.render("bookings-history/bookings-history-page", { bookings: data, isAdmin: false })
  }
}

export const getAdminLoginPage = (req, res, next) => {
  const isAdmin = req.session.admin
  if (isAdmin) {
    return res.redirect("/admin/all-bookings/")
  } else {
    return res.render("admin/login/login-page", { isAdmin: false })
  }
}
import { getAllReservation } from "../services/reservation.service.js"
export const getAdminAllBookingsPage = async (req, res, next) => {
  const data = req.query
  console.log(data)
  let bookings = await getAllReservation({
    Status: !req.query.status ? null : req.query.status,
    Cus_Phone: req.query.phonenumber,
    timeRange: req.query.expires_in_hours,
    date: req.query.date,
  })
  /**
      Example of data:
      {
         ReservationID: 4,
         Cus_FullName: 'Luong Thanh Loi',
         Cus_Phone: '0987654321',
         ArrivalTime: '2025-04-21 17:10:00',
         CreatedAt: '2025-04-21 17:09:18',
         NumAdults: 7,
         NumChildren: 0,
         Note: '',
         Status: 'Pending',
         reject_reason: null
      }
    */
  const updatedBookings = bookings.map((booking) => {
    const inputTime = dayjs(booking.ArrivalTime, "YYYY-MM-DD HH:mm:ss")
    return {
      ...booking,
      isExpired: inputTime.isBefore(dayjs()),
    }
  })
  console.log(">>> updated Bookings:", updatedBookings)
  const isAdmin = req.session.admin
  if (isAdmin) {
    return res.render("admin/all-bookings/all-bookings-page", {
      bookings: updatedBookings,
      isAdmin: true,
    })
  } else {
    res.redirect("/admin/login")
  }
}

// Thêm controller cho trang quản lý thời gian hoạt động
export const getWorkingHoursManagementPage = async (req, res, next) => {
  const isAdmin = req.session.admin
  if (!isAdmin) {
    return res.redirect("/admin/login")
  }

  try {
    const { getWorkingHours, getAllClosedDates } = await import(
      "../services/working-hours.service.js"
    )
    const workingHours = await getWorkingHours()
    const closedDates = await getAllClosedDates()

    res.render("admin/working-hours/working-hours-page", {
      isAdmin: true,
      workingHours: workingHours,
      closedDates: closedDates,
    })
  } catch (error) {
    console.error("Error in getWorkingHoursManagementPage:", error)
    res.render("admin/working-hours/working-hours-page", {
      isAdmin: true,
      workingHours: null,
      closedDates: [],
      error: "Lỗi khi tải dữ liệu",
    })
  }
}

export const getUpdateBookingsPage = async (req, res, next) => {
  const { ReservationID } = req.query
  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }

  const { user, admin } = req.session
  const reservation = await getReservationById(ReservationID)
  const dataInJson = reservation.toJSON()
  console.log(">>> get update bookings page:", { user, admin, dataInJson })

  res.render("update-bookings/update-bookings-page", {
    reservation: dataInJson,
    isAdmin: admin,
    user: user,
    appMessage: "",
    appStatus: "",
  })
}

function formatArrivalTime(arrivalArray) {
  const [datePart, timePart] = arrivalArray // ['18/06/2025', '19:00']

  // Parse phần ngày
  const [day, month, year] = datePart.split("/").map(Number)

  // Parse phần giờ phút
  const [hour, minute] = timePart.split(":").map(Number)

  // Tạo đối tượng Date theo local timezone
  const arrivalDate = new Date(year, month - 1, day, hour, minute)

  // Nếu bạn muốn convert sang ISO string (UTC) thì dùng:
  return arrivalDate.toISOString()
}

const formatArrivalTimeV2 = (isoString) => {
  const date = new Date(isoString)

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0") // Tháng bắt đầu từ 0
  const year = date.getFullYear()

  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  const formatted = `${day}/${month}/${year} ${hours}:${minutes}`
  return formatted
}

export const updateBookings = async (req, res, next) => {
  const reservation = req.body
  const admin = req.session.admin
  const user = req.session.user
  reservation.ArrivalTime = formatArrivalTimeV2(formatArrivalTime(reservation.ArrivalTime))
  console.log(">>> reservation 1:", reservation)
  const result = await updateReservation(reservation.ReservationID, reservation)
  if (result.errorCode) {
    console.log(">>> error:", result)
    return res.render("update-bookings/update-bookings-page", {
      reservation: reservation,
      isAdmin: !!admin,
      user: user,
      appMessage: result.message,
      appStatus: "error",
    })
  }
  const updatedReservation = result.toJSON()
  console.log(">>> reservation 2:", updatedReservation)
  res.render("update-bookings/update-bookings-page", {
    reservation: updatedReservation,
    isAdmin: !!admin,
    user: user,
    appMessage: "Cập nhật đơn thành công",
    appStatus: "success",
  })
}
