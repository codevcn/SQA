import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Tắt log của sequelize
    timezone: '+07:00',  // Thiết lập múi giờ Việt Nam
    dialectOptions: {
      dateStrings: true,
      typeCast: true
    }
  }
);

// Kiểm tra kết nối
sequelize.authenticate()
  .then(() => console.log('Kết nối Sequelize thành công.'))
  .catch(err => {
    console.error('Lỗi kết nối Sequelize:', err);
    process.exit(1);
  });
// Hàm đồng bộ database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // `alter: true` sẽ cập nhật bảng mà không mất dữ liệu
    console.log("Database synchronized successfully!");
    // Kiểm tra xem đã có tài khoản admin chưa
    const existingAdmin = await Admin.findOne({ where: { Username: 'admin' } });

    if (!existingAdmin) {
      const md5Hash = crypto.createHash('md5').update('123456').digest('hex');

      await Admin.create({
        Username: 'admin',
        PasswordHash: md5Hash
      });

      console.log("Tài khoản admin mặc định đã được tạo.");
    } else {
      console.log("Tài khoản admin đã tồn tại.");
    }
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
};

// Gọi hàm đồng bộ
// syncDatabase();

export default sequelize;
