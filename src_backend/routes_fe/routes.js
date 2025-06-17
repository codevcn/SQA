import express from "express"
import {
  getReservationPage,
  getBookingsHistoryPage,
  getAdminLoginPage,
  getAdminAllBookingsPage,
  getUpdateBookingsPage,
  updateBookings,
} from "../controller_fe/controller.js"
import {
  sendOTP,
  verifyOTP,
  logoutUser,
  resendOTP,
  authenticateUser,
} from "../middlewares/user-auth.middleware.js"

const router = express.Router()

router.get("/", getReservationPage)
router.get("/bookings-history", getBookingsHistoryPage)
router.get("/update-bookings", authenticateUser, getUpdateBookingsPage)
router.post("/update-bookings", authenticateUser, getUpdateBookingsPage)
router.get("/admin/login", getAdminLoginPage)
router.get("/admin/all-bookings", getAdminAllBookingsPage)
router.post("/update-bookings/update", authenticateUser, updateBookings)

// for testing
router.get("/bookings-history/test", (req, res) => {
  res.render("bookings-history/bookings-history-page", {
    isAdmin: req.session.admin || false,
    bookings: [],
    user: { email: "hanmunmun000@gmail.com" },
  })
})

// User authentication routes
router.get("/update-bookings/email-form", (req, res) => {
  res.render("update-bookings/email-form/email-form-page", {
    isAdmin: req.session.admin || false,
    error: null,
  })
})

router.get("/update-bookings/verify-otp", (req, res) => {
  if (!req.session.user || !req.session.user.otp) {
    return res.redirect("/update-bookings/email-form")
  }
  res.render("update-bookings/otp-form/otp-form-page", {
    isAdmin: req.session.admin || false,
    email: req.session.user.email,
    error: null,
  })
})

router.post("/update-bookings/send-otp", sendOTP)
router.get("/update-bookings/resend-otp", resendOTP)
router.post("/update-bookings/verify-otp", verifyOTP)
router.get("/update-bookings/logout", logoutUser)

export default router
