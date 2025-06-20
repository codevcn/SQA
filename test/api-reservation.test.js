const axios = require('axios');
const { expect } = require('chai');
const dayjs = require('dayjs');

const BASE_URL = 'http://localhost:3000/api/reservations';
const DOMAIN = process.env.DOMAIN || 'http://localhost:3000';

// Helper functions
function getTomorrowDateFormatted() {
    return dayjs().add(1, 'day').format('DD/MM/YYYY');
}

function getRelativeTimeFormatted(hours) {
    return dayjs().add(hours, 'hour').format('DD/MM/YYYY HH:mm');
}

function getValidReservationData() {
    const futureTime = getRelativeTimeFormatted(2);
    const [date, time] = futureTime.split(' ');
    
    return {
        Cus_Email: 'test@example.com',
        Cus_FullName: 'Nguyễn Văn A',
        Cus_Phone: '0987654321',
        ArrivalTime: `12/07/2025 12:00`,
        NumAdults: 2,
        NumChildren: 0,
        Note: 'Bàn gần cửa sổ'
    };
}

describe('API Tests - Chức năng đặt bàn', function() {
    this.timeout(10000);

    beforeEach(async function() {
        // Reset database trước mỗi test
        try {
            await axios.get('http://localhost:3000/reset-database');
        } catch (error) {
            console.log('Database reset failed:', error.message);
        }
    });

    describe('POST /api/reservations/reserve', function() {
        
        // TC1: C1 – Họ tên - "Nguyen@VanA" - Ký tự đặc biệt
        it('TC1: Họ tên chứa ký tự đặc biệt', async function() {
            const data = getValidReservationData();
            data.Cus_FullName = 'Nguyen@VanA';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('họ và tên không hợp lệ');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC2: C1 – Họ tên - "Nguyen 9A" - Chứa số
        it('TC2: Họ tên chứa ký tự số', async function() {
            const data = getValidReservationData();
            data.Cus_FullName = 'Nguyen 9A';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('họ và tên không hợp lệ');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC3: C1 – Họ tên - "" - Rỗng
        it('TC3: Họ tên rỗng', async function() {
            const data = getValidReservationData();
            data.Cus_FullName = '';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Thiếu thông tin: Họ và tên');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC4: C2 – SĐT - "12345" - Dưới 10 số
        it('TC4: Số điện thoại dưới 10 số', async function() {
            const data = getValidReservationData();
            data.Cus_Phone = '12345';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                expect.fail('Expected request to fail');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Số điện thoại không hợp lệ.');
                return;
            }
            
        });

        // TC5: C2 – SĐT - "09ab567890" - Có ký tự chữ
        it('TC5: Số điện thoại chứa ký tự chữ', async function() {
            const data = getValidReservationData();
            data.Cus_Phone = '09ab567890';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Số điện thoại không hợp lệ.');
                return;
            }
        });

        // TC6: C2 – SĐT - "" - Rỗng
        it('TC6: Số điện thoại rỗng', async function() {
            const data = getValidReservationData();
            data.Cus_Phone = '';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Thiếu thông tin: Số điện thoại');
                return;
            }
            
        });

        // TC7: C3 – Email - "abcgmail.com" - Thiếu ký tự @
        it('TC7: Email thiếu ký tự @', async function() {
            const data = getValidReservationData();
            data.Cus_Email = 'abcgmail.com';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Email không hợp lệ.');
                return;
            }
            expect.fail('Expected request to fail'); 
        });

        // TC8: C3 – Email - "" - Rỗng
        it('TC8: Email rỗng', async function() {
            const data = getValidReservationData();
            data.Cus_Email = '';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Thiếu thông tin: Email');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC9: C4 – Ngày giờ - "23:30 12/08/2025" - Ngoài khung giờ
        it('TC9: Đặt bàn ngoài khung giờ làm việc', async function() {
            const data = getValidReservationData();
            const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY');
            data.ArrivalTime = `${tomorrow} 23:30`;
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('đã đóng cửa vào thời gian này');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC10: C4 – Ngày giờ - "10:00 01/01/2022" - Quá khứ
        it('TC10: Đặt bàn trong quá khứ', async function() {
            const data = getValidReservationData();
            data.ArrivalTime = '01/01/2022 10:00';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('cách thời điểm hiện tại ít nhất 1 giờ');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC11: C4 – Ngày giờ - "" - Rỗng
        it('TC11: Ngày đặt rỗng', async function() {
            const data = getValidReservationData();
            data.ArrivalTime = '';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                expect.fail('Expected request to fail');
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Thiếu thông tin: Thời gian đặt bàn');
                return;
            }
        });

        // TC12: C5 – Thời điểm - Hiện tại + 30 phút - Cách hiện tại < 1 giờ
        it('TC12: Đặt bàn cách hiện tại dưới 1 giờ', async function() {
            const data = getValidReservationData();
            const now = dayjs();
            const shortTime = now.add(30, 'minute');
            data.ArrivalTime = shortTime.format('DD/MM/YYYY HH:mm');
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('cách thời điểm hiện tại ít nhất 1 giờ');
                return;
                }
            expect.fail('Expected request to fail');
        });

        // TC13: C6 – Ngày nghỉ - "01/01/2025" - Ngày nhà hàng nghỉ
        it('TC13: Đặt bàn vào ngày nghỉ lễ', async function() {
            const data = getValidReservationData();
            data.ArrivalTime = '01/01/2026 12:00';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('đóng cửa vào ngày này');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC14: C4 – Ngày giờ - "" - Rỗng
        it('TC14: Giờ đặt rỗng', async function() {
            const data = getValidReservationData();
            data.ArrivalTime = '';
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Thiếu thông tin: Thời gian đặt bàn');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC15: C7 – Số lượng người lớn - 0 - Bằng 0
        it('TC15: Số người lớn bằng 0', async function() {
            const data = getValidReservationData();
            data.NumAdults = 0;
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
          
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Số lượng người lớn phải lớn hơn hoặc bằng 1.');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC16: C7 – Số lượng người lớn - -3 - Âm
        it('TC16: Số người lớn âm', async function() {
            const data = getValidReservationData();
            data.NumAdults = -3;
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Số lượng người lớn phải lớn hơn hoặc bằng 1.');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC17: C7 – Số lượng người lớn - "" - Rỗng
        it('TC17: Số người lớn rỗng', async function() {
            const data = getValidReservationData();
            delete data.NumAdults;
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('Thiếu thông tin: Số lượng người lớn');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC18: C8 – Số lượng trẻ em - -2 - Âm
        it('TC18: Số lượng trẻ em âm', async function() {
            const data = getValidReservationData();
            data.NumChildren = -2;
            
            try {
                await axios.post(`${BASE_URL}/reserve`, data);
                
            } catch (error) {
                expect(error.response.status).to.equal(400);
                expect(error.response.data.message).to.include('trẻ em phải lớn hơn hoặc bằng 0');
                return;
            }
            expect.fail('Expected request to fail');
        });

        // TC19: Tất cả hợp lệ - Tất cả giá trị hợp lệ - Đặt bàn thành công
        it('TC19: Đặt bàn thành công với tất cả thông tin hợp lệ', async function() {
            const data = getValidReservationData();
            const response = await axios.post(`${BASE_URL}/reserve`, data);
            
            expect(response.status).to.equal(201);
            expect(response.data.message).to.equal('Đặt bàn thành công.');
            expect(response.data.reservation).to.have.property('ReservationID');
            expect(response.data.reservation.Cus_FullName).to.equal(data.Cus_FullName);
            expect(response.data.reservation.Cus_Phone).to.equal(data.Cus_Phone);
            expect(response.data.reservation.Cus_Email).to.equal(data.Cus_Email);
            expect(response.data.reservation.NumAdults).to.equal(data.NumAdults);
            expect(response.data.reservation.NumChildren).to.equal(data.NumChildren);
            expect(response.data.reservation.Note).to.equal(data.Note);
            expect(response.data.reservation.Status).to.equal('Pending');

        });

    });

}); 