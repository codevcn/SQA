import crypto from 'crypto';
import {Admin} from '../models/index.js';

//1. Đăng nhập
async function authenticateAdmin(username, password) {
  if (!username || !password) {
    throw new Error("Username và password là bắt buộc.");
  }
  // Tìm kiếm admin theo username bằng Sequelize
  const admin = await Admin.findOne({ where: { Username: username } });
  if (!admin) {
    throw new Error("Thông tin đăng nhập không chính xác.");
  }
  // Tính MD5 hash của password nhập vào
  const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
  if (hashedPassword !== admin.PasswordHash) {
    throw new Error("Thông tin đăng nhập không chính xác.");
  }
  return admin;
}

// 2. Đổi mật khẩu
async function changeAdminPassword(adminId, oldPassword, newPassword) {
  if (!oldPassword || !newPassword) {
    throw new Error("Cả mật khẩu cũ và mới đều cần thiết.");
  }
  
  // Lấy admin theo ID
  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    throw new Error("Admin không tồn tại.");
  }
  
  // Kiểm tra mật khẩu cũ
  const hashedOldPassword = crypto.createHash('md5').update(oldPassword).digest('hex');
  if (hashedOldPassword !== admin.PasswordHash) {
    throw new Error("Mật khẩu cũ không chính xác.");
  }
  
  // Băm mật khẩu mới và cập nhật
  const hashedNewPassword = crypto.createHash('md5').update(newPassword).digest('hex');
  admin.PasswordHash = hashedNewPassword;
  await admin.save();
  
  return admin;
}


export { authenticateAdmin, changeAdminPassword };
