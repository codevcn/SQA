import express from 'express';
import { addReservation, getReservationsByUserInfoCtrl, getAllReservationCtrl, rejectReservationCtrl,updateReservationCtrl } from '../controllers/reservation.controller.js';
import { ensureAuthenticated } from '../middlewares/auth.middleware.js';
import { authenticateUser } from '../middlewares/user-auth.middleware.js';
import { getReservationById } from '../services/reservation.service.js';

const router = express.Router();


// route đặt bàn
router.post('/reserve', addReservation);

// route lấy reservation theo ID (không cần xác thực)
router.get('/:id', async (req, res) => {
  try {
    const reservationId = req.params.id;
    const result = await getReservationById(reservationId);
    
    if (result.errorCode) {
      return res.status(result.errorCode).json({ message: result.message });
    }
    
    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt bàn.' });
    }
    
    return res.status(200).json({
      message: 'Lấy thông tin đơn đặt bàn thành công.',
      reservation: result
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// route lấy tất cả đơn đặt bàn theo thông tin người đặt bàn - có middleware xác thực user
router.get('/getReservationsByUserInfo', authenticateUser, getReservationsByUserInfoCtrl);

// route lấy tất cả đơn đặt bàn (admin)
router.get('/getAllReservation',ensureAuthenticated, getAllReservationCtrl);

// route từ chối đơn đặt bàn (admin)
router.post('/rejectReservation/:id',ensureAuthenticated, rejectReservationCtrl);


// Route cập nhật thông tin đặt bàn (admin)
router.put('/update/:id', ensureAuthenticated, updateReservationCtrl);

export default router;