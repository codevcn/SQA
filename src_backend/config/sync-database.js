import sequelize from './db.js';
import Admin from '../models/Admin.js';
import WorkingHours from '../models/WorkingHours.js';
import crypto from 'crypto';

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

    // Kiểm tra và tạo thời gian hoạt động mặc định
    const existingWorkingHours = await WorkingHours.findOne();
    if (!existingWorkingHours) {
      await WorkingHours.create({
        open_time: '08:00:00',
        close_time: '20:00:00'
      });
      console.log("Thời gian hoạt động mặc định đã được tạo.");
    } else {
      console.log("Thời gian hoạt động đã tồn tại.");
    }
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
};

export default syncDatabase; 