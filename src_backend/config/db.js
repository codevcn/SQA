import { Sequelize } from "sequelize"
import dotenv from "dotenv"
import syncDatabase from "./sync-database.js"

dotenv.config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: "mysql",
  logging: false, // Tắt log của sequelize
  timezone: "+07:00", // Thiết lập múi giờ Việt Nam
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
})

// Kiểm tra kết nối
sequelize
  .authenticate()
  .then(() => console.log("Kết nối Sequelize thành công."))
  .catch((err) => {
    console.error("Lỗi kết nối Sequelize:", err)
    process.exit(1)
  })

// sync database
// syncDatabase()

export default sequelize
