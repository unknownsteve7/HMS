import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getPayUTransactionDetails } from '../../apiService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Download } from 'lucide-react';

// Import API_URL from apiService
import { API_URL } from '../../apiService';

const PaymentStatus = ({ type = 'success' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authToken, fetchBookings } = useAppContext();
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug: Log all URL parameters and current URL
  console.log('🔍 PaymentStatus - All URL parameters:', Object.fromEntries(searchParams));
  console.log('🔍 PaymentStatus - Current URL:', window.location.href);
  console.log('🔑 Payment page loaded with auth token:', authToken ? 'Yes' : 'No');

  // Check if this is a POST redirect and prevent form resubmission issues
  useEffect(() => {
    // Check if we need to do a clean redirect to prevent form resubmission dialog
    if (window.performance && window.performance.navigation.type === 0) { // Type 0 = direct navigation
      // Save the fact we've handled this redirect to prevent an infinite loop
      const handled = sessionStorage.getItem('paymentRedirectHandled');
      if (!handled) {
        console.log('🔄 Converting POST redirect to clean GET URL');

        // Mark as handled
        sessionStorage.setItem('paymentRedirectHandled', 'true');

        // Get all current URL parameters
        const currentParams = Object.fromEntries(searchParams);

        // Add a cache-busting parameter to prevent browser from showing form resubmission dialog
        currentParams._cb = Date.now();

        // Build new URL with all parameters
        const newSearchParams = new URLSearchParams(currentParams);

        // Navigate to the clean URL (same route but now as a GET request)
        navigate({
          pathname: window.location.pathname,
          search: newSearchParams.toString()
        }, { replace: true });
      }
    } else {
      // Clear the redirect handled flag when the page is reloaded normally
      sessionStorage.removeItem('paymentRedirectHandled');
    }
  }, [navigate, searchParams]);

  const txnid = searchParams.get('txnid');
  const bookingId = searchParams.get('booking_id') || searchParams.get('udf1');
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');
  const mihpayid = searchParams.get('mihpayid');
  const errorMsg = searchParams.get('error') || searchParams.get('error_Message');
  const firstname = searchParams.get('firstname');
  const email = searchParams.get('email');

  // Determine the actual status type from URL parameters if not explicitly passed
  const actualType = type === 'success' ?
    (status === 'failure' ? 'failure' : 'success') :
    (status === 'success' ? 'success' : 'failure');

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!txnid) {
        // If no transaction ID, this might be a direct URL access
        console.log('No transaction ID found in URL parameters');
        setError('No transaction data available. This page is accessed after completing a payment.');
        setLoading(false);
        return;
      }

      console.log('📝 Fetching transaction details for txnid:', txnid);

      try {
        // Store transaction ID in session storage for recovery if needed
        sessionStorage.setItem('lastPaymentTxnId', txnid);

        const details = await getPayUTransactionDetails(txnid, authToken);
        console.log('✅ Transaction details fetched:', details);
        setTransactionDetails(details);

        // Check if this is an admin-created booking returning from PayU
        const isAdminCreatingBooking = sessionStorage.getItem('admin_creating_booking');
        if (isAdminCreatingBooking && actualType === 'success') {
          console.log('⚡ Handling admin-created booking payment completion');
          try {
            // Get the booking details saved before redirect
            const bookingDetailsStr = sessionStorage.getItem('admin_booking_details');
            if (bookingDetailsStr) {
              const bookingDetails = JSON.parse(bookingDetailsStr);
              console.log('📋 Admin booking details:', bookingDetails);

              // Now create the actual booking with payment information
              if (bookingDetails.bookingId && amount && bookingDetails.studentId && bookingDetails.roomId) {
                try {
                  // First check if booking already exists (it shouldn't in our new flow)
                  const checkResponse = await fetch(`${API_URL}/api/bookings/${bookingDetails.bookingId}`, {
                    method: 'GET',
                    headers: {
                      'Authorization': authToken ? `Bearer ${authToken}` : ''
                    }
                  });

                  if (checkResponse.ok) {
                    // Booking exists, update payment information
                    console.log('📋 Attempting to update payment status for booking:', bookingDetails.bookingId);
                    console.log('📋 Update payload:', {
                      amount: parseFloat(amount),
                      paymentStatus: 'Successful',
                      payment_status: 'Successful',
                      txnid: txnid,
                      mihpayid: mihpayid
                    });
                    
                    const updateResponse = await fetch(`${API_URL}/api/bookings/${bookingDetails.bookingId}/update-payment`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken ? `Bearer ${authToken}` : ''
                      },
                      body: JSON.stringify({
                        amount: parseFloat(amount),
                        paymentStatus: 'Successful',
                        payment_status: 'Successful', // Also try this field name
                        txnid: txnid,
                        mihpayid: mihpayid
                      })
                    });
                    
                    console.log('📊 Update response status:', updateResponse.status);
                    console.log('📊 Update response ok:', updateResponse.ok);
                    
                    if (updateResponse.ok) {
                      const updateResult = await updateResponse.json();
                      console.log('✅ Successfully updated booking payment status:', updateResult);
                      
                      // Force refresh of booking data
                      if (fetchBookings) {
                        console.log('🔄 Forcing booking data refresh after successful payment update...');
                        await fetchBookings();
                      }
                    } else {
                      const errorResult = await updateResponse.text();
                      console.error('❌ Failed to update payment status. Status:', updateResponse.status);
                      console.error('❌ Error response:', errorResult);
                      
                      // Try alternative API endpoint if the first one fails
                      console.log('🔄 Trying alternative API endpoint...');
                      const altResponse = await fetch(`${API_URL}/bookings/${bookingDetails.bookingId}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': authToken ? `Bearer ${authToken}` : ''
                        },
                        body: JSON.stringify({
                          paymentStatus: 'Successful',
                          payment_status: 'Successful'
                        })
                      });
                      
                      if (altResponse.ok) {
                        const altResult = await altResponse.json();
                        console.log('✅ Alternative endpoint worked:', altResult);
                        if (fetchBookings) {
                          await fetchBookings();
                        }
                      } else {
                        console.error('❌ Alternative endpoint also failed:', await altResponse.text());
                      }
                    }
                  } else {
                    // Booking doesn't exist, create it
                    const createResponse = await fetch(`${API_URL}/api/bookings`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken ? `Bearer ${authToken}` : ''
                      },
                      body: JSON.stringify({
                        booking_id: bookingDetails.bookingId,
                        studentId: bookingDetails.studentId,
                        roomId: bookingDetails.roomId,
                        status: 'Pending Check-in',
                        checkInDate: new Date().toISOString(),
                        checkOutDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                        paymentStatus: 'Advance Paid',
                        amountPaid: parseFloat(amount),
                        paymentMethod: 'Online Payment',
                        paymentType: bookingDetails.paymentType,
                        txnid: txnid,
                        mihpayid: mihpayid
                      })
                    });
                    console.log('📝 Created new booking with payment:', await createResponse.json());
                  }
                } catch (updateErr) {
                  console.error('❌ Failed to handle booking after payment:', updateErr);
                }
              }

              // Clear the session data
              sessionStorage.removeItem('admin_creating_booking');
              sessionStorage.removeItem('admin_booking_details');

              // Navigate back to admin booking page after a short delay
              setTimeout(() => {
                navigate('/bookings?payment_success=true');
              }, 3000);
            }
          } catch (err) {
            console.error('Failed to process admin booking completion:', err);
          }
        }

        // Refresh bookings to show updated payment status
        if (actualType === 'success' && fetchBookings) {
          fetchBookings();
        }
      } catch (err) {
        console.error('❌ Failed to fetch transaction details:', err);
        setError(`Failed to fetch transaction details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [txnid, authToken, actualType, fetchBookings, navigate]); const getStatusIcon = () => {
    switch (actualType) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failure':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <AlertCircle className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusTitle = () => {
    switch (actualType) {
      case 'success':
        return 'Payment Successful!';
      case 'failure':
        return 'Payment Failed';
      default:
        return 'Payment Status';
    }
  };

  const getStatusMessage = () => {
    switch (actualType) {
      case 'success':
        return 'Your payment has been processed successfully. Your booking has been updated.';
      case 'failure':
        return errorMsg || 'Your payment could not be processed. Please try again or contact support.';
      default:
        return 'Processing your payment status...';
    }
  }; const getStatusColor = () => {
    switch (actualType) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failure':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  if (loading && txnid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center py-8">
            <Spinner size="lg" className="mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Payment Status...
            </h2>
            <p className="text-gray-600">
              Please wait while we fetch your transaction details.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className={`max-w-2xl w-full mx-4 border-2 ${getStatusColor()}`}>
        <div className="text-center py-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Status Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {getStatusTitle()}
          </h1>

          {/* Status Message */}
          <p className="text-lg text-gray-600 mb-8">
            {getStatusMessage()}
          </p>

          {/* Transaction Details */}
          {(transactionDetails || txnid) && (
            <div className="bg-white rounded-lg p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-medium">{transactionDetails?.payu_txnid || txnid}</span>
                </div>
                {(transactionDetails?.payu_mihpayid || mihpayid) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">PayU Payment ID:</span>
                    <span className="font-mono font-medium">{transactionDetails?.payu_mihpayid || mihpayid}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-mono font-medium">{transactionDetails?.booking_id || bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-lg">₹{(transactionDetails?.amount || parseFloat(amount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium capitalize ${(transactionDetails?.status || status) === 'success' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {transactionDetails?.status || status || actualType}
                  </span>
                </div>
                {transactionDetails?.created_at ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {new Date(transactionDetails.created_at).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                )}
                {(firstname || email) && (
                  <>
                    {firstname && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Name:</span>
                        <span className="font-medium">{firstname}</span>
                      </div>
                    )}
                    {email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{email}</span>
                      </div>
                    )}
                  </>
                )}
                {transactionDetails?.hash_verified && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security:</span>
                    <span className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verified
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Details */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => navigate('/student/my-bookings')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to My Bookings
            </Button>

            {actualType === 'success' && (transactionDetails || bookingId) && (
              <Button
                variant="primary"
                onClick={() => navigate(`/student/booking-receipt/${transactionDetails?.booking_id || bookingId}`)}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download Receipt
              </Button>
            )}

            {actualType === 'failure' && bookingId && (
              <Button
                variant="primary"
                onClick={() => navigate(`/student/my-bookings?retry_payment=${bookingId}`)}
              >
                Try Payment Again
              </Button>
            )}
          </div>

          {/* Support Contact */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Need help? Contact support at{' '}
              <a href="mailto:support@sanskrithi.edu" className="text-blue-600 hover:underline">
                support@sanskrithi.edu
              </a>{' '}
              or call +91-XXXX-XXXX-XX
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentStatus;