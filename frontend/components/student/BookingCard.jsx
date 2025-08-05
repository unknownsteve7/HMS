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
  const { rooms } = useAppContext();
  // Log the booking object to see its structure
  console.log("BookingCard received booking:", booking);

  // Flexible property access - check all possible property name variations
  const roomId = booking.roomId || booking.room_id;
  const cotId = booking.cotId || booking.cot_id;

  // First try to find room by direct room ID
  let room = rooms.find((r) => r.id === roomId || r.room_id === roomId);

  // If room not found directly, try to find by cot ID
  if (!room && cotId) {
    // Look through all rooms and their cots to find the matching cot
    room = rooms.find(
      (r) =>
        r.cots &&
        r.cots.some(
          (cot) =>
            cot.id === cotId ||
            cot.cot_id === cotId ||
            cot.id?.toString() === cotId.toString()
        )
    );
  } // If no matching room, show booking data without room details
  if (!room) {
    console.log("Room not found for booking:", booking);
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-subtle-border pb-4 mb-4">
          <div>
            <p className="text-sm text-text-medium">Booking ID</p>
            <p className="font-mono font-semibold text-text-dark">
              {booking.id || booking.booking_id}
            </p>
            {cotId && (
              <p className="text-xs text-text-medium mt-1">Cot ID: {cotId}</p>
            )}
            {(booking.student_id || booking.studentId) && (
              <p className="text-xs text-text-medium">
                Student ID: {booking.student_id || booking.studentId}
              </p>
            )}
          </div>
          <StatusTag status={booking.status || "Processing"} />
        </div>
        <div className="py-4">
          <p className="text-amber-600 font-medium">
            Room details not available
          </p>
          <p className="text-sm text-text-medium mt-1">
            Booking created successfully. The room information may take a moment
            to appear.
          </p>
          <p className="text-sm text-text-medium mt-3">
            {booking.academic_year || booking.academicYear || "2025-2026"}:{" "}
            {booking.check_in_date || booking.checkInDate || "N/A"} to{" "}
            {booking.check_out_date || booking.checkOutDate || "N/A"}
          </p>
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

  const isCancelled = booking.status === "Cancelled";
  const bookingId = booking.id || booking.booking_id;
  const status = booking.status || "Processing";

  // Debug logging for payment button visibility
  const totalAmount = booking.total_amount || booking.totalAmount || booking.payment_amount || room.price_per_year || 0;
  const paidAmount = booking.amount_paid || booking.amountPaid || booking.total_amount_paid || 0;
  const pendingBalance = booking.balance || booking.pending_balance || (totalAmount - paidAmount);

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
                {room.roomNumber || room.room_number} (
                {room.type || room.room_type})
              </p>
              <p className="text-sm text-text-medium"> Floor: {room.floor}</p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Academic Year</p>
              <p className="font-semibold text-lg text-text-dark">
                {booking.academic_year || booking.academicYear || "2024-2025"}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Check-in / Check-out</p>
              <p className="font-semibold text-text-dark">
                {new Date(
                  booking.checkInDate || booking.check_in_date
                ).toLocaleDateString()}{" "}
                -
                {new Date(
                  booking.checkOutDate || booking.check_out_date
                ).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Facilities</p>
              <div className="flex gap-3 text-text-medium mt-1">
                {room.facilities.slice(0, 4).map((f) => {
                  if (f.includes("Fan")) return <Fan key={f} size={18} />;
                  if (f.includes("Bath")) return <Bath key={f} size={18} />;
                  if (f.includes("Wifi")) return <Wifi key={f} size={18} />;
                  return null;
                })}
              </div>
            </div>
          </div>
          <div className="border-t border-subtle-border pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-text-medium">Total Amount</p>
              <p className="font-bold">
                ₹
                {(
                  booking.totalAmount ||
                  booking.total_amount ||
                  booking.payment_amount ||
                  0
                ).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Advance Paid</p>
              <p className="font-bold text-green-600">
                ₹
                {(
                  booking.amountPaid ||
                  booking.amount_paid ||
                  booking.payment_amount ||
                  0
                ).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Balance Due</p>
              <p className="font-bold text-accent-orange">
                ₹{(booking.balance || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-medium">Payment Status</p>
              <StatusTag
                status={
                  booking.paymentStatus ||
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



          {!isCancelled && booking.status !== "Completed" && (
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
