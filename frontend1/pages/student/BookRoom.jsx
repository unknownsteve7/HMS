import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getRoomById } from '../../apiService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import RoomLayout from '../../components/student/RoomLayout';
import Modal from '../../components/ui/Modal'; // Import the Modal component

const BookRoom = () => {
  const { createBooking } = useAppContext();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCot, setSelectedCot] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [modalContent, setModalContent] = useState({ title: '', message: '' }); // State for modal content
  const [bookingDetails, setBookingDetails] = useState({
    academic_year: '2025-2026',
    check_in_date: '',
    emergency_contact_name: '',
    emergency_contact_mobile: '',
    payment_amount: '5000',
    payment_method: 'Online Payment',
    payment_type: 'Advance',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');

        const roomData = await getRoomById(roomId, authToken);
        setRoom(roomData);

        if (!roomData) {
          navigate('/student/browse-rooms');
        }
      } catch (error) {
        console.error('Failed to fetch room details:', error);
        setError('Failed to load room details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    } else {
      navigate('/student/browse-rooms');
    }
  }, [roomId, navigate]);

  const handleSelectCot = (cot) => {
    if (selectedCot && selectedCot.id === cot.id) {
      setSelectedCot(null);
    } else {
      setSelectedCot(cot);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmBooking = async () => {
    if (!room || !selectedCot) {
      setModalContent({
        title: 'Selection Required',
        message: 'Please select a cot to proceed with the booking.'
      });
      setIsModalOpen(true);
      return;
    }

    const requiredFields = [
      'check_in_date',
      'emergency_contact_name',
      'emergency_contact_mobile',
    ];

    const missingFields = requiredFields.filter(field => !bookingDetails[field]);
    if (missingFields.length > 0) {
      setModalContent({
        title: 'Missing Information',
        message: `Please fill in all required fields: ${missingFields.join(', ')}`
      });
      setIsModalOpen(true);
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        cot_id: selectedCot.id || selectedCot.cot_id,
        academic_year: bookingDetails.academic_year,
        check_in_date: bookingDetails.check_in_date,
        emergency_contact_name: bookingDetails.emergency_contact_name,
        emergency_contact_mobile: bookingDetails.emergency_contact_mobile,
        payment_amount: parseFloat(bookingDetails.payment_amount),
        payment_method: bookingDetails.payment_method,
        payment_type: bookingDetails.payment_type,
        notes: bookingDetails.notes
      };


      const response = await createBooking(bookingData);

      setModalContent({
        title: 'Booking Confirmed',
        message: 'Your booking has been successfully confirmed!'
      });
      setIsModalOpen(true);
      navigate('/student/my-bookings');
    } catch (error) {
      console.error('❌ Booking failed:', error);
      setModalContent({
        title: 'Booking Failed',
        message: `An error occurred while booking: ${error.message}`
      });
      setIsModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto"></div>
          <p className="mt-4 text-text-medium">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <Card>
          <h3 className="text-xl font-semibold text-text-dark mb-2">Error Loading Room</h3>
          <p className="text-text-medium mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Button
              variant="outline"
              onClick={() => navigate('/student/browse-rooms')}
            >
              Back to Browse Rooms
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-16">
        <Card>
          <h3 className="text-xl font-semibold text-text-dark mb-2">Room Not Found</h3>
          <p className="text-text-medium mb-4">The requested room could not be found.</p>
          <Button onClick={() => navigate('/student/browse-rooms')}>
            Back to Browse Rooms
          </Button>
        </Card>
      </div>
    );
  }

  const roomWithCots = {
    ...room,
    cots: room.cots || []
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-dark">Book Room {room.room_number || room.number}</h1>
        <p className="text-text-medium mt-1">Select a cot and provide booking details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-text-dark mb-4">Room Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-medium">Floor:</span>
                <span className="font-semibold text-text-dark">{room.floor || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-medium">Type:</span>
                <span className="font-semibold text-text-dark">{room.room_type || room.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-medium">Total Cots:</span>
                <span className="font-semibold text-text-dark">{room.total_cots || room.totalCots || room.cots?.length || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-medium">Available Cots:</span>
                <span className="font-semibold text-text-dark">
                  {room.cots
                    ? (() => {
                      const availableCotCount = room.cots.filter(
                        (cot) => cot.status?.toLowerCase() === 'available'
                      ).length;
                      const finalAvailableCotCount = selectedCot
                        ? Math.max(0, availableCotCount - 1)
                        : availableCotCount;
                      return `${finalAvailableCotCount} cot${finalAvailableCotCount !== 1 ? 's' : ''}`;
                    })()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-medium">Price per Year:</span>
                <span className="font-semibold text-text-dark">
                  ₹{(room.price_per_year || room.pricePerYear || room.price || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>


          <Card className="w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-dark mb-3 sm:mb-4">
              Room Layout
            </h2>

            <p className="text-sm sm:text-base text-text-medium mb-4">
              Click on an available cot to select it.
              <span className="text-green-600 font-semibold"> Green</span> cots are available,
              <span className="text-red-500 font-semibold"> Red</span> cots are occupied.
            </p>

            <div className="w-full max-w-[400px] mx-auto px-2 sm:px-0 overflow-x-auto sm:overflow-visible scroll-visible">
              <RoomLayout
                room={roomWithCots}
                selectedCot={selectedCot}
                onSelectCot={handleSelectCot}
              />
            </div>



          </Card>

        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold text-text-dark mb-4">Booking Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Academic Year"
                name="academic_year"
                value={bookingDetails.academic_year}
                onChange={handleInputChange}
                readOnly
                disabled
              />
              
              <Input
                label="Check-in Date"
                name="check_in_date"
                type="date"
                value={bookingDetails.check_in_date}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Emergency Contact Name"
                name="emergency_contact_name"
                placeholder="Parent/Guardian Name"
                value={bookingDetails.emergency_contact_name}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Emergency Contact Mobile"
                name="emergency_contact_mobile"
                placeholder="10-digit mobile number"
                value={bookingDetails.emergency_contact_mobile}
                onChange={handleInputChange}
                required
              />
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-dark">Payment Method</label>
                <select
                  name="payment_method"
                  value={bookingDetails.payment_method}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                >
                  <option value="Online Payment">Online Payment</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-dark">Payment Type</label>
                <select
                  name="payment_type"
                  value={bookingDetails.payment_type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                >
                  <option value="Advance">Advance</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-dark">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={bookingDetails.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the booking or payment"
                  className="w-full p-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                  rows="3"
                ></textarea>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleConfirmBooking}
            className="w-full !py-4 !text-lg"
            disabled={!selectedCot || submitting}
          >
            {submitting ? 'Processing...' : 'Confirm Booking'}
          </Button>
        </div>
      </div >
      {/* Modal for alerts */}
      <Modal Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalContent.title} >
        <p>{modalContent.message}</p>
        <Button onClick={() => setIsModalOpen(false)} className="mt-4">Close</Button>
      </Modal >
    </div >
  );
};

export default BookRoom;
