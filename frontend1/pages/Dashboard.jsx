import React from 'react';
import { Users, BedDouble, CalendarCheck, IndianRupee, PieChart, Building, UserCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { useAppContext } from '../context/AppContext';
import { getAdminDashboardSummary } from '../apiService';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import StatusTag from '../components/ui/StatusTag';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const Dashboard = () => {
  const {
    students,
    rooms,
    bookings,
    payments,
    fetchStudents,
    loading,
    userRole,
    authToken,
  } = useAppContext();

  const [adminMetrics, setAdminMetrics] = React.useState(null);
  const [adminLoading, setAdminLoading] = React.useState(false);

  React.useEffect(() => {
    if (userRole === 'admin') {
      setAdminLoading(true);
      getAdminDashboardSummary(authToken)
        .then(data => setAdminMetrics(data))
        .catch(err => {
          console.error('Failed to fetch admin dashboard summary:', err);
          setAdminMetrics(null);
        })
        .finally(() => setAdminLoading(false));
    }
  }, [userRole, authToken]);

  const navigate = useNavigate();

  // ---- Totals (defensive) ----
  const totalStudents = Array.isArray(students) ? students.length : 0;
  const totalRooms = Array.isArray(rooms) ? rooms.length : 0;
  const availableRooms = Array.isArray(rooms) ? rooms.filter(r => r && r.status !== 'Full').length : 0;
  const totalBookings = Array.isArray(bookings) ? bookings.length : 0;

  // ---- Financial overview (defensive) ----
  const financialOverview = React.useMemo(() => {
    try {
      const totalRevenue = (bookings || []).reduce((acc, booking) => {
        if (!booking) return acc;
        const isActiveBooking =
          booking.status === 'Active' ||
          booking.status === 'Pending Check-in' ||
          booking.status === 'active' ||
          booking.status === 'confirmed' ||
          booking.status === 'Confirmed' ||
          booking.status === 'ACTIVE' ||
          booking.status === 'CONFIRMED';

        if (isActiveBooking) {
          const amount =
            booking.total_amount ??
            booking.totalAmount ??
            booking.amount ??
            booking.fee ??
            booking.cost ??
            0;
          return acc + (Number(amount) || 0);
        }
        return acc;
      }, 0);

      const advanceCollected = (payments || []).reduce((acc, payment) => {
        if (!payment) return acc;
        const isSuccessful =
          payment.status === 'Successful' ||
          payment.status === 'successful' ||
          payment.status === 'Completed' ||
          payment.status === 'completed' ||
          payment.status === 'SUCCESS' ||
          payment.status === 'COMPLETED' ||
          payment.status === 'paid' ||
          payment.status === 'PAID';
        if (isSuccessful) {
          const amt = Number(payment.amount ?? payment.total ?? 0) || 0;
          return acc + amt;
        }
        return acc;
      }, 0);

      return {
        totalRevenue,
        advanceCollected,
        pending: Math.max(0, totalRevenue - advanceCollected),
      };
    } catch {
      return { totalRevenue: 0, advanceCollected: 0, pending: 0 };
    }
  }, [bookings, payments]);

  // ---- Occupancy overview (defensive) ----
  const occupancyOverview = React.useMemo(() => {
    try {
      const totalCapacity = (rooms || []).reduce((acc, room) => {
        if (!room) return acc;
        const cap =
          room.totalCots ??
          room.total_cots ??
          room.capacity ??
          0;
        return acc + (Number(cap) || 0);
      }, 0);

      // Count bookings with status indicating the cot is occupied
      const occupiedStatuses = ['Allotted', 'allotted'];
      const occupiedCots = (bookings || []).filter(b => occupiedStatuses.includes(b?.status)).length;
      const availableCots = Math.max(0, totalCapacity - occupiedCots);

      return { totalCapacity, occupiedCots, availableCots };
    } catch {
      return { totalCapacity: 0, occupiedCots: 0, availableCots: 0 };
    }
  }, [rooms, bookings]);

  const occupancyRate = React.useMemo(() => {
    const totalCapacity = occupancyOverview.totalCapacity;
    const occupiedCots = occupancyOverview.occupiedCots;
    if (!totalCapacity || totalCapacity <= 0) return 0;
    return Math.min(100, (occupiedCots / totalCapacity) * 100);
  }, [occupancyOverview]);

  // ---- Recent lists ----
  const recentBookings = (bookings || []).slice(0, 5);
  const recentPayments = (payments || []).slice(0, 5);

  const getStudentName = (studentId) => {
    if (!students || !Array.isArray(students)) return 'N/A';
    const student = students.find(s => s?.id === studentId || s?.student_id === studentId);
    return student?.full_name || student?.name || 'N/A';
  };

  const getRoomNumber = (roomId) => {
    if (!rooms || !Array.isArray(rooms)) return 'N/A';
    const room = rooms.find(r => r?.id === roomId);
    return room?.room_number || 'N/A';
  };

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
      {/* Optional: manual refresh, does nothing if already loading */}
      <div className="flex justify-end">
        <Button
          onClick={() => !loading?.students && fetchStudents?.()}
          disabled={!!loading?.students}
          variant="secondary"
        >
          {loading?.students ? 'Refreshing…' : 'Refresh Students'}
        </Button>
      </div>

      {/* Main Statistics (admin uses API metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {userRole === 'admin' && adminMetrics ? (
          <>
            <StatCard label="Total Students" value={adminMetrics.total_students} icon={<Users className="w-6 h-6" />} color="text-primary-purple" />
            <StatCard label="Total Rooms" value={adminMetrics.total_rooms} icon={<Building className="w-6 h-6" />} color="text-accent-orange" />
            <StatCard label="Available Rooms" value={adminMetrics.available_rooms} icon={<BedDouble className="w-6 h-6" />} color="text-accent-cyan" />
            <StatCard label="Total Bookings" value={adminMetrics.total_bookings} icon={<CalendarCheck className="w-6 h-6" />} color="text-red-500" />
          </>
        ) : (
          <>
            <StatCard label="Total Students" value={totalStudents} icon={<Users className="w-6 h-6" />} color="text-primary-purple" />
            <StatCard label="Total Rooms" value={totalRooms} icon={<Building className="w-6 h-6" />} color="text-accent-orange" />
            <StatCard label="Available Rooms" value={availableRooms} icon={<BedDouble className="w-6 h-6" />} color="text-accent-cyan" />
            <StatCard label="Total Bookings" value={totalBookings} icon={<CalendarCheck className="w-6 h-6" />} color="text-red-500" />
          </>
        )}
      </div>

      {/* Occupancy Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        <Card>
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" /> Occupancy Overview
          </h3>
          <div className="space-y-4">
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-primary-purple h-2.5 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${isNaN(occupancyRate) ? '0' : Math.min(100, Math.max(0, occupancyRate.toFixed(0)))}%` }}
              />
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
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" /> Recent Bookings
          </h3>
          <Table headers={['Booking Ref', 'Student', 'Room', 'Status']}>
            {recentBookings.map(b => (
              <TableRow key={b.id ?? b.booking_id}>
                <TableCell><span className="font-mono text-xs">{b.booking_id}</span></TableCell>
                <TableCell>{b.full_name ?? getStudentName(b.student_id)}</TableCell>
                <TableCell>{getRoomNumber(b.roomId ?? b.room_id)}</TableCell>
                <TableCell><StatusTag status={b.status} /></TableCell>
              </TableRow>
            ))}
          </Table>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5" /> Recent Payments
          </h3>
          <Table headers={['Receipt No', 'Student', 'Amount', 'Status']}>
            {recentPayments.map(p => (
              <TableRow key={p.id ?? p.receipt_number}>
                <TableCell><span className="font-mono text-xs">{p.receipt_number}</span></TableCell>
                <TableCell>{p.full_name ?? getStudentName(p.student_id)}</TableCell>
                <TableCell>₹{Number(p.amount ?? p.total ?? 0).toLocaleString()}</TableCell>
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
