import WorkingHours from "../models/WorkingHours.js"
import ClosedDates from "../models/ClosedDates.js"
import { Op } from "sequelize"

// Lấy thời gian hoạt động hiện tại
export const getWorkingHours = async () => {
  try {
    const workingHours = await WorkingHours.findOne({
      order: [["id", "DESC"]],
    })
    return workingHours
  } catch (error) {
    console.error("Error getting working hours:", error)
    throw error
  }
}

// Cập nhật thời gian hoạt động
export const updateWorkingHours = async (openTime, closeTime) => {
  try {
    // Xóa tất cả record cũ
    await WorkingHours.destroy({ where: {} })
    
    // Tạo record mới
    const newWorkingHours = await WorkingHours.create({
      open_time: openTime,
      close_time: closeTime,
    })
    
    return newWorkingHours
  } catch (error) {
    console.error("Error updating working hours:", error)
    throw error
  }
}

// Lấy tất cả ngày nghỉ
export const getAllClosedDates = async () => {
  try {
    const closedDates = await ClosedDates.findAll({
      order: [["closed_date", "ASC"]],
    })
    return closedDates
  } catch (error) {
    console.error("Error getting closed dates:", error)
    throw error
  }
}

// Thêm ngày nghỉ
export const addClosedDate = async (closedDate, reason) => {
  try {
    const newClosedDate = await ClosedDates.create({
      closed_date: closedDate,
      reason: reason,
    })
    return newClosedDate
  } catch (error) {
    console.error("Error adding closed date:", error)
    throw error
  }
}

// Xóa ngày nghỉ
export const removeClosedDate = async (id) => {
  try {
    const result = await ClosedDates.destroy({
      where: { id: id },
    })
    return result > 0
  } catch (error) {
    console.error("Error removing closed date:", error)
    throw error
  }
}

// Kiểm tra xem một ngày có phải là ngày nghỉ không
export const isClosedDate = async (date) => {
  try {
    const closedDate = await ClosedDates.findOne({
      where: { closed_date: date },
    })
    return !!closedDate
  } catch (error) {
    console.error("Error checking closed date:", error)
    throw error
  }
}

// Kiểm tra thời gian đặt bàn có hợp lệ không
export const validateBookingTime = async (date, time) => {
  try {
    // Kiểm tra ngày nghỉ
    const isClosed = await isClosedDate(date)
    if (isClosed) {
      const closedDate = await ClosedDates.findOne({
        where: { closed_date: date },
      })
      return {
        isValid: false,
        reason: "Nhà hàng đóng cửa vào ngày này!",
      }
    }

    // Kiểm tra thời gian hoạt động
    const workingHours = await getWorkingHours()
    if (!workingHours) {
      return {
        isValid: false,
        reason: "Chưa cấu hình thời gian hoạt động",
      }
    }

    const bookingTime = new Date(`${date} ${time}`)
    const openTime = new Date(`${date} ${workingHours.open_time}`)
    const closeTime = new Date(`${date} ${workingHours.close_time}`)

    if (bookingTime < openTime) {
      return {
        isValid: false,
        reason: "Nhà hàng chưa mở cửa vào thời gian này!",
      }
    }

    if (bookingTime > closeTime) {
      return {
        isValid: false,
        reason: "Nhà hàng đã đóng cửa vào thời gian này!",
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error("Error validating booking time:", error)
    throw error
  }
} 