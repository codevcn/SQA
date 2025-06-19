import { genOTP, sendOTPEmail } from "../utils/send-mail.js"

// Middleware xác thực user cho route getReservationsByUserInfo
export function authenticateUser(req, res, next) {
  // req.session.user = {
  //   email: "hanmunmun000@gmail.com",
  //   otp: "123456",
  //   otpExpiry: Date.now() + 5 * 60 * 1000, // OTP hết hạn sau 5 phút
  //   verified: true,
  // }
  const { ReservationID } = req.query
  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }

  const user = req.session.user
  console.log(">>> authenticate User:", { user })

  // Kiểm tra xem user đã có session chưa
  if (!user || !user.email) {
    // Chưa có session - hiển thị form nhập email
    return res.redirect("/bookings-history")
  }

  // Có session nhưng chưa xác thực OTP
  if (!user.verified) {
    if (Date.now() > req.session.user.otpExpiry) {
      // OTP hết hạn - xóa session và chuyển hướng đến form nhập email
      delete req.session.user
      return res.redirect("/bookings-history")
    }
    // Hiển thị form nhập OTP
    return res.redirect("/update-bookings/verify-otp?ReservationID=" + ReservationID)
  }

  // Đã xác thực - cho phép truy cập
  return next()
}

// Middleware xử lý việc gửi OTP qua email
export async function sendOTP(req, res, next) {
  const { email } = req.body
  const { ReservationID } = req.query

  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }

  if (!email) {
    return res.redirect("/bookings-history")
  }

  // Tạo OTP ngẫu nhiên 6 số
  const otp = genOTP()

  // Lưu thông tin user và OTP vào session
  req.session.user = {
    email: email,
    otp: otp,
    otpExpiry: Date.now() + 5 * 60 * 1000, // OTP hết hạn sau 5 phút
    verified: false,
  }

  await sendOTPEmail(email, otp)

  // Chuyển hướng đến trang nhập OTP
  res.render("update-bookings/otp-form/otp-form-page", {
    isAdmin: req.session.admin || false,
    email: email,
    error: null,
    ReservationID,
  })
}

// Middleware xử lý việc gửi lại OTP (GET request)
export async function resendOTP(req, res, next) {
  const user = req.session.user
  const { ReservationID } = req.query

  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }

  if (!user || !user.email) {
    return res.redirect("/bookings-history")
  }

  const { email } = user

  // Tạo OTP mới
  const otp = genOTP()

  // Cập nhật OTP trong session
  req.session.user.otp = otp
  req.session.user.otpExpiry = Date.now() + 5 * 60 * 1000

  // Trong thực tế, bạn sẽ gửi OTP qua email
  await sendOTPEmail(email, otp)

  // Chuyển hướng về trang nhập OTP
  res.render("update-bookings/otp-form/otp-form-page", {
    isAdmin: req.session.admin || false,
    email: email,
    error: null,
    ReservationID,
  })
}

// Middleware xác thực OTP
export function verifyOTP(req, res, next) {
  const { otp } = req.body
  const { ReservationID } = req.query
  const user = req.session.user
  const admin = req.session.admin

  console.log(">>> verify OTP:", {
    otp,
    user,
    admin,
    sessionOTP: req.session.user.otp,
    ReservationID,
  })

  if (!ReservationID) {
    return res.redirect("/bookings-history")
  }

  if (!user || !user.otp) {
    return res.redirect("/bookings-history")
  }

  if (!otp) {
    return res.render("update-bookings/otp-form/otp-form-page", {
      isAdmin: admin || false,
      email: user.email,
      error: "OTP không được để trống",
      ReservationID,
    })
  }

  // Kiểm tra OTP có đúng không
  if (otp !== req.session.user.otp) {
    return res.render("update-bookings/otp-form/otp-form-page", {
      isAdmin: admin || false,
      email: user.email,
      error: "OTP không chính xác, vui lòng thử lại",
      ReservationID,
    })
  }

  // Kiểm tra OTP có hết hạn không
  if (Date.now() > req.session.user.otpExpiry) {
    // Xóa session cũ
    delete req.session.user
    return res.render("bookings-history/bookings-history-page", {
      isAdmin: admin || false,
      error: "OTP đã hết hạn, vui lòng thử lại",
      ReservationID,
    })
  }

  // Xác thực thành công
  req.session.user.verified = true
  delete req.session.user.otp // Xóa OTP khỏi session
  delete req.session.user.otpExpiry

  res.redirect("/update-bookings?ReservationID=" + ReservationID)
}

// Middleware đăng xuất user
export function logoutUser(req, res, next) {
  delete req.session.user
  res.redirect("/")
}
