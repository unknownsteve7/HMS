import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import StatCard from '../../components/ui/StatCard';
import BookingCard from '../../components/student/BookingCard';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { Calendar, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const MyBookings = () => {
  const { bookings, currentUser, fetchBookings, isLoading } = useAppContext();
  const [statusFilter, setStatusFilter] = useState('All Bookings');

  // Enhanced debugging to help diagnose issues
  console.log('MyBookings render:', {
    isLoading,
    hasCurrentUser: !!currentUser,
    bookingsCount: bookings ? bookings.length : 'undefined',
    bookingsData: bookings,
    bookingsIsArray: Array.isArray(bookings),
    bookingsType: typeof bookings
  });

  // This useEffect ensures that we always have the freshest booking data from the server
  // when the component loads or when the global booking state changes.
  useEffect(() => {
    console.log('MyBookings useEffect triggered.', { hasCurrentUser: !!currentUser });
    if (currentUser) {
      console.log('User exists, attempting to fetch bookings.');
      fetchBookings().catch(error => {
        console.error('Failed to fetch bookings from useEffect:', error);
      });
    } else {
      console.log('No current user, skipping booking fetch.');
    }
    // By depending on `currentUser` and `fetchBookings`, this hook ensures data is fetched
    // when the user logs in or the context provides a new fetch function.
  }, [currentUser, fetchBookings]);

  const studentBookings = useMemo(() => {
    if (!currentUser) return [];
    // For students, the API already returns only their bookings
    return bookings || [];
  }, [bookings, currentUser]);

  const filteredBookings = useMemo(() => {
    try {
      if (!studentBookings || !Array.isArray(studentBookings)) return [];
      if (statusFilter === 'All Bookings') return studentBookings;
      return studentBookings.filter(b => b && b.status === statusFilter);
    } catch (error) {
      console.error("Error filtering bookings:", error);
      return [];
    }
  }, [studentBookings, statusFilter]);

  const stats = useMemo(() => {
    try {
      // Add defensive coding to prevent errors
      return {
        total: studentBookings?.length || 0,
        confirmed: studentBookings?.filter(b => b?.status === 'Active' || b?.status === 'Pending Check-in')?.length || 0,
        balanceDue: studentBookings?.filter(b => (b?.balance || 0) > 0)?.length || 0,
        checkedIn: studentBookings?.filter(b => b?.status === 'Active')?.length || 0,
      };
    } catch (error) {
      console.error("Error calculating booking stats:", error);
      return {
        total: 0,
        confirmed: 0,
        balanceDue: 0,
        checkedIn: 0
      };
    }
  }, [studentBookings]);

  const bookingStatuses = ['All Bookings', 'Active', 'Pending Check-in', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Bookings" value={stats.total} icon={<Calendar className="w-6 h-6" />} color="text-primary-purple" />
        <StatCard label="Confirmed" value={stats.confirmed} icon={<CheckCircle className="w-6 h-6" />} color="text-green-500" />
        <StatCard label="Balance Due" value={stats.balanceDue} icon={<AlertCircle className="w-6 h-6" />} color="text-accent-orange" />
        <StatCard label="Checked-In" value={stats.checkedIn} icon={<XCircle className="w-6 h-6" />} color="text-accent-cyan" />
      </div>

      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-dark">My Booking History</h2>
          <div className="w-full max-w-xs">
            <Select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {bookingStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {isLoading ? (
          <Card className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto"></div>
            <p className="mt-4 text-text-medium">Loading your bookings...</p>
          </Card>
        ) : filteredBookings && filteredBookings.length > 0 ? (
          filteredBookings.map(booking => {
            // Ensure we have a valid booking object with required properties
            if (!booking) return null;
            return <BookingCard key={booking.id || booking.booking_id || Math.random().toString(36)} booking={booking} />
          })
        ) : (
          <Card className="text-center py-16">
            <h3 className="text-xl font-semibold text-text-dark">No Bookings Found</h3>
            <p className="text-text-medium mt-2">
              {statusFilter === 'All Bookings'
                ? "You haven't made any bookings yet. Start by browsing available rooms!"
                : `No bookings found with status: ${statusFilter}`
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyBookings;