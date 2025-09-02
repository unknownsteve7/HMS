import React, { useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import StatusTag from "../ui/StatusTag";
import { useAppContext } from "../../context/AppContext";
import { Fan, Bath, Tv, Wifi } from "lucide-react";
// Add these imports to your existing BookingCard.jsx
import PayUPayment from "../payu/PayUPayment"; // Adjust path as needed
import { CreditCard } from "lucide-react";

const BookingCard = ({ booking }) => {
  // Log the booking object to see its structure
  console.log("BookingCard received booking:", booking);

  // Use embedded room data from booking object instead of searching context
  const room = booking.room;
  const student = booking.student;
  const payments = booking.payments || [];

  // Extract booking details from the API response structure
  const bookingId = booking.booking_id;
  const cotId = booking.cot_id;
  const status = booking.status || "Processing";
  const checkInDate = booking.check_in_date;
  const academicYear = booking.academic_year;
  const totalAmountPaid = booking.total_amount_paid || 0;
  const pendingBalance = booking.pending_balance || 0;

  // Extract room details from embedded room object
  const roomNumber = room?.room_number || 'N/A';
  const roomType = room?.room_type || 'Standard';
  const floor = room?.floor || 'N/A';
  const totalAmount = room?.price_per_year || 0;

  // Find the specific cot from the room's cots array
  const assignedCot = room?.cots?.find(cot => cot.cot_id === cotId);
  const cotNumber = assignedCot?.cot_number || 'N/A';

  // Extract student details
  const studentName = student?.full_name || 'N/A';
  const registrationNumber = student?.Registration_number || 'N/A';

  // If no room data is embedded, show error (this shouldn't happen with the new API structure)
  if (!room) {
    console.error("No room data found in booking object:", booking);
    return (
      <Card className="bg-red-50 border-red-200">
        <div className="text-center py-4">
          <p className="text-red-600 font-semibold">Error: Missing room data</p>
          <p className="text-xs text-red-500 mt-1">Booking ID: {bookingId}</p>
        </div>
      </Card>
    );
  }

  // Add this component to handle PayU payment button in your existing BookingCard
  const PayUPaymentButton = ({ booking }) => {
    const { userRole } = useAppContext(); // ✅ Add userRole context
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handlePaymentInitiated = (response) => {
      console.log("Payment initiated:", response);
      // Close modal when payment is initiated (user will be redirected to PayU)
      setShowPaymentModal(false);
    };

    // Calculate pending balance more reliably
    const totalAmount = booking.total_amount || booking.totalAmount || booking.payment_amount || room.price_per_year || 0;
    const paidAmount = booking.amount_paid || booking.amountPaid || booking.total_amount_paid || 0;
    const pendingBalance = booking.balance || booking.pending_balance || (totalAmount - paidAmount);

    console.log('PayU Payment Debug:', {
      bookingId: booking.id || booking.booking_id,
      totalAmount,
      paidAmount,
      pendingBalance,
      bookingBalance: booking.balance,
      hasPendingBalance: pendingBalance > 0
    });

    // Only show PayU payment option if there's a pending balance
    if (pendingBalance <= 0) {
      console.log('No pending balance, hiding PayU button');
      return null;
    }

    return (
      <>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setShowPaymentModal(true)}
          leftIcon={<CreditCard className="w-4 h-4" />}
        >  {/* ✅ Different text for admin vs student */}
          {userRole === 'admin' ? 'Process Payment' : 'Pay with PayU'}
          {pendingBalance > 0 ? ` (₹${pendingBalance.toLocaleString()})` : ""}
        </Button>

        <PayUPayment
          booking={{
            ...booking,
            pending_balance: pendingBalance,
            total_amount: totalAmount,
            total_amount_paid: paidAmount
          }}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentInitiated={handlePaymentInitiated}
        />
      </>
    );
  };

  const isCancelled = status === "Cancelled";

  // Debug logging for payment button visibility
  const paidAmount = totalAmountPaid;

  console.log('BookingCard Debug:', {
    bookingId,
    status,
    isCancelled,
    totalAmount,
    paidAmount,
    pendingBalance,
    showPaymentButton: pendingBalance > 0 && !isCancelled
  });

  return (
    <Card
      className={`transition-all duration-300 ${isCancelled ? "bg-slate-50 opacity-70" : ""
        }`}
    >
      <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-subtle-border pb-4 mb-4">
        <div>
          <p className="text-sm text-text-medium">Booking ID</p>
          <p className="font-mono font-semibold text-text-dark">{bookingId}</p>
        </div>
        <StatusTag status={status} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Room & Financial Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-medium">Room</p>
              <p className="font-semibold text-lg text-text-dark">
                {roomNumber} ({roomType})
              </p>
              <p className="text-sm text-text-medium">Floor: {floor}</p>
              <p className="text-sm text-text-medium">Cot: {cotNumber}</p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Academic Year</p>
              <p className="font-semibold text-lg text-text-dark">
                {academicYear || "2024-2025"}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Check-in Date</p>
              <p className="font-semibold text-text-dark">
                {checkInDate ? new Date(checkInDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Facilities</p>
              <div className="flex gap-3 text-text-medium mt-1">
                {(() => {
                  try {
                    if (!Array.isArray(room.facilities)) return null;
                    
                    const facilityIcons = [];
                    const addedIcons = new Set();
                    
                    // First pass: Look for exact matches
                    room.facilities.some(facility => {
                      if (!facility) return false;
                      const name = String(
                        typeof facility === 'string' ? facility : 
                        facility.name || facility.facility_name || ''
                      ).toLowerCase().trim();
                      
                      if (!name) return false;
                      
                      if (name.includes('fan') && !addedIcons.has('fan')) {
                        facilityIcons.push(<Fan key="fan" size={18} />);
                        addedIcons.add('fan');
                      } else if (name.includes('bath') && !addedIcons.has('bath')) {
                        facilityIcons.push(<Bath key="bath" size={18} />);
                        addedIcons.add('bath');
                      } else if (name.includes('wifi') && !addedIcons.has('wifi')) {
                        facilityIcons.push(<Wifi key="wifi" size={18} />);
                        addedIcons.add('wifi');
                      }
                      
                      return facilityIcons.length >= 3; // Max 3 icons
                    });
                    
                    return facilityIcons;
                  } catch (error) {
                    console.error('Error rendering facilities:', error);
                    return null;
                  }
                })()}
              </div>
            </div>
          </div>
          <div className="border-t border-subtle-border pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-medium">Total Amount</p>
              <p className="font-bold">
                ₹{totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Amount Paid</p>
              <p className="font-bold text-green-600">
                ₹{totalAmountPaid.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Balance Due</p>
              <p className="font-bold text-accent-orange">
                ₹{booking.pending_balance.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Payment Status</p>
              <StatusTag
                status={
                  booking.total_payment_status ||
                  booking.payment_status ||
                  booking.payment_method ||
                  "Pending"
                }
              />
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex flex-col md:border-l md:pl-6 border-subtle-border justify-center items-center gap-3">
          {/* Show payment button if there's a balance due and booking is not cancelled */}
          {pendingBalance > 0 && !isCancelled && (
            <PayUPaymentButton booking={booking} />
          )}



          {!isCancelled && booking.total_payment_status !== "Completed" && (
            <Button
              variant="destructive"

              className="w-full bg-red text-white hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BookingCard;
