import express from "express"
import session from "express-session"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
// Cấu hình view engine EJS
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// Chia sẻ thư mục public
app.use(express.static(path.join(__dirname, "../public")))

// Cấu hình session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Đổi thành true nếu dùng HTTPS
  })
)

// Import và gọi sync database
import syncDatabase from "./config/sync-database.js"
syncDatabase()

import routes from "./routes_fe/routes.js"
// Sử dụng Router
app.use("/", routes)

// Import route
import adminRoutes from "./routes/admin.routes.js"
import reservationRoutes from "./routes/reservation.routes.js"
import workingHoursRoutes from "./routes/working-hours.routes.js"

app.get("/testLogin", (req, res) => {
  res.json(req?.session?.admin ? req.session.admin : { message: "Not logged in" })
})

import sequelize from "./config/db.js"
import crypto from "crypto"
import Admin from "./models/Admin.js"
import WorkingHours from "./models/WorkingHours.js"
import ClosedDates from "./models/ClosedDates.js"
if(process.env.NODE_ENV === "development"){
app.get("/reset-database", async (req, res) => {
  try {
    // Xóa toàn bộ dữ liệu trong database
    await sequelize.sync({ force: true }) // Dùng `force: true` để xóa toàn bộ bảng và tạo lại
    console.log("Database reset thành công!")

    // Thêm admin mẫu
    const hashedPassword = crypto.createHash("md5").update("123456").digest("hex")
    await Admin.create({
      Username: "admin",
      PasswordHash: hashedPassword,
    })
    console.log("Admin mặc định đã được thêm!")

    // Thêm giờ làm việc mặc định (8:00 - 22:00)
    await WorkingHours.create({
      open_time: "08:00:00",
      close_time: "22:00:00",
    })
    console.log("Giờ làm việc mặc định đã được thêm!")

    // Thêm một số ngày nghỉ lễ mẫu
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1
    const sampleClosedDates = [
      {
        closed_date: `${currentYear}-01-01`,
        reason: "Năm mới",
      },
      {
        closed_date: `${currentYear}-04-30`,
        reason: "Giải phóng miền Nam",
      },
      {
        closed_date: `${currentYear}-05-01`,
        reason: "Quốc tế Lao động",
      },
      {
        closed_date: `${currentYear}-09-02`,
        reason: "Quốc khánh",
      },
      {
        closed_date: `${nextYear}-01-01`,
        reason: "Năm mới",
      },
    ]

    for (const closedDate of sampleClosedDates) {
      await ClosedDates.create(closedDate)
    }
    console.log("Ngày nghỉ lễ mẫu đã được thêm!")

    return res.status(200).json({ message: "Database đã được reset và dữ liệu mặc định đã thêm!" })
  } catch (error) {
    console.error("Lỗi khi reset database:", error)
    return res.status(500).json({ error: "Lỗi khi reset database" })
  }
})
}

// Sử dụng route admin
app.use("/api/admin", adminRoutes)

// Sử dụng route reservations
app.use("/api/reservations", reservationRoutes)

// Sử dụng route working hours
app.use("/api/working-hours", workingHoursRoutes)

app.use((err, req, res, next) => {
  console.error(">>> catch uncaught error:", err)
  res.status(500).json({ message: "Internal Server Error" })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
