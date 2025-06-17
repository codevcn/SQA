// Hàm kiểm tra số điện thoại cho định dạng Việt Nam
export function validatePhoneNumber(phoneNumber) {
  // Kiểm tra số điện thoại không được rỗng
  if (!phoneNumber || phoneNumber.trim() === '') {
    return false;
  }
  
  // Biểu thức chính quy kiểm tra số điện thoại Việt Nam
  // Bắt đầu bằng 0, tiếp theo là 3, 5, 7, 8, 9, và có 9 chữ số tiếp theo
  const phoneRegex = /^0[35789]\d{8}$/;
  return phoneRegex.test(phoneNumber.trim());
}

export function isPositiveIntegerString(str) {
    // Biểu thức chính quy kiểm tra chuỗi chỉ chứa các chữ số và không bắt đầu bằng số 0
    const regex = /^[1-9]\d*$/;
    return regex.test(str);
}

export function isIntegerString(str) {
  // Biểu thức chính quy kiểm tra chuỗi chỉ chứa các chữ số 
  const regex = /^[0-9]\d*$/;
  return regex.test(str);
}

// Hàm kiểm tra email hợp lệ
export function validateEmail(email) {
  // Kiểm tra email không được rỗng
  if (!email || email.trim() === '') {
    return false;
  }
  
  // Biểu thức chính quy kiểm tra email hợp lệ
  // Không cho phép ký tự đặc biệt trong local part
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Hàm kiểm tra tên không chứa ký tự đặc biệt và số
export function validateFullName(fullName) {
  // Kiểm tra tên không được rỗng
  if (!fullName || fullName.trim() === '') {
    return false;
  }
  
  // Biểu thức chính quy kiểm tra tên chỉ chứa chữ cái, dấu cách và dấu tiếng Việt
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
  return nameRegex.test(fullName);
}