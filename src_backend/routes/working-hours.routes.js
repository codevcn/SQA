import express from "express"
import {
  getWorkingHoursController,
  updateWorkingHoursController,
  getAllClosedDatesController,
  addClosedDateController,
  removeClosedDateController,
  validateBookingTimeController,
} from "../controllers/working-hours.controller.js"
import { ensureAuthenticated } from "../middlewares/auth.middleware.js"

const router = express.Router()

// Routes cho thời gian hoạt động
router.get("/working-hours", getWorkingHoursController)
router.put("/working-hours", ensureAuthenticated, updateWorkingHoursController)

// Routes cho ngày nghỉ
router.get("/closed-dates", getAllClosedDatesController)
router.post("/closed-dates", ensureAuthenticated, addClosedDateController)
router.delete("/closed-dates/:id", ensureAuthenticated, removeClosedDateController)

// Route kiểm tra thời gian đặt bàn
router.get("/validate-booking-time", validateBookingTimeController)

export default router 