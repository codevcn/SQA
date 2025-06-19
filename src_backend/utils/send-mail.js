import nodemailer from "nodemailer"
import { otpMap } from "./maps.js"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dohoangvanphong000@gmail.com",
    pass: "puht tfhr qnxo kghr",
  },
})

export function genOTP(reservationId) {
  let otp = ""
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10)
  }
  otpMap.set(reservationId, otp)
  console.log(">>> otp:", otp)
  return otp
}

export function getOTPExpiry() {
  return Date.now() + 1 * 60 * 1000 // OTP hết hạn sau 1 phút
}

export async function sendOTPEmail(toEmail, reservationId) {
  const otp = otpMap.get(reservationId)
  const mailOptions = {
    from: "kingbuf.vn@gmail.com",
    to: toEmail,
    subject: "Mã OTP để xác thực email",
    html: `
      <h3>Mã OTP để xác thực email</h3>
      <p><strong>${otp}</strong></p>
      <p>Mã OTP này có hiệu lực trong 2 phút.</p>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(">>> Email sent:", info.response)
  } catch (err) {
    console.error(">>> Error sending email:", err)
  }
}
