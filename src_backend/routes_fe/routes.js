import express from "express"
import {
  getReservationPage,
  getBookingsHistoryPage,
  getAdminLoginPage,
  getAdminAllBookingsPage,
  getUpdateBookingsPage,
  updateBookings,
  getWorkingHoursManagementPage,
} from "../controller_fe/controller.js"
import {
  sendOTP,
  verifyOTP,
  logoutUser,
  resendOTP,
  authenticateUser,
} from "../middlewares/user-auth.middleware.js"
import { otpMap } from "../utils/maps.js"

console.log(">>> node_env:", process.env.NODE_ENV)

const router = express.Router()

router.get("/", getReservationPage)
router.get("/bookings-history", getBookingsHistoryPage)
router.get("/update-bookings", authenticateUser, getUpdateBookingsPage)
router.post("/update-bookings", authenticateUser, getUpdateBookingsPage)
router.get("/admin/login", getAdminLoginPage)
router.get("/admin/all-bookings", getAdminAllBookingsPage)
router.get("/admin/working-hours", getWorkingHoursManagementPage)
router.post("/update-bookings/update", authenticateUser, updateBookings)

// User authentication routes
router.get("/update-bookings/email-form", (req, res) => {
  const { ReservationID } = req.query
  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }
  res.render("update-bookings/email-form/email-form-page", {
    isAdmin: req.session.admin || false,
    error: null,
    ReservationID,
  })
})
router.post("/update-bookings/email-form", (req, res) => {
  const { ReservationID } = req.query
  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }
  res.render("update-bookings/email-form/email-form-page", {
    isAdmin: req.session.admin || false,
    error: null,
    ReservationID,
  })
})

router.get("/update-bookings/verify-otp", (req, res) => {
  const { ReservationID } = req.query
  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }
  if (!req.session.user || !req.session.user.otp) {
    return res.redirect("/bookings-history")
  }
  res.render("update-bookings/otp-form/otp-form-page", {
    isAdmin: req.session.admin || false,
    email: req.session.user.email,
    error: null,
    ReservationID,
  })
})

router.post("/update-bookings/send-otp", sendOTP)
router.get("/update-bookings/resend-otp", resendOTP)
router.post("/update-bookings/verify-otp", verifyOTP)
router.get("/update-bookings/logout", logoutUser)

if (process.env.NODE_ENV === "development") {
  router.get("/api/get-otp", (req, res) => {
    const { ReservationID } = req.query
    if (!ReservationID) {
      return res.status(400).json({ error: "ReservationID is required" })
    }
    // console.log("\n>>> start printing otpMap")
    // for (const [key, value] of otpMap) {
    //   console.log(`${key} => ${value}`)
    // }
    // console.log(">>> end printing otpMap\n")
    const otp = otpMap.get(ReservationID)
    res.status(200).json({ otp })
  })
  router.get("/bookings-history/test", (req, res) => {
    res.render("bookings-history/bookings-history-page", {
      isAdmin: req.session.admin || false,
      bookings: [],
      user: { email: "hanmunmun000@gmail.com" },
    })
  })
}

export default router
