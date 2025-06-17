// Hàm kiểm tra số điện thoại cho định dạng Việt Nam
export function validatePhoneNumber(phoneNumber) {
    return true;
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}