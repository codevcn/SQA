function convertTo12HourFormat(time) {
  let [hour, minute] = time.split(":").map(parseInt)
  let period = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12
  return [`${hour}:${minute.toString().padStart(2, "0")}`, period]
}

function createLoading() {
  return `
      <div class="spinner-border" role="status">
         <span class="visually-hidden">Loading...</span>
      </div>`
}

function extractFormData(formEle, formFields) {
  const form = new FormData(formEle)
  const formData = {}
  if (formFields) {
    for (const field of formFields) {
      formData[field] = form.get(field).trim()
    }
  } else {
    for (const [key, value] of form.entries()) {
      formData[key] = value
    }
  }
  return formData
}

function reloadPage() {
  window.location.reload()
}

function checkIsInteger(inputStr) {
  return /^-?\d+$/.test(inputStr)
}

function setURLWithQueryString(url, params) {
  return url + (url.includes("?") ? "&" : "?") + new URLSearchParams(params).toString()
}

function getCurrentPath() {
  return window.location.pathname
}

function navigateWithPayload(href, params) {
  window.location.href = setURLWithQueryString(href, params)
}

function extractErrorMessage(error) {
  console.log(">>> print error:", error)
  if (error.response) {
    // Server đã trả về response với status code khác 2xx
    const data = error.response.data
    if (data && typeof data === "object") {
      return data.message || JSON.stringify(data)
    }
  } else if (error.request) {
    // Request đã được gửi nhưng không nhận được response
    return "No response received from server"
  } else {
    // Một lỗi khác trong quá trình thiết lập request
    return error.message || "An unknown error occurred"
  }
  return "An error occurred"
}

function isValidVietnamPhone(phone) {
  // Xóa khoảng trắng và dấu -
  const cleaned = phone.replace(/[\s\-]/g, "")

  // Biểu thức chính quy kiểm tra số Việt Nam
  const regex = /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/

  return regex.test(cleaned)
}
