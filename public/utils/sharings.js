class ReservationPageShares {
   constructor() {
      this.bookingData = undefined
   }
}

const reservationPageShares = new ReservationPageShares()

class Toaster {
   error(title, message, okHandler) {
      Swal.fire({
         title,
         text: message,
         icon: "error",
      }).then((result) => {
         if (result.isConfirmed) {
            if (okHandler) okHandler()
         }
      })
   }

   success(title, message, okHandler) {
      Swal.fire({
         title,
         text: message,
         icon: "success",
      }).then((result) => {
         if (result.isConfirmed) {
            if (okHandler) okHandler()
         }
      })
   }

   info(title, message, okHandler) {
      Swal.fire({
         title,
         text: message,
         icon: "info",
      }).then((result) => {
         if (result.isConfirmed) {
            if (okHandler) okHandler()
         }
      })
   }
}

const toaster = new Toaster()

class ProcessBookingShares {
   constructor() {
      this.pickedTables = []
   }

   pickTable(...tableIds) {
      this.pickedTables.push(...tableIds)
   }

   unpickTable(...tableIds) {
      this.pickedTables = this.pickedTables.filter((id) => !tableIds.includes(id))
   }
}

const processBookingShares = new ProcessBookingShares()
