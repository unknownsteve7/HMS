import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useAppContext } from '../../context/AppContext';
import { ArrowRight, BedDouble, Calendar, Banknote, UserCircle } from 'lucide-react';
import StatusTag from '../../components/ui/StatusTag';

const ActionCard = ({ title, description, link, icon }) => (
  <Card className="group hover:scale-105 transition-transform duration-300">
    <Link to={link} className="flex flex-col h-full">
      <div className="flex-grow">
        <div className="mb-4 text-primary-purple">{icon}</div>
        <h3 className="text-xl font-bold text-text-dark">{title}</h3>
        <p className="text-text-medium mt-2 text-sm">{description}</p>
      </div>
      <div className="mt-4 flex items-center justify-end text-sm font-semibold text-primary-purple">
        View <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  </Card>
);

const StudentDashboard = () => {
  const { bookings, payments, currentUser, rooms } = useAppContext();

  // When a student is logged in, `bookings` and `payments` from context are already theirs.
  const activeBooking = (bookings || []).find(b => b.status === 'Active' || b.status === 'active');
  const recentBookings = (bookings || []).slice(0, 3);
  const recentPayments = (payments || []).slice(0, 3);

  const getRoom = (roomId) => {
    if (!rooms || !Array.isArray(rooms) || !roomId) return null;
    return rooms.find(r => r.id === roomId || r.room_id === roomId || r._id === roomId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-dark">Welcome, {currentUser?.full_name || currentUser?.name}!</h1>
        <p className="text-text-medium mt-1">Here's a summary of your hostel activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ActionCard title="Browse Rooms" description="Find and book your preferred room." link="/student/browse-rooms" icon={<BedDouble size={28} />} />
        <ActionCard title="My Bookings" description="View your current and past bookings." link="/student/my-bookings" icon={<Calendar size={28} />} />
        <ActionCard title="Payment History" description="Track your payment records." link="/student/payment-history" icon={<Banknote size={28} />} />
        <ActionCard title="My Profile" description="Update your personal information." link="/student/profile" icon={<UserCircle size={28} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
     
          <Card className='col-span-1'>
            <h2 className="text-xl font-bold text-text-dark mb-4">Recent Bookings</h2>
            <div className="space-y-4">
              {recentBookings.length > 0 ? recentBookings.map(b => {
                const room = getRoom(b.roomId || b.room_id);
                return (
                  <div key={b.id || b.booking_id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold">{room ? `Room ${room.room_number || room.roomNumber || 'N/A'}` : 'Room N/A'}</p>
                      <p className="text-xs text-text-medium">{new Date(b.check_in_date || b.checkInDate).toLocaleDateString()}</p>
                    </div>
                    <StatusTag status={b.status} />
                  </div>
                );
              }) : <p className="text-text-medium text-sm">No recent bookings.</p>}
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-bold text-text-dark mb-4">Recent Payments</h2>
            <div className="space-y-4">
              {recentPayments.length > 0 ? recentPayments.map(p => (
                <div key={p.payment_id || p.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold">₹{(p.amount || 0).toLocaleString()}</p>
                    <p className="text-xs text-text-medium">
                      {p.room_number ? `Room ${p.room_number} | ` : ''}
                      {p.receipt_number || p.payment_id}
                    </p>
                  </div>
                  <StatusTag status={p.status || 'Paid'} />
                </div>
              )) : <p className="text-text-medium text-sm">No recent payments.</p>}
            </div>
          </Card>
        
      </div>
    </div>
  );
};

export default StudentDashboard;