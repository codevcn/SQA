import {
  getWorkingHours,
  updateWorkingHours,
  getAllClosedDates,
  addClosedDate,
  removeClosedDate,
  validateBookingTime,
} from "../services/working-hours.service.js"

// Lấy thời gian hoạt động
export const getWorkingHoursController = async (req, res) => {
  try {
    const workingHours = await getWorkingHours()
    res.json({ success: true, data: workingHours })
  } catch (error) {
    console.error("Error in getWorkingHoursController:", error)
    res.status(500).json({ success: false, message: "Lỗi server" })
  }
}

// Cập nhật thời gian hoạt động
export const updateWorkingHoursController = async (req, res) => {
  try {
    const { open_time, close_time } = req.body

    if (!open_time || !close_time) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp giờ mở cửa và đóng cửa",
      })
    }

    const updatedHours = await updateWorkingHours(open_time, close_time)
    res.json({
      success: true,
      message: "Cập nhật thời gian hoạt động thành công",
      data: updatedHours,
    })
  } catch (error) {
    console.error("Error in updateWorkingHoursController:", error)
    res.status(500).json({ success: false, message: "Lỗi server" })
  }
}

// Lấy tất cả ngày nghỉ
export const getAllClosedDatesController = async (req, res) => {
  try {
    const closedDates = await getAllClosedDates()
    res.json({ success: true, data: closedDates })
  } catch (error) {
    console.error("Error in getAllClosedDatesController:", error)
    res.status(500).json({ success: false, message: "Lỗi server" })
  }
}

// Thêm ngày nghỉ
export const addClosedDateController = async (req, res) => {
  try {
    const { closed_date, reason } = req.body

    if (!closed_date || !reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ngày nghỉ và lý do",
      })
    }

    const newClosedDate = await addClosedDate(closed_date, reason)
    res.json({
      success: true,
      message: "Thêm ngày nghỉ thành công",
      data: newClosedDate,
    })
  } catch (error) {
    console.error("Error in addClosedDateController:", error)
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Ngày này đã được đánh dấu là ngày nghỉ",
      })
    }
    res.status(500).json({ success: false, message: "Lỗi server" })
  }
}

// Xóa ngày nghỉ
export const removeClosedDateController = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ID ngày nghỉ",
      })
    }

    const result = await removeClosedDate(id)
    if (result) {
      res.json({
        success: true,
        message: "Xóa ngày nghỉ thành công",
      })
    } else {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy ngày nghỉ",
      })
    }
  } catch (error) {
    console.error("Error in removeClosedDateController:", error)
    res.status(500).json({ success: false, message: "Lỗi server" })
  }
}

// Kiểm tra thời gian đặt bàn
export const validateBookingTimeController = async (req, res) => {
  try {
    const { date, time } = req.query

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ngày và giờ đặt bàn",
      })
    }

    const validation = await validateBookingTime(date, time)
    res.json({
      success: true,
      data: validation,
    })
  } catch (error) {
    console.error("Error in validateBookingTimeController:", error)
    res.status(500).json({ success: false, message: "Lỗi server" })
  }
} 