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

export const getUpdateBookingsPage = async (req, res, next) => {
  const { ReservationID } = req.query
  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }

  const { user, admin } = req.session
  const reservation = await getReservationById(ReservationID)
  console.log(">>> req credentials:", { user, admin })

  res.render("update-bookings/update-bookings-page", {
    reservation: reservation,
    isAdmin: admin,
    user: user,
    appMessage: "",
  })
}

export const updateBookings = async (req, res, next) => {
  const reservation = req.body
  const updatedReservation = await updateReservation(reservation.ReservationID, reservation)
  if (updatedReservation.errorCode) {
    return res.render("update-bookings/update-bookings-page", {
      reservation: reservation,
      isAdmin: admin,
      user: user,
      appMessage: "Cập nhật đơn thất bại",
    })
  }
  res.render("update-bookings/update-bookings-page", {
    reservation: reservation,
    isAdmin: admin,
    user: user,
    appMessage: "Cập nhật đơn thành công",
  })
}
