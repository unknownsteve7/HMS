import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { initiatePayUPayment, redirectToPayU } from '../../apiService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const PayUPayment = ({ booking, onPaymentInitiated, isOpen, onClose }) => {
  const { authToken } = useAppContext();
  const { showSuccess, showError, showWarning } = useToast();
  const [paymentAmount, setPaymentAmount] = useState(booking?.pending_balance || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate payment details
  const totalAmount = booking?.total_amount || 0;
  const concessionAmount = booking?.concession_amount || 0;
  const totalAmountPaid = booking?.total_amount_paid || 0;
  const pendingBalance = booking?.pending_balance || 0;
  const minPayment = 1; // Any amount greater than 0 is allowed
  const maxPayment = pendingBalance; // Can't pay more than pending balance

  const validatePayment = () => {
    const newErrors = {};

    if (!paymentAmount || paymentAmount <= 0) {
      newErrors.amount = 'Payment amount must be greater than zero';
    } else if (paymentAmount > maxPayment) {
      newErrors.amount = `Payment amount cannot exceed pending balance of ₹${maxPayment}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentInitiation = async () => {
    if (!validatePayment()) {
      showError('Please fix the payment amount');
      return;
    }

    setIsProcessing(true);

    try {

      // Call backend to initiate payment
      const paymentData = {
        booking_id: booking.booking_id || booking.id,
        student_id: booking.student_id || booking.student?.student_id,
        amount: paymentAmount,
        room_id: booking.room_id || booking.room?.room_id,
        cot_id: booking.cot_id
      };

      const response = await initiatePayUPayment(paymentData, authToken);

      if (response.success && response.payment_data) {
        showSuccess('Redirecting to payment gateway...');

        // Ensure URLs include transaction ID
        if (response.payment_data.txnid) {
          const txnid = response.payment_data.txnid;
          // Ensure URLs have the txnid parameter
          if (response.payment_data.surl && !response.payment_data.surl.includes('txnid=')) {
            response.payment_data.surl += (response.payment_data.surl.includes('?') ? '&' : '?') + `txnid=${txnid}`;
          }
          if (response.payment_data.furl && !response.payment_data.furl.includes('txnid=')) {
            response.payment_data.furl += (response.payment_data.furl.includes('?') ? '&' : '?') + `txnid=${txnid}`;
          }
        }

        // Notify parent component
        if (onPaymentInitiated) {
          onPaymentInitiated(response);
        }

        // Small delay to show success message
        setTimeout(() => {
          // Redirect to PayU gateway
          redirectToPayU(response.payment_data);
        }, 1500);

      } else {
        throw new Error(response.message || 'Failed to initiate payment');
      }

    } catch (error) {
      console.error('❌ Payment initiation failed:', error);
      showError(error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setPaymentAmount(value);

    // Clear errors when user starts typing
    if (errors.amount) {
      setErrors({ ...errors, amount: '' });
    }
  };

  const setQuickAmount = (amount) => {
    setPaymentAmount(amount);
    setErrors({ ...errors, amount: '' });
  };

  if (!booking) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Make Payment - PayU Gateway"
      size="md"
    >
      <div className="space-y-6">
        {/* Booking Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-mono">{booking.booking_id || booking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Concession Amount:</span>
              <span className="text-blue-600">₹{concessionAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="text-green-600">₹{totalAmountPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 font-medium">Pending Balance:</span>
              <span className="font-bold text-red-600">₹{pendingBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <Input
              type="number"
              min={minPayment}
              max={maxPayment}
              value={paymentAmount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quick Select:
            </label>
            <div className="flex flex-wrap gap-2">
              {pendingBalance >= 5000 && (
                <Button
                  variant="secondary"
                  onClick={() => setQuickAmount(5000)}
                  className="text-xs px-3 py-1"
                >
                  ₹5,000
                </Button>
              )}
              {pendingBalance >= 10000 && (
                <Button
                  variant="secondary"
                  onClick={() => setQuickAmount(10000)}
                  className="text-xs px-3 py-1"
                >
                  ₹10,000
                </Button>
              )}
              {pendingBalance >= 15000 && (
                <Button
                  variant="secondary"
                  onClick={() => setQuickAmount(15000)}
                  className="text-xs px-3 py-1"
                >
                  ₹15,000
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setQuickAmount(pendingBalance)}
                className="text-xs px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200"
              >
                Full Amount (₹{pendingBalance.toLocaleString()})
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Gateway Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Secure Payment with PayU</p>
              <ul className="mt-1 text-blue-700 space-y-1">
                <li>• Pay using Credit/Debit Cards, Net Banking, UPI</li>
                <li>• SSL encrypted secure transaction</li>
                <li>• Instant payment confirmation</li>
                <li>• 24/7 customer support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePaymentInitiation}
            disabled={isProcessing || !paymentAmount || paymentAmount <= 0}
            className="flex-1"
            leftIcon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          >
            {isProcessing ? 'Processing...' : `Pay ₹${paymentAmount.toLocaleString()}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PayUPayment;
