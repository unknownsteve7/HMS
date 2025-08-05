import React from 'react';
import { Users, BedDouble, CalendarCheck, Wallet, IndianRupee, TrendingUp, PieChart, Building, UserCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { useAppContext } from '../context/AppContext';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import StatusTag from '../components/ui/StatusTag';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const Dashboard = () => {
  const { students, rooms, bookings, payments } = useAppContext();
  const navigate = useNavigate();

  // Add defensive checks for student, room, and booking data
  console.log('Dashboard data:', { students, rooms, bookings });

  const totalStudents = Array.isArray(students) ? students.length : 0;
  const totalRooms = Array.isArray(rooms) ? rooms.length : 0;
  const availableRooms = Array.isArray(rooms) ? rooms.filter(r => r && r.status !== 'Full').length : 0;
  const totalBookings = Array.isArray(bookings) ? bookings.length : 0;

  // Calculate financial statistics with defensive coding
  const financialOverview = React.useMemo(() => {
    try {
      const totalRevenue = (bookings || []).reduce((acc, booking) => {
        if (booking && (booking.status === 'Active' || booking.status === 'Pending Check-in' || booking.status === 'active' || booking.status === 'confirmed')) {
          return acc + (booking.total_amount || booking.totalAmount || 0);
        }
        return acc;
      }, 0);

      const advanceCollected = (payments || []).reduce((acc, payment) => {
        if (payment && (payment.status === 'Successful' || payment.status === 'successful' || payment.status === 'Completed' || payment.status === 'completed')) {
          return acc + (payment.amount || 0);
        }
        return acc;
      }, 0);

      console.log('Financial calculation:', { totalRevenue, advanceCollected });
      return { totalRevenue, advanceCollected };
    } catch (error) {
      console.error('Error calculating financial overview:', error);
      return { totalRevenue: 0, advanceCollected: 0 };
    }
  }, [bookings, payments]);

  const pendingBalance = Math.max(0, financialOverview.totalRevenue - financialOverview.advanceCollected);
  const collectionRate = financialOverview.totalRevenue > 0
    ? Math.min(100, (financialOverview.advanceCollected / financialOverview.totalRevenue) * 100)
    : 0;

  // Calculate occupancy statistics with defensive coding
  const occupancyOverview = React.useMemo(() => {
    try {
      if (!Array.isArray(rooms) || !Array.isArray(bookings)) {
        console.warn('Rooms or bookings are not arrays, cannot calculate occupancy');
        return { totalCapacity: 0, occupiedCots: 0, availableCots: 0 };
      }

      // Calculate total capacity from the rooms
      const totalCapacity = rooms.reduce((total, room) => {
        if (!room) return total;
        // Try different properties where cot count might be stored
        const cotCount = Array.isArray(room.cots) ? room.cots.length
          : room.total_cots || room.totalCots || room.capacity || 0;
        return total + cotCount;
      }, 0);

      // Calculate occupied cots from bookings
      const bookedCotIds = new Set();
      let activeBookingsCount = 0;

      bookings.forEach(booking => {
        if (!booking) return;

        // Consider bookings with active statuses
        const isActiveBooking = booking.status === 'Active' ||
          booking.status === 'Pending Check-in' ||
          booking.status === 'active' ||
          booking.status === 'confirmed';

        if (isActiveBooking) {
          // Add cot IDs to the set to avoid double counting
          const cotId = booking.cotId || booking.cot_id || booking.cotID || booking.cot;
          if (cotId) {
            bookedCotIds.add(cotId.toString());
          }
          activeBookingsCount++;
        }
      });

      // If no cot IDs found but we have active bookings, use the count of active bookings
      const occupiedCots = bookedCotIds.size > 0 ? bookedCotIds.size : activeBookingsCount;
      const availableCots = Math.max(0, totalCapacity - occupiedCots);

      console.log('Occupancy calculation:', {
        totalCapacity,
        occupiedCots,
        availableCots,
        bookingsCount: bookings.length,
        activeBookingCount: activeBookingsCount,
        cotIdsFound: bookedCotIds.size,
        bookedCotIds: Array.from(bookedCotIds)
      });

      return {
        totalCapacity,
        occupiedCots,
        availableCots
      };
    } catch (error) {
      console.error('Error calculating occupancy:', error);
      return { totalCapacity: 0, occupiedCots: 0, availableCots: 0 };
    }
  }, [rooms, bookings]);

  // Calculate occupancy rate with defensive coding
  const occupancyRate = React.useMemo(() => {
    const totalCapacity = occupancyOverview.totalCapacity;
    const occupiedCots = occupancyOverview.occupiedCots;

    if (!totalCapacity || totalCapacity <= 0) return 0;
    return Math.min(100, (occupiedCots / totalCapacity) * 100);
  }, [occupancyOverview]); const recentBookings = bookings.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  const getStudentName = (studentId) => students.find(s => s.id === studentId)?.full_name || 'N/A';
  const getRoomNumber = (roomId) => rooms.find(r => r.id === roomId)?.room_number || 'N/A';

  const ActionCard = ({ title, description, path, buttonText }) => (
    <Card className="flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-lg">
      <div>
        <h3 className="text-lg font-bold text-text-dark">{title}</h3>
        <p className="text-sm text-text-medium mt-1">{description}</p>
      </div>
      <Button onClick={() => navigate(path)} variant="secondary" className="w-full mt-4">
        {buttonText}
      </Button>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Quick Action Cards */}


      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <StatCard label="Total Students" value={totalStudents} icon={<Users className="w-6 h-6" />} color="text-primary-purple" />
        <StatCard label="Total Rooms" value={totalRooms} icon={<Building className="w-6 h-6" />} color="text-accent-orange" />
        <StatCard label="Available Rooms" value={availableRooms} icon={<BedDouble className="w-6 h-6" />} color="text-accent-cyan" />
        <StatCard label="Total Bookings" value={totalBookings} icon={<CalendarCheck className="w-6 h-6" />} color="text-red-500" />
      </div>

      {/* Overviews */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2"><PieChart className="w-5 h-5" /> Occupancy Overview</h3>
          <div className="space-y-4">
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-primary-purple h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${isNaN(occupancyRate) ? '0' : Math.min(100, Math.max(0, occupancyRate.toFixed(0)))}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
              <div>
                <p className="text-xl font-bold">{isNaN(occupancyRate) ? '0.0' : occupancyRate.toFixed(1)}%</p>
                <p className="text-xs text-text-medium">Occupancy Rate</p>
              </div>
              <div>
                <p className="text-xl font-bold">{occupancyOverview.totalCapacity || 0}</p>
                <p className="text-xs text-text-medium">Total Capacity</p>
              </div>
              <div>
                <p className="text-xl font-bold text-accent-orange">{occupancyOverview.occupiedCots || 0}</p>
                <p className="text-xs text-text-medium">Occupied Cots</p>
              </div>
              <div>
                <p className="text-xl font-bold text-accent-cyan">{occupancyOverview.availableCots || 0}</p>
                <p className="text-xs text-text-medium">Available Cots</p>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Financial Overview</h3>
          <div className="space-y-4">
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-accent-orange h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${isNaN(collectionRate) ? '0' : Math.min(100, Math.max(0, collectionRate.toFixed(0)))}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
              <div>
                <p className="text-xl font-bold">₹{(financialOverview.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-text-medium">Total Revenue</p>
              </div>
              <div>
                <p className="text-xl font-bold">₹{(financialOverview.advanceCollected || 0).toLocaleString()}</p>
                <p className="text-xs text-text-medium">Advance Collected</p>
              </div>
              <div>
                <p className="text-xl font-bold">₹{(pendingBalance || 0).toLocaleString()}</p>
                <p className="text-xs text-text-medium">Pending Balance</p>
              </div>
              <div>
                <p className="text-xl font-bold">{isNaN(collectionRate) ? '0.0' : collectionRate.toFixed(1)}%</p>
                <p className="text-xs text-text-medium">Collection Rate</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5" /> Recent Bookings</h3>
          <Table headers={['Booking Ref', 'Student', 'Room', 'Status']}>
            {recentBookings.map(b => (
              <TableRow key={b.id}>
                <TableCell><span className="font-mono text-xs">{b.booking_id}</span></TableCell>
                <TableCell>{getStudentName(b.studentId)}</TableCell>
                <TableCell>{getRoomNumber(b.roomId)}</TableCell>
                <TableCell><StatusTag status={b.status} /></TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>
        <Card>
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2"><IndianRupee className="w-5 h-5" /> Recent Payments</h3>
          <Table headers={['Receipt No', 'Student', 'Amount', 'Status']}>
            {recentPayments.map(p => (
              <TableRow key={p.id}>
                <TableCell><span className="font-mono text-xs">{p.receipt_number}</span></TableCell>
                <TableCell>{getStudentName(p.studentId)}</TableCell>
                <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                <TableCell><StatusTag status={p.status} /></TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;