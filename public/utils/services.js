const clientAxios = axios.create({ baseURL: "http://localhost:3000" })

class BookingService {
   async submitBooking(formData) {
      const bookingData = {
         Cus_Email: formData["email"],
         Cus_FullName: formData["full-name"],
         Cus_Phone: formData["phone"],
         ArrivalTime: formData["date"] + " " + formData["time"],
         NumAdults: formData["adults-count"],
         NumChildren: formData["children-count"],
         Note: formData["note"],
      }
      await clientAxios.post("/api/reservations/reserve", bookingData)
   }   

   async updateBooking(bookingId, formData) {
      const { data } = await clientAxios.put(`/api/reservations/update/${bookingId}`, {
         Cus_FullName: formData["full-name"],
         ArrivalTime: formData["date"] + " " + formData["time"]+':00',
         NumAdults: formData["adults-count"],
         NumChildren: formData["children-count"],
         Note: formData["note"],
      })
      console.log(data);
   }
}

const bookingService = new BookingService()

class ProcessBookingService {
   // async approveBooking(bookingId, tableIds) {
   //    const tableIDList = tableIds.map(x => parseInt(x));
   //    await clientAxios.post(`/api/reservations/assign`, {
   //       reservationID: bookingId,
   //       tableIDList:tableIDList
   //    })
   // } 

   async rejectBooking(bookingId, reason) {
      await clientAxios.post(`/api/reservations/rejectReservation/${bookingId}`, {
         reject_reason: reason
      })
   }

   async cancelBooking(bookingId) {
      await clientAxios.put(`/api/reservations/update/${bookingId}`, {
         Status: "Cancelled"
      })
   }

   async approveBooking(bookingId) {
      await clientAxios.put(`/api/reservations/update/${bookingId}`, {
         Status: "Approved"
      })
   }
   
   async arrivedCustomer(bookingId) {
      await clientAxios.put(`/api/reservations/update/${bookingId}`, {
         Status: "Arrived"
      })
   }

   async completeBooking(bookingId) {
      await clientAxios.put(`/api/reservations/update/${bookingId}`, {
         Status: "Completed"
      })
   }
}

const processBookingService = new ProcessBookingService()

class TablesService {
   async addNewTable(formData) {
      await clientAxios.post("/api/diningTable/createDiningTable", {
         TableNumber: formData["table-number"],
         Capacity: formData["capacity"],
         Location: formData["location"],
         Status: formData["status"],
      })
   }

   async deleteTable(tableId) {
      await clientAxios.delete(`/api/diningTable/deleteDiningTable/${tableId}`)
   }

   async updateTable(tableId, updateData) {
      await clientAxios.put(`/api/diningTable/updateDiningTable/${tableId}`, updateData)
   }
}

const tablesService = new TablesService()

class AuthService {
   async login(formData) {
      const { data } = await clientAxios.post("/api/admin/login", formData)
      return data
   }
}

const authService = new AuthService()
