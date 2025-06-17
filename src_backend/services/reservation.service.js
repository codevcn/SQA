import { Op } from "sequelize"
import { Reservation } from "../models/index.js"
import {
  validatePhoneNumber,
  isPositiveIntegerString,
  isIntegerString,
  validateEmail,
  validateFullName,
} from "../utils/validation.js"
import sequelize from "../config/db.js"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
import { validateBookingTime } from "./working-hours.service.js"

dayjs.extend(utc)
dayjs.extend(timezone)
//1. Đặt chỗ
function convertDateTime(inputDateTime) {
  // Tách phần ngày và giờ từ chuỗi đầu vào
  const parts = inputDateTime.split(" ")
  if (parts.length !== 2) {
    return "Định dạng không hợp lệ!"
  }

  const datePart = parts[0] // dd/mm/yyyy
  const timePart = parts[1] // HH:mm

  // Kiểm tra xem chuỗi ngày có đúng định dạng "dd/mm/yyyy" không
  const dateRegex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])\/\d{4}$/
  if (!dateRegex.test(datePart)) {
    return "Ngày không hợp lệ!"
  }

  // Tách ngày, tháng, năm
  const [day, month, year] = datePart.split("/")

  // Kiểm tra xem chuỗi giờ có đúng định dạng "HH:mm" không
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(timePart)) {
    return "Giờ không hợp lệ!"
  }

  // Chuyển đổi sang định dạng "yyyy-mm-dd HH:mm"
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${timePart}`
}

async function reserve(data, action = "create") {
  // Kiểm tra xem data có phải là đối tượng hợp lệ không
  if (!data || typeof data !== "object") {
    return { errorCode: 400, message: "Dữ liệu đầu vào không hợp lệ." }
  }

  // Danh sách các trường bắt buộc
  const requiredFields = ["Cus_Email", "Cus_FullName", "Cus_Phone", "ArrivalTime", "NumAdults"]
  const errorText = {
    Cus_Email: "Email",
    Cus_FullName: "Họ và tên",
    Cus_Phone: "Số điện thoại",
    ArrivalTime: "Thời gian đặt bàn",
    NumAdults: "Số lượng người lớn",
  }

  // Kiểm tra từng trường
  for (let field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      return { errorCode: 400, message: `Thiếu thông tin: ${errorText[field]}` }
    }
  }
  if (!validatePhoneNumber(data["Cus_Phone"])) {
    return { errorCode: 400, message: "Số điện thoại không hợp lệ." }
  }
  if (!validateFullName(data["Cus_FullName"])) {
    return { errorCode: 400, message: "Trường họ và tên không hợp lệ!" }
  }
  if (!isPositiveIntegerString(data.NumAdults))
    return {
      errorCode: 400,
      message: "Số lượng người lớn phải lớn hơn hoặc bằng 1.",
    }
  if (!data.NumChildren) {
    data.NumChildren = 0
  }
  if (!isIntegerString(data.NumChildren))
    return {
      errorCode: 400,
      message: "Số lượng trẻ em phải lớn hơn hoặc bằng 0.",
    }
  if (!validateEmail(data["Cus_Email"])) {
    return { errorCode: 400, message: "Email không hợp lệ." }
  }
  try {
    // Chuyển đổi ArrivalTime thành đối tượng Date
    data.ArrivalTime = convertDateTime(data.ArrivalTime)
    
    // Kiểm tra thời gian đặt bàn có hợp lệ không
    const arrivalDateTime = dayjs(data.ArrivalTime)
    const dateString = arrivalDateTime.format('YYYY-MM-DD')
    const timeString = arrivalDateTime.format('HH:mm:ss')

    // 1. Kiểm tra ngày nghỉ lễ trước
    const { isClosedDate } = await import("./working-hours.service.js")
    const isClosed = await isClosedDate(dateString)
    if (isClosed) {
      return { errorCode: 400, message: "Nhà hàng đóng cửa vào ngày này!" }
    }

    // 2. Kiểm tra thời gian đặt trong quá khứ
    const now = dayjs()
    if (arrivalDateTime.isBefore(now)) {
      return { errorCode: 400, message: "Thời gian đặt phải từ thời điểm hiện tại trở đi!" }
    }

    // 2.5. Kiểm tra thời gian đặt phải cách hiện tại ít nhất 1 giờ
    const oneHourFromNow = now.add(1, "hour")
    if (arrivalDateTime.isBefore(oneHourFromNow)) {
      return { errorCode: 400, message: "Thời gian đặt phải cách thời điểm hiện tại ít nhất 1 giờ!" }
    }

    // 3. Kiểm tra không được quá 2 tháng
    const maxBookingDate = now.add(2, "month")
    if (arrivalDateTime.isAfter(maxBookingDate)) {
      return { errorCode: 400, message: "Thời gian đặt không được quá 2 tháng kể từ thời điểm hiện tại!" }
    }

    // 4. Kiểm tra thời gian hoạt động (giờ mở cửa/đóng cửa)
    const timeValidation = await validateBookingTime(dateString, timeString)
    if (!timeValidation.isValid) {
      return { errorCode: 400, message: timeValidation.reason }
    }

    // 5. Kiểm tra xem có đơn nào trong khoảng thời gian 1 giờ trước & sau không
    const oneHourBefore = arrivalDateTime.subtract(1, "hour")
    const oneHourAfter = arrivalDateTime.add(1, "hour")
    const conflictingReservation = await Reservation.findOne({
      where: {
        Cus_Phone: data.Cus_Phone,
        ArrivalTime: {
          [Op.between]: [oneHourBefore.toDate(), oneHourAfter.toDate()],
        },
      },
    })
    if (conflictingReservation) {
      return { errorCode: 409, message: "Bạn chỉ có thể đặt chỗ cách nhau ít nhất 1 giờ." }
    }

    if (action === "create") {
      const reservation = await Reservation.create({
        Cus_Email: data.Cus_Email,
        Cus_FullName: data.Cus_FullName,
        Cus_Phone: data.Cus_Phone,
        ArrivalTime: data.ArrivalTime,
        NumAdults: data.NumAdults,
        NumChildren: data.NumChildren,
        Note: data.Note,
      })
      return reservation
    } else {
      await Reservation.update(data, {
        where: { ReservationID: data.ReservationID },
      })
      return await Reservation.findByPk(data.ReservationID)
    }
  } catch (error) {
    console.log(">>> error at reserve:", error)
    return { errorCode: 500, message: error.message }
  }
}

// 2. tra cứu đặt chỗ
async function getReservationsByUserInfo(data) {
  if (!data || typeof data !== "object") {
    return { errorCode: 400, message: "Dữ liệu đầu vào không hợp lệ." }
  }

  // Danh sách các trường bắt buộc
  const requiredFields = ["Cus_FullName", "Cus_Phone"]
  const errorText = {
    Cus_FullName: "Họ và tên",
    Cus_Phone: "Số điện thoại",
  }

  // Kiểm tra từng trường
  for (let field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      return { errorCode: 400, message: `Thiếu thông tin: ${errorText[field]}` }
    }
  }

  try {
    const reservations = await Reservation.findAll({
      where: {
        Cus_Phone: data.Cus_Phone,
        Cus_FullName: data.Cus_FullName,
      },
    })

    // Dùng Map để gom nhóm theo ReservationID
    const reservationMap = new Map()

    reservations.forEach((reservation) => {
      const reservationID = reservation.ReservationID

      if (!reservationMap.has(reservationID)) {
        reservationMap.set(reservationID, {
          ReservationID: reservation.ReservationID,
          Cus_Email: reservation.Cus_Email,
          Cus_FullName: reservation.Cus_FullName,
          Cus_Phone: reservation.Cus_Phone,
          ArrivalTime: reservation.ArrivalTime,
          CreatedAt: reservation.CreatedAt,
          NumAdults: reservation.NumAdults,
          NumChildren: reservation.NumChildren,
          Note: reservation.Note,
          Status: reservation.Status,
        })
      }
    })
    // Chuyển Map về mảng kết quả
    return Array.from(reservationMap.values())
  } catch (error) {
    console.log(error)
    return { errorCode: 500, message: error.message }
  }
}

// 3. lấy danh sách tất cả đơn đặt chỗ
async function getAllReservation({ ReservationID, Status, Cus_Phone, timeRange, date }) {
  try {
    // Tạo điều kiện lọc
    const whereCondition = {}

    // Lọc theo Status (nếu có)
    if (Status) {
      whereCondition.Status = Status
    }
    // Lọc theo ReservationID (nếu có)
    if (ReservationID) {
      whereCondition.ReservationID = ReservationID
    }

    // Lọc theo Cus_Phone (nếu có)
    if (Cus_Phone) {
      whereCondition.Cus_Phone = Cus_Phone
    }
    timeRange = parseInt(timeRange)
    // Lọc theo khoảng thời gian (nếu có timeRange)
    if (timeRange && typeof timeRange === "number") {
      const now = dayjs().tz("Asia/Ho_Chi_Minh")
      console.log(now.format("YYYY-MM-DD HH:mm:ss")) // Kiểm tra thời gian

      // Tính toán pastTime & futureTime bằng dayjs
      const pastTime = now.subtract(Math.abs(timeRange), "hour").toDate()
      const futureTime = now.add(Math.abs(timeRange), "hour").toDate()

      whereCondition.ArrivalTime = {
        [Op.between]: [pastTime, futureTime],
      }
    }

    if (date) {
      const startOfDay = dayjs(date).startOf("day").toDate()
      const endOfDay = dayjs(date).endOf("day").toDate()

      whereCondition.ArrivalTime = {
        [Op.between]: [startOfDay, endOfDay],
      }
    }

    const reservations = await Reservation.findAll({ where: whereCondition })

    // Dùng Map để gom nhóm theo ReservationID
    const reservationMap = new Map()

    reservations.forEach((reservation) => {
      const reservationID = reservation.ReservationID

      if (!reservationMap.has(reservationID)) {
        reservationMap.set(reservationID, {
          ReservationID: reservation.ReservationID,
          Cus_FullName: reservation.Cus_FullName,
          Cus_Email: reservation.Cus_Email,
          Cus_Phone: reservation.Cus_Phone,
          ArrivalTime: reservation.ArrivalTime,
          CreatedAt: reservation.CreatedAt,
          NumAdults: reservation.NumAdults,
          NumChildren: reservation.NumChildren,
          Note: reservation.Note,
          Status: reservation.Status,
          reject_reason: reservation.reject_reason,
        })
      }
    })

    // Chuyển Map về mảng kết quả
    return Array.from(reservationMap.values())
  } catch (error) {
    console.error(error)
    return { errorCode: 500, message: "Lỗi hệ thống, vui lòng thử lại." }
  }
}

// 4. từ chối 1 đơn đặt chỗ
async function rejectReservation(data) {
  if (!data || typeof data !== "object") {
    return { errorCode: 400, message: "Dữ liệu đầu vào không hợp lệ." }
  }

  // Danh sách các trường bắt buộc
  const requiredFields = ["ReservationID"]
  const errorText = {
    ReservationID: "Mã đặt bàn",
    reject_reason: "Lý do từ chối",
  }

  // Kiểm tra từng trường
  for (let field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      return { errorCode: 400, message: `Thiếu thông tin: ${errorText[field]}` }
    }
  }
  try {
    const reservation = await Reservation.findByPk(data.ReservationID)
    if (!reservation) {
      return { errorCode: 404, message: "Đơn đặt chỗ không tồn tại." }
    }
    const status = reservation.Status
    if (status === "Rejected") {
      return { errorCode: 400, message: "Đơn đặt chỗ đã bị từ chối." }
    }
    await reservation.update({
      reject_reason: data.reject_reason,
      Status: "Rejected",
    })
    return reservation
  } catch (error) {
    console.log(error)
    return { errorCode: 500, message: error.message }
  }
}

const updateReservationStatus = async (reservationId, newStatus, rejectReason = null) => {
  try {
    const reservation = await Reservation.findByPk(reservationId)
    console.log(">>> sta:", newStatus)
    if (!reservation) {
      return { errorCode: 404, message: "Reservation not found" }
    }

    // Kiểm tra nếu trạng thái mới hợp lệ
    const validStatuses = ["Pending", "Cancelled", "Approved", "Completed", "Arrived", "Rejected"]
    if (!validStatuses.includes(newStatus)) {
      return { errorCode: 400, message: "Invalid status value" }
    }

    // Cập nhật status và reject_reason nếu cần
    await reservation.update({
      Status: newStatus,
      reject_reason: newStatus === "Rejected" ? rejectReason : null,
    })

    console.log(">>> Status updated successfully")
    return { success: true, message: "Cập nhật thành công.", data: reservation }
  } catch (error) {
    console.error(">>> Error updating status:", error)
    return { errorCode: 500, message: error.message }
  }
}

// 5. lấy thông tin đơn đặt chỗ theo ID
const getReservationById = async (reservationId) => {
  try {
    const reservation = await Reservation.findByPk(reservationId)
    return reservation
  } catch (error) {
    console.error(">>> Error getting reservation by ID:", error)
    return { errorCode: 500, message: error.message }
  }
}

const updateReservation = async (reservationId, data) => {
  try {
    const reservation = await Reservation.findByPk(reservationId)
    if (!reservation) {
      return { errorCode: 404, message: "Reservation not found" }
    }
    if (reservation.Status === "Cancelled" || reservation.Status === "Completed") {
      return { errorCode: 400, message: "Đơn đặt chỗ đã bị hủy hoặc đã hoàn thành." }
    }
    const { Cus_Email, Cus_FullName, Cus_Phone, ArrivalTime, NumAdults, NumChildren, Note } = data
    const result = await reserve(
      {
        Cus_Email,
        Cus_FullName,
        Cus_Phone,
        ArrivalTime,
        NumAdults,
        NumChildren,
        Note,
        ReservationID: reservationId,
      },
      "update"
    )

    if (result.errorCode) {
      return { errorCode: result.errorCode, message: result.message }
    }

    return result
  } catch (error) {
    console.error(">>> Error updating reservation:", error)
    return { errorCode: 500, message: error.message }
  }
}

export {
  reserve,
  getReservationsByUserInfo,
  updateReservationStatus,
  getAllReservation,
  rejectReservation,
  getReservationById,
  updateReservation,
}
