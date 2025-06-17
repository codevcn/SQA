import express from 'express';
import { adminLogin, changePassword, adminLogout } from '../controllers/admin.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route đăng nhập admin
router.post('/login', adminLogin);

// Route thay đổi mật khẩu (cần đảm bảo đã đăng nhập)
router.post('/change-password', ensureAuthenticated, changePassword);

// Route đăng xuất
router.get('/logout', ensureAuthenticated, adminLogout);

export default router;
