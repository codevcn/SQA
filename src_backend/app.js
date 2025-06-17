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
import routes from "./routes_fe/routes.js"
// Sử dụng Router
app.use("/", routes)

// Import route
import adminRoutes from "./routes/admin.routes.js"
import reservationRoutes from "./routes/reservation.routes.js"

app.get("/testLogin", (req, res) => {
  res.json(req?.session?.admin ? req.session.admin : { message: "Not logged in" })
})

import sequelize from "./config/db.js"
import crypto from "crypto"
import Admin from "./models/Admin.js"
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

    return res.status(200).json({ message: "Database đã được reset và admin mặc định đã thêm!" })
  } catch (error) {
    console.error("Lỗi khi reset database:", error)
    return res.status(500).json({ error: "Lỗi khi reset database" })
  }
})

// Sử dụng route admin
app.use("/api/admin", adminRoutes)

// Sử dụng route reservations
app.use("/api/reservations", reservationRoutes)

app.use((err, req, res, next) => {
  console.error('>>> catch uncaught error:', err)
  res.status(500).json({ message: "Internal Server Error" })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
