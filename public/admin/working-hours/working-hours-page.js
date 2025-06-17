// Working Hours Management JavaScript

class WorkingHoursManager {
  constructor() {
    this.currentDate = new Date()
    this.closedDates = []
    this.init()
  }

  async init() {
    try {
      console.log('Initializing WorkingHoursManager...')
      this.bindEvents()
      
      // Load dữ liệu trước, sau đó mới render calendar
      await this.loadClosedDates()
      this.renderCalendar()
      
      console.log('WorkingHoursManager initialized successfully')
    } catch (error) {
      console.error('Error initializing WorkingHoursManager:', error)
    }
  }

  bindEvents() {
    try {
      // Working hours form
      const workingHoursForm = document.getElementById('working-hours-form')
      if (workingHoursForm) {
        workingHoursForm.addEventListener('submit', this.handleWorkingHoursSubmit.bind(this))
        console.log('Working hours form event bound')
      } else {
        console.warn('Working hours form not found')
      }

      // Add closed date form
      const saveClosedDateBtn = document.getElementById('save-closed-date')
      if (saveClosedDateBtn) {
        saveClosedDateBtn.addEventListener('click', this.handleAddClosedDate.bind(this))
        console.log('Save closed date button event bound')
      } else {
        console.warn('Save closed date button not found')
      }

      // Delete closed date buttons
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-closed-date')) {
          this.handleDeleteClosedDate(e.target.dataset.id)
        }
      })
    } catch (error) {
      console.error('Error binding events:', error)
    }
  }

  // Hàm helper để format date thành YYYY-MM-DD mà không bị ảnh hưởng timezone
  formatDateToYYYYMMDD(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  async handleWorkingHoursSubmit(e) {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    const data = {
      open_time: formData.get('open_time'),
      close_time: formData.get('close_time')
    }

    try {
      const response = await fetch('/api/working-hours/working-hours', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      if (result.success) {
        this.showToast('Cập nhật thời gian hoạt động thành công!', 'success')
        this.updateCurrentWorkingHours(data)
      } else {
        this.showToast(result.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error) {
      console.error('Error updating working hours:', error)
      this.showToast('Có lỗi xảy ra khi cập nhật thời gian', 'error')
    }
  }

  async handleAddClosedDate() {
    const closedDateInput = document.getElementById('closed-date')
    const reasonInput = document.getElementById('reason')
    
    if (!closedDateInput.value || !reasonInput.value) {
      this.showToast('Vui lòng điền đầy đủ thông tin', 'error')
      return
    }

    const data = {
      closed_date: closedDateInput.value,
      reason: reasonInput.value
    }

    try {
      const response = await fetch('/api/working-hours/closed-dates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      
      if (result.success) {
        this.showToast('Thêm ngày nghỉ thành công!', 'success')
        this.closeModal('addClosedDateModal')
        await this.loadClosedDates()
        this.renderCalendar()
        // Reset form
        closedDateInput.value = ''
        reasonInput.value = ''
      } else {
        this.showToast(result.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error) {
      console.error('Error adding closed date:', error)
      this.showToast('Có lỗi xảy ra khi thêm ngày nghỉ', 'error')
    }
  }

  async handleDeleteClosedDate(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa ngày nghỉ này?')) {
      return
    }

    try {
      const response = await fetch(`/api/working-hours/closed-dates/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        this.showToast('Xóa ngày nghỉ thành công!', 'success')
        await this.loadClosedDates()
        this.renderCalendar()
      } else {
        this.showToast(result.message || 'Có lỗi xảy ra', 'error')
      }
    } catch (error) {
      console.error('Error deleting closed date:', error)
      this.showToast('Có lỗi xảy ra khi xóa ngày nghỉ', 'error')
    }
  }

  async loadClosedDates() {
    try {
      const response = await fetch('/api/working-hours/closed-dates')
      const result = await response.json()
      
      if (result.success) {
        this.closedDates = result.data
        this.updateClosedDatesTable()
        console.log('Closed dates loaded:', this.closedDates)
      }
    } catch (error) {
      console.error('Error loading closed dates:', error)
    }
  }

  updateClosedDatesTable() {
    const tbody = document.getElementById('closed-dates-table')
    if (!tbody) {
      console.warn('Closed dates table body not found')
      return
    }

    if (this.closedDates.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Không có ngày nghỉ nào</td></tr>'
      return
    }

    tbody.innerHTML = this.closedDates.map(closedDate => `
      <tr data-id="${closedDate.id}">
        <td>${new Date(closedDate.closed_date).toLocaleDateString('vi-VN')}</td>
        <td>${closedDate.reason}</td>
        <td>
          <button class="btn btn-danger btn-sm delete-closed-date" data-id="${closedDate.id}">
            <i class="bi bi-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `).join('')
  }

  updateCurrentWorkingHours(data) {
    const currentOpenTime = document.getElementById('current-open-time')
    const currentCloseTime = document.getElementById('current-close-time')
    
    if (currentOpenTime) currentOpenTime.textContent = data.open_time
    if (currentCloseTime) currentCloseTime.textContent = data.close_time
  }

  renderCalendar() {
    const container = document.getElementById('calendar-container')
    if (!container) {
      console.warn('Calendar container not found')
      return
    }

    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()
    
    container.innerHTML = this.generateCalendarHTML(year, month)
    this.bindCalendarEvents()
    console.log('Calendar rendered for:', year, month, 'with closed dates:', this.closedDates.length)
  }

  generateCalendarHTML(year, month) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ]

    let html = `
      <div class="calendar-header">
        <h4>${monthNames[month]} ${year}</h4>
        <div class="calendar-nav">
          <button class="btn btn-outline-secondary btn-sm" onclick="workingHoursManager.previousMonth()">
            <i class="bi bi-chevron-left"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm" onclick="workingHoursManager.nextMonth()">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-header">CN</div>
        <div class="calendar-day-header">T2</div>
        <div class="calendar-day-header">T3</div>
        <div class="calendar-day-header">T4</div>
        <div class="calendar-day-header">T5</div>
        <div class="calendar-day-header">T6</div>
        <div class="calendar-day-header">T7</div>
    `

    const today = new Date()
    const currentMonth = new Date(year, month, 1)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const isCurrentMonth = date.getMonth() === month
      const isToday = date.toDateString() === today.toDateString()
      const isClosed = this.isClosedDate(date)
      
      let className = 'calendar-day'
      if (!isCurrentMonth) className += ' other-month'
      if (isToday) className += ' today'
      if (isClosed) className += ' closed'
      
      // Sử dụng hàm helper để tránh timezone offset
      const dateString = this.formatDateToYYYYMMDD(date)
      html += `<div class="${className}" data-date="${dateString}">${date.getDate()}</div>`
    }

    html += '</div>'
    return html
  }

  bindCalendarEvents() {
    const calendarDays = document.querySelectorAll('.calendar-day')
    calendarDays.forEach(day => {
      day.addEventListener('click', () => {
        const date = day.dataset.date
        if (date) {
          this.selectDateForModal(date)
        }
      })
    })
  }

  selectDateForModal(date) {
    const closedDateInput = document.getElementById('closed-date')
    if (closedDateInput) {
      closedDateInput.value = date
      // Open modal
      const modal = new bootstrap.Modal(document.getElementById('addClosedDateModal'))
      modal.show()
    }
  }

  isClosedDate(date) {
    // Sử dụng hàm helper để so sánh date
    const dateString = this.formatDateToYYYYMMDD(date)
    return this.closedDates.some(closedDate => closedDate.closed_date === dateString)
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1)
    this.renderCalendar()
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1)
    this.renderCalendar()
  }

  closeModal(modalId) {
    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId))
    if (modal) {
      modal.hide()
    }
  }

  showToast(message, type = 'success') {
    try {
      const toastId = type === 'success' ? 'successToast' : 'errorToast'
      const toastBodyId = type === 'success' ? 'successToastBody' : 'errorToastBody'
      
      const toastBody = document.getElementById(toastBodyId)
      if (toastBody) {
        toastBody.textContent = message
      }
      
      const toast = new bootstrap.Toast(document.getElementById(toastId))
      toast.show()
    } catch (error) {
      console.error('Error showing toast:', error)
      // Fallback to alert if toast fails
      alert(message)
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('DOM loaded, initializing WorkingHoursManager...')
    window.workingHoursManager = new WorkingHoursManager()
  } catch (error) {
    console.error('Error initializing WorkingHoursManager:', error)
  }
}) 