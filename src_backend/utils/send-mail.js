import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dohoangvanphong000@gmail.com",
    pass: "puht tfhr qnxo kghr",
  },
})

export function genOTP() {
  let otp = ""
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10)
  }
  return otp
}

export async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: "kingbuf.vn@gmail.com",
    to: toEmail,
    subject: "Mã OTP để xác thực email",
    html: `
      <h3>Mã OTP để xác thực email</h3>
      <p><strong>${otp}</strong></p>
      <p>Mã OTP này có hiệu lực trong 5 phút.</p>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(">>> Email sent:", info.response)
  } catch (err) {
    console.error(">>> Error sending email:", err)
  }
}
