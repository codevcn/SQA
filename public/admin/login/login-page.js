const loginFormEle = document.getElementById("login-form")

const togglePasswordVisibility = () => {
   const passwordField = document.getElementById("password-input")
   const showPasswordBtn = loginFormEle.querySelector(".hide-show-password-btn.show")
   const hidePasswordBtn = loginFormEle.querySelector(".hide-show-password-btn.hide")

   if (passwordField.type === "password") {
      passwordField.type = "text"
      showPasswordBtn.hidden = false
      hidePasswordBtn.hidden = true
   } else {
      passwordField.type = "password"
      showPasswordBtn.hidden = true
      hidePasswordBtn.hidden = false
   }
}

const validateLoginData = (formData) => {
   const username = formData["username"],
      password = formData["password"]

   if (!username) {
      toaster.error("Trường username không được để trống!")
      return false
   }
   if (!password) {
      toaster.error("Trường mật khẩu không được để trống!")
      return false
   }

   return true
}

const loginAdmin = (e) => {
   e.preventDefault()
   const formEle = e.target
   const formData = extractFormData(formEle)
   if (validateLoginData(formData)) {
      const submitBtn = loginFormEle.querySelector(".submit-btn")
      const backupContent = submitBtn.innerHTML
      submitBtn.innerHTML = createLoading()
      authService
         .login(formData)
         .then(() => {
            toaster.success("Đăng nhập thành công.","",()=>{
               window.location.href = "/admin/all-bookings/"
            })
         })
         .catch((error) => {
            toaster.error(extractErrorMessage(error))
         })
         .finally(() => {
            submitBtn.innerHTML = backupContent
         })
   }
}

const init = () => {
   const hideShowPasswordBtns = loginFormEle.querySelectorAll(".hide-show-password-btn")
   for (const btn of hideShowPasswordBtns) {
      btn.addEventListener("click", togglePasswordVisibility)
   }

   loginFormEle.addEventListener("submit", loginAdmin)
}
init()
