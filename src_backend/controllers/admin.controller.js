import { authenticateAdmin, changeAdminPassword } from '../services/auth.service.js';


// 1. Đăng nhập
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;
    const admin = await authenticateAdmin(username, password);
    // Lưu thông tin admin vào session
    req.session.admin = {
      id: admin.AdminID,
      username: admin.Username
    };
    res.status(200).json({ message: 'Đăng nhập thành công', admin: req.session.admin });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}

// 2. Đổi mật khẩu
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    // Lấy adminId từ session, đảm bảo rằng admin đã đăng nhập (middleware sẽ đảm bảo điều này)
    const adminId = req.session.admin.id;
    
    await changeAdminPassword(adminId, oldPassword, newPassword);
    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// 3. Đăng xuất
async function adminLogout(req, res) {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi khi đăng xuất.' });
    }
    // Xóa cookie phiên
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Đăng xuất thành công.' });
  });
}

export {adminLogin, changePassword, adminLogout};
