import express from 'express';
import { addReservation, getReservationsByUserInfoCtrl, getAllReservationCtrl, rejectReservationCtrl,updateReservationCtrl } from '../controllers/reservation.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { authenticateUser } from '../middlewares/user-auth.middleware.js';

const router = express.Router();


// route đặt bàn
router.post('/reserve', addReservation);

// route lấy tất cả đơn đặt bàn theo thông tin người đặt bàn - có middleware xác thực user
router.get('/getReservationsByUserInfo', authenticateUser, getReservationsByUserInfoCtrl);

// route lấy tất cả đơn đặt bàn (admin)
router.get('/getAllReservation',ensureAuthenticated, getAllReservationCtrl);

// route từ chối đơn đặt bàn (admin)
router.post('/rejectReservation/:id',ensureAuthenticated, rejectReservationCtrl);


// Route cập nhật thông tin đặt bàn (admin)
router.put('/update/:id', ensureAuthenticated, updateReservationCtrl);

export default router;