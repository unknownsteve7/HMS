import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getPayUTransactionDetails, API_URL } from '../../apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Download } from 'lucide-react';

/**
 * A reusable component to display the status of a payment (success, failure, or pending)
 * after the user returns from the PayU payment gateway.
 */
const PaymentStatus = ({ type = 'success' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authToken, fetchBookings } = useAppContext(); // Context for auth and data refresh
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Step 1: Prevent Form Resubmission on Refresh ---
  // This effect checks if the user arrived via a POST redirect from PayU.
  // If so, it replaces the URL with a clean GET request to prevent the
  // "Confirm Form Resubmission" browser dialog on page refresh.
  useEffect(() => {
    // Check for direct navigation, which happens after a POST redirect
    if (window.performance && window.performance.navigation.type === 0) {
      const handled = sessionStorage.getItem('paymentRedirectHandled');
      if (!handled) {
        console.log('🔄 Converting POST redirect to a clean GET URL...');
        sessionStorage.setItem('paymentRedirectHandled', 'true');
        
        // Preserve all existing URL parameters and add a cache-buster
        const currentParams = new URLSearchParams(searchParams);
        currentParams.set('_cb', Date.now()); // Cache-busting parameter

        navigate({
          pathname: window.location.pathname,
          search: currentParams.toString()
        }, { replace: true });
      }
    } else {
      // Clear the flag on normal page loads or reloads
      sessionStorage.removeItem('paymentRedirectHandled');
    }
  }, [navigate, searchParams]);

  // --- Step 2: Extract All Relevant Data from URL ---
  const txnid = searchParams.get('txnid');
  const bookingId = searchParams.get('booking_id') || searchParams.get('udf1'); // UDF1 is a common fallback
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');
  const mihpayid = searchParams.get('mihpayid'); // PayU's own ID
  const errorMsg = searchParams.get('error') || searchParams.get('error_Message');
  const firstname = searchParams.get('firstname');
  const email = searchParams.get('email');

  // Determine the final status, prioritizing the URL param over the component prop
  const actualType = status === 'failure' ? 'failure' : 'success';

  // --- Step 3: Fetch Full Transaction Details from Backend ---
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!txnid) {
        setError('No transaction data found. This page should be accessed after a payment attempt.');
        setLoading(false);
        return;
      }

      console.log(`📝 Fetching details for transaction ID: ${txnid}`);
      try {
        const details = await getPayUTransactionDetails(txnid, authToken);
        console.log('✅ Full transaction details fetched:', details);
        setTransactionDetails(details);

        // After fetching, if the payment was successful, refresh the user's booking list
        if (details.status === 'success' && typeof fetchBookings === 'function') {
          console.log("🔄 Refreshing user's bookings after successful payment...");
          await fetchBookings();
        }

      } catch (err) {
        console.error('❌ Failed to fetch transaction details:', err);
        setError(`Could not verify transaction details. Please check your bookings page or contact support. Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
       fetchTransactionDetails();
    } else {
        console.warn("⚠️ Waiting for auth token to fetch transaction details...");
        // If there's no token yet, the effect will re-run when it becomes available.
    }
  }, [txnid, authToken, fetchBookings]);

  // --- Step 4: UI Helper Functions ---
  const getStatusIcon = () => {
    switch (actualType) {
      case 'success': return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failure': return <XCircle className="w-16 h-16 text-red-500" />;
      default: return <AlertCircle className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (actualType) {
      case 'success': return 'Payment Successful!';
      case 'failure': return 'Payment Failed';
      default: return 'Payment Status';
    }
  };

  const getStatusMessage = () => {
    switch (actualType) {
      case 'success': return 'Your payment has been processed and your booking is confirmed.';
      case 'failure': return errorMsg || 'Your payment could not be processed. No funds have been deducted.';
      default: return 'Verifying payment status...';
    }
  };

  // --- Step 5: Render Loading State or Final UI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <Spinner size="lg" className="mb-4" />
            <h2 className="text-xl font-semibold">Verifying Payment...</h2>
            <p className="text-gray-600">Please wait, this won't take long.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <div className="text-center p-6 sm:p-8">
          <div className="flex justify-center mb-6">{getStatusIcon()}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{getStatusTitle()}</h1>
          <p className="text-lg text-gray-600 mb-8">{getStatusMessage()}</p>

        {/* Transaction Details Box */}
          {(transactionDetails || txnid) && (
            <div className="bg-gray-50 border rounded-lg p-4 sm:p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-medium">{transactionDetails?.payu_txnid || txnid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-mono font-medium">{transactionDetails?.booking_id || bookingId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-lg">₹{(transactionDetails?.amount || parseFloat(amount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Date:</span>
                  <span className="font-medium">{new Date(transactionDetails?.created_at || Date.now()).toLocaleString()}</span>
                </div>
                {transactionDetails?.hash_verified && (
                  <div className="flex justify-between pt-3 mt-3 border-t">
                    <span className="text-gray-600">Security Status:</span>
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Display Errors */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8 text-sm">
              <p>{error}</p>
            </div>
          )}

        {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" onClick={() => navigate('/student/my-bookings')} leftIcon={<ArrowLeft />}>
              Go to My Bookings
            </Button>
            {actualType === 'success' && bookingId && (
              <Button variant="primary" onClick={() => navigate(`/student/booking-receipt/${bookingId}`)} leftIcon={<Download />}>
                Download Receipt
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentStatus;




