// Cancel a booking for the current user
export async function cancelBooking(bookingId, authToken) {
  const token = authToken || localStorage.getItem('authToken');
  const response = await fetch(`${API_URL}/bookings/me/${bookingId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!response.ok) {
    throw new Error('Failed to cancel booking');
  }
  return response.json();
}
// GET /admin/dashboard/summary - returns admin metrics
export const getAdminDashboardSummary = async (token = null) => {
  const headers = setAuthHeader({}, token);
  const response = await fetch(`${API_URL}/admin/dashboard/summary`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error('Failed to fetch admin dashboard summary');
  }
  return await response.json();
};
// This file contains a collection of simple JavaScript functions for making API calls.
// It should not contain any React-specific code like hooks (e.g., useState, useEffect, useCallback).

// const API_URL = 'http://192.168.29.24:8000';
export const API_URL = 'https://ssehostelbackend-production.up.railway.app';
//export const API_URL = 'https://derek-invited-cook-mills.trycloudflare.com';

// Helper function to create FormData
const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return formData;
};

// Safe token logging helper to prevent substring errors
const safeTokenLog = (token) => {
  if (!token) return 'null';
  if (typeof token !== 'string') return 'non-string';
  return `${token.substring(0, 10)}...`;
};

// Helper function to set authorization headers consistently
const setAuthHeader = (headers = {}, token = null) => {
  if (!token) {
    // Try to get token from localStorage as a fallback
    token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken_backup');

    if (!token) {
      console.warn('⚠️ No authentication token found in memory or storage');
      return headers;
    } else {
      
    }
  }

  // Try all possible auth header formats that the API might expect
  // We'll set multiple headers to increase chances of success

  // Most common format with Bearer prefix
  headers['Authorization'] = `Bearer ${token}`;

  // Alternative formats for different API implementations
  headers['x-auth-token'] = token;
  headers['x-access-token'] = token;
  headers['auth-token'] = token;

  // Also set a simple token header without prefix as fallback
  headers['token'] = token;

  return headers;
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    

    if (options.body) {
      if (typeof options.body === 'string') {
        try {
          const parsedBody = JSON.parse(options.body);
        } catch (e) {
          
        }
      } else {
        
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        // Don't set Content-Type header when using FormData - browser will set it automatically with boundary
        ...options.headers,
      },
      ...options,
    });

   

    if (!response.ok) {
      // Special handling for students endpoint
      if ((endpoint === '/students/') && (response.status === 401 || response.status === 403)) {

        // Get user role and token info for debugging
        const userRole = localStorage.getItem('userRole');
        const hasToken = !!localStorage.getItem('authToken');
        const hasSessionToken = !!sessionStorage.getItem('authToken_backup');

        console.error('🔑 Auth state debug:', {
          userRole,
          hasToken,
          hasSessionToken,
          requestURL: `${API_URL}${endpoint}`,
          statusCode: response.status
        });
      }

      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
      } catch (e) {
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return { success: true, status: 204, message: 'Operation completed successfully' };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('💥 API call failed:', error);

    // Handle network errors with more user-friendly messages
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      // For login endpoints, show "Invalid Credentials" instead of network error
      if (endpoint.includes('/login')) {
        throw new Error('Invalid Credentials. Please check your email and password.');
      } else {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }

    throw error;
  }
};

// Student Login API
export const studentLogin = async (username, password) => {
  const formData = createFormData({
    username: username,
    password: password,
  });

  try {
    return await apiCall('/student/login', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('❌ Student login failed:', error);

    // Convert any error to an invalid credentials message for login attempts
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
      throw new Error('Invalid Credentials. Please check your email and password.');
    }

    throw error;
  }
};

// Admin Login API
export const adminLogin = async (username, password) => {

  const formData = createFormData({
    username: username,
    password: password,
  });

  try {
    const result = await apiCall('/admin/login', {
      method: 'POST',
      body: formData,
    });

    return result;
  } catch (error) {

    // Convert any error to an invalid credentials message for login attempts
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
      throw new Error('Invalid Credentials. Please check your email and password.');
    } else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Invalid Credentials. Please check your email and password.');
    }

    throw error;
  }
};



// Add these PayU-related functions to your existing apiService.js

// ==============================================================================
// PAYU PAYMENT GATEWAY FUNCTIONS
// ==============================================================================

/**
 * Initiate PayU payment for a booking and handle redirect
 */
export const initiatePayUPayment = async (paymentData, authToken = null) => {
  const token = authToken || localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Support both old signature (bookingId, amount) and new signature (paymentData object)
  let payload;
  if (typeof paymentData === 'object' && paymentData.booking_id) {
    // New signature: paymentData object
    payload = {
      booking_id: paymentData.booking_id,
      student_id: paymentData.student_id,
      amount: parseFloat(paymentData.amount),
      room_id: paymentData.room_id,
      cot_id: paymentData.cot_id,
      product_info: "Hostel Room Booking - Sanskrithi School of Engineering"
    };
  } else {
    // Old signature: (bookingId, amount) - for backward compatibility
    payload = {
      booking_id: paymentData,
      amount: parseFloat(authToken), // In old signature, amount was second param
      product_info: "Hostel Room Booking - Sanskrithi School of Engineering"
    };
  }

 

  try {
    const result = await apiCall('/api/payments/initiate', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });


    // Handle redirect based on response
    if (result && result.payment_url) {
      window.location.href = result.payment_url;
      return result;
    }

    // If we get PayU form data, use form submission method
    if (result && result.payuForm) {
      redirectToPayU(result.payuForm);
      return result;
    }

    // If we get PayU parameters, create form and submit
    if (result && (result.key || result.txnid)) {
      redirectToPayU(result);
      return result;
    }

    return result;

  } catch (error) {
    console.error('❌ PayU payment initiation failed:', error);

    // Provide more specific error messages
    if (error.status === 500) {
      throw new Error('The payment server is currently unavailable. Please try again later or use a different payment method.');
    } else if (error.status === 404) {
      throw new Error('Payment service not found. Please contact support.');
    } else if (error.message && error.message.includes('Network Error')) {
      throw new Error('Network connection issue. Please check your internet connection.');
    }

    throw error;
  }
};



/**
 * Handle PayU failure callback.
 * This endpoint expects x-www-form-urlencoded data.
 */

/**
 * Get PayU transaction details by transaction ID
 */
export const getPayUTransactionDetails = async (txnid, authToken = null) => {
  const token = authToken || localStorage.getItem('authToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const result = await apiCall(`/api/payments/transaction/${txnid}`, {
      method: 'GET',
      headers: headers,
    });

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all PayU transactions for current student
 */
export const getStudentPayUTransactions = async (authToken = null) => {
  const headers = setAuthHeader({}, authToken);

  try {
    const result = await apiCall('/payments/student/transactions', {
      method: 'GET',
      headers: headers,
    });

    return result;
  } catch (error) {
    console.error('❌ Failed to fetch student PayU transactions:', error);
    throw error;
  }
};

/**
 * Utility function to redirect to PayU payment gateway
 */
export const redirectToPayU = (paymentData) => {

  try {
    // Store state in sessionStorage to indicate we're coming from a payment flow
    // This helps with handling the back button and direct URL access cases
    sessionStorage.setItem('paymentInProgress', 'true');
    sessionStorage.setItem('paymentTxnId', paymentData.txnid || '');

    // Create a form dynamically and submit to PayU
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.action_url;

    // Add all PayU parameters as hidden form fields
    const payuParams = [
      'key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone',
      'hash', 'surl', 'furl', 'curl', 'udf1', 'udf2', 'udf3', 'udf4', 'udf5'
    ];

    payuParams.forEach(param => {
      if (paymentData[param] !== undefined) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = param;
        input.value = paymentData[param];
        form.appendChild(input);

        // Log important URLs
        if (param === 'surl') {
          
        }
        if (param === 'furl') {
          
        }
      }
    });

    // Submit form to PayU
    document.body.appendChild(form);
    form.submit();


  } catch (error) {
    console.error('❌ Error redirecting to PayU:', error);
    throw new Error('Failed to redirect to payment gateway');
  }
};

// Generic Login API (if you want to pass role as parameter)
export const login = async (email, password, role = 'student') => {
  try {
    if (role === 'admin') {
      return await adminLogin(email, password);
    } else {
      return await studentLogin(email, password);
    }
  } catch (error) {
    console.error('❌ Login failed:', error);

    // Ensure we always return a user-friendly error for login
    if (error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.name === 'TypeError') {
      throw new Error('Invalid Credentials. Please check your email and password.');
    }

    throw error;
  }
};

// Get all facilities API
export const getAllFacilities = async (authToken = null) => {

  try {
    const headers = setAuthHeader({}, authToken);

    const result = await apiCall('/facilities', {
      method: 'GET',
      headers: headers,
    });

    
    return result;
  } catch (error) {
    console.error('❌ getAllFacilities failed:', error);
    throw error;
  }
};

// Get all rooms API
export const getAllRooms = async (authToken = null) => {

  try {
    const headers = setAuthHeader({}, authToken);

    const result = await apiCall('/rooms', {
      method: 'GET',
      headers: headers
    });

    return result;
  } catch (error) {
    console.error('❌ getAllRooms failed:', error);

    // Try again with a different auth format if we got a 401
    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      

      try {
        const token = authToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken_backup');
        if (!token) throw new Error('No authentication token available');

        // Try with explicit Bearer prefix
        const headers = { 'Authorization': `Bearer ${token}` };

        const result = await apiCall('/rooms', {
          method: 'GET',
          headers: headers
        });

        return result;
      } catch (retryError) {
        console.error('❌ getAllRooms retry also failed:', retryError);
        throw retryError;
      }
    }

    throw error;
  }
};

// Get specific room by ID API
export const getRoomById = async (roomId, authToken = null) => {

  try {
    // Set headers with auth token
    const headers = setAuthHeader({}, authToken);

    const result = await apiCall(`/rooms/${roomId}`, {
      method: 'GET',
      headers: headers,
    });

    return result;
  } catch (error) {
    console.error(`❌ getRoomById failed for room ${roomId}:`, error);

    // Try again with a different auth format if we got a 401
    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      

      try {
        const token = authToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken_backup');
        if (!token) throw new Error('No authentication token available');

        // Try with explicit Bearer prefix
        const headers = { 'Authorization': `Bearer ${token}` };

        const result = await apiCall(`/rooms/${roomId}`, {
          method: 'GET',
          headers: headers
        });

        return result;
      } catch (retryError) {
        console.error(`❌ getRoomById retry also failed for room ${roomId}:`, retryError);
        throw retryError;
      }
    }

    throw error;
  }
};

// Create new room API
export const createRoom = async (roomData, authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);

  // Transform cots data to match backend format
  const cotsData = roomData.cots || roomData.customCots || [];

  if (!Array.isArray(cotsData)) {
    console.error('❌ Cots data is not an array:', cotsData);
    throw new Error('Invalid cots data format');
  }

  const transformedCots = cotsData.map((cot, index) => {
    if (!cot || typeof cot.number !== 'number') {
      throw new Error(`Invalid cot data at index ${index}`);
    }

    const cotData = {
      cot_number: cot.number,
      pos_x: typeof cot.x === 'number' ? cot.x : 0, // Column position
      pos_y: typeof cot.y === 'number' ? cot.y : 0  // Row position
    };
    return cotData;
  });


  // Fetch facilities dynamically from API to create name-to-ID mapping
  let facilityNameToId = {};
  try {
    const facilities = await getAllFacilities(authToken);

    if (Array.isArray(facilities)) {
      // Create mapping from facility_name to facility_id
      facilityNameToId = facilities.reduce((mapping, facility) => {
        if (facility.facility_name && facility.facility_id) {
          mapping[facility.facility_name] = facility.facility_id;
        }
        return mapping;
      }, {});

    } else {
      console.warn('⚠️ Facilities API returned non-array data:', facilities);
    }
  } catch (error) {
    console.error('❌ Failed to fetch facilities, using empty mapping:', error);
    // Continue with empty mapping - will warn about unknown facilities later
  }

  // Convert facility names to facility IDs
  let facilitiesArray = [];
  if (roomData.facilities) {
    if (Array.isArray(roomData.facilities)) {
      // Map facility names to IDs
      facilitiesArray = roomData.facilities
        .map(facilityName => {
          // If it's already an ID (UUID format), use it directly
          if (typeof facilityName === 'string' && facilityName.includes('-')) {
            return facilityName;
          }
          // Otherwise, map name to ID
          const facilityId = facilityNameToId[facilityName];
          if (!facilityId) {
            console.warn(`⚠️ Unknown facility name: ${facilityName}`);
            return null;
          }
          return facilityId;
        })
        .filter(Boolean); // Remove null values
    } else if (typeof roomData.facilities === 'object') {
      // If it's an object with facility IDs as keys or values
      facilitiesArray = Object.values(roomData.facilities)
        .map(facilityName => facilityNameToId[facilityName] || facilityName)
        .filter(Boolean);
    }
  }

  

  // Create JSON payload matching the EXACT required format
  const payload = {
    room_number: roomData.roomNumber,
    floor: roomData.floor,
    room_type: roomData.type,
    price_per_year: parseFloat(roomData.pricePerYear),
    gender_preference: roomData.genderPreference,
    room_dimensions: roomData.roomDimensions || `${roomData.dimensions?.width || 12}x${roomData.dimensions?.height || 8} ft`,
    description: roomData.description || '',
    layout_rows: parseInt(roomData.layoutRows) || 2,
    layout_cols: parseInt(roomData.layoutCols) || 2,
    total_cots: transformedCots.length, // Calculate from cots array
    cots: transformedCots,
    facilities: facilitiesArray  // Use processed facility IDs, not raw roomData.facilities
  };

  

  try {
    const response = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('❌ Failed to create room:', error);
    throw error;
  }
};

// Update existing room API
export const updateRoom = async (roomId, roomData, authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);

  // Transform cots data to match backend format
  const cotsData = roomData.cots || roomData.customCots || [];

  const transformedCots = cotsData.map((cot, index) => {
    const cotData = {
      cot_number: cot.number,
      pos_x: typeof cot.x === 'number' ? cot.x : 0,
      pos_y: typeof cot.y === 'number' ? cot.y : 0
    };
    return cotData;
  });


  // Fetch facilities dynamically from API to create name-to-ID mapping
  let facilityNameToId = {};
  try {
    const facilities = await getAllFacilities(authToken);

    if (Array.isArray(facilities)) {
      // Create mapping from facility_name to facility_id
      facilityNameToId = facilities.reduce((mapping, facility) => {
        if (facility.facility_name && facility.facility_id) {
          mapping[facility.facility_name] = facility.facility_id;
        }
        return mapping;
      }, {});

    } else {
      console.warn('⚠️ Facilities API returned non-array data:', facilities);
    }
  } catch (error) {
    console.error('❌ Failed to fetch facilities, using empty mapping:', error);
    // Continue with empty mapping - will warn about unknown facilities later
  }

  // Convert facility names to facility IDs
  let facilitiesArray = [];
  if (roomData.facilities) {
    if (Array.isArray(roomData.facilities)) {
      // Map facility names to IDs
      facilitiesArray = roomData.facilities
        .map(facilityName => {
          // If it's already an ID (UUID format), use it directly
          if (typeof facilityName === 'string' && facilityName.includes('-')) {
            return facilityName;
          }
          // Otherwise, map name to ID
          const facilityId = facilityNameToId[facilityName];
          if (!facilityId) {
            console.warn(`⚠️ Unknown facility name: ${facilityName}`);
            return null;
          }
          return facilityId;
        })
        .filter(Boolean); // Remove null values
    } else if (typeof roomData.facilities === 'object') {
      // If it's an object with facility IDs as keys or values
      facilitiesArray = Object.values(roomData.facilities)
        .map(facilityName => facilityNameToId[facilityName] || facilityName)
        .filter(Boolean);
    }
  }

  

  // Create JSON payload matching the EXACT required format
  const payload = {
    room_number: roomData.roomNumber,
    floor: roomData.floor,
    room_type: roomData.type,
    price_per_year: parseFloat(roomData.pricePerYear),
    gender_preference: roomData.genderPreference,
    room_dimensions: roomData.roomDimensions || `${roomData.dimensions?.width || 12}x${roomData.dimensions?.height || 8} ft`,
    description: roomData.description || '',
    layout_rows: parseInt(roomData.layoutRows) || 2,
    layout_cols: parseInt(roomData.layoutCols) || 2,
    total_cots: transformedCots.length, // Calculate from cots array
    cots: transformedCots,
    facilities: facilitiesArray  // Use processed facility IDs, not raw roomData.facilities
  };

  

  try {
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('❌ Failed to update room:', error);
    throw error;
  }
};

// Delete room API
export const deleteRoom = async (roomId, authToken = null) => {
  const headers = setAuthHeader({}, authToken);

  try {
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: headers,
    });

    // Check for successful deletion (HTTP 204 No Content)
    if (response.status === 204) {
      return { success: true, message: 'Room deleted successfully' };
    }

    // Handle other success codes if any
    if (response.ok) {
      return { success: true, message: 'Room deleted successfully' };
    }

    // Handle error responses
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  } catch (error) {
    console.error('❌ Failed to delete room:', error);
    throw error;
  }
};

// Send OTP for registration
export const sendOtp = async (email_address,cause) => {
  
  try {
    const result = await apiCall('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address, cause }),
    });
    return result;
  } catch (error) {
    console.error(' Failed to send OTP:', error);
    throw error;
  }
};

// Register new student API
export const registerStudent = async (studentData, authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);

  // Create JSON payload for student registration - matching backend format
  const payload = {
    full_name: studentData.full_name,
    email_address: studentData.email_address,
    mobile_number: studentData.mobile_number,
    Registration_number: studentData.Registration_number,
    Branch: studentData.Branch,
    Year: studentData.Year, // Keep as string since backend expects string
    gender: studentData.gender,
    password: studentData.password,
    otp: studentData.otp // OTP for verification
  };

 

  try {
    const result = await apiCall('/students/register', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    return result;
  } catch (error) {
    console.error('❌ Student registration failed:', error);
    throw error;
  }
};

// Register new admin API
export const registerAdmin = async (adminData, authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);

  // Create JSON payload for admin registration - matching backend format
  const payload = {
    email_address: adminData.email_address,
    full_name: adminData.full_name,
    password: adminData.password,
    role: adminData.role || 'warden'
  };

 

  try {
    const result = await apiCall('/api/admins', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    return result;
  } catch (error) {
    console.error('❌ Admin registration failed:', error);
    throw error;
  }
};

// Delete student API (admin function)
export const deleteStudent = async (studentId, authToken = null) => {
  const headers = setAuthHeader({}, authToken);

  try {
    // Use admin endpoint for deleting students
    const result = await apiCall(`/students/${studentId}`, {
      method: 'DELETE',
      headers: headers,
    });

return result;
} catch (error) {
console.error('❌ Student deletion failed:', error);
throw error;
}
};

// Get bookings for the current student
export const getStudentBookings = async (authToken = null) => {
try {
const result = await apiCall('/bookings/me', {
method: 'GET',
headers: setAuthHeader({}, authToken),
});
return result;
} catch (error) {
console.error('❌ Failed to fetch student bookings:', error);
throw error;
}
};

// Get student dashboard statistics
export const getStudentDashboard = async (authToken = null) => {
try {
const result = await apiCall('/students/dashboard/me', {
method: 'GET',
headers: setAuthHeader({}, authToken),
});
return result;
} catch (error) {
console.error('❌ Failed to fetch student dashboard data:', error);
throw error;
}
};

// Update student API (admin function)
export const updateStudent = async (studentId, studentData, authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json',
  }, authToken);

  // Transform payload to match backend format
  const payload = {
    full_name: studentData.full_name,
    email_address: studentData.email_address,
    mobile_number: studentData.mobile_number,
    Registration_number: studentData.Registration_number,
    Branch: studentData.Branch,
    Year: studentData.Year,
    concession_amount: parseFloat(studentData.custom_price) || 0
  };

  try {
    // Use admin endpoint for updating students
    const result = await apiCall(`/students/${studentId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(payload),
    });

    return result;
  } catch (error) {
    console.error('❌ Student update failed:', error);
    throw error;
  }
};

// Get all students API (admin function)
export const getAllStudents = async (authToken = null) => {
  const headers = setAuthHeader({}, authToken);

  try {
    // Use admin endpoint for fetching all students
    const result = await apiCall('/students/', {
      method: 'GET',
      headers: headers,
    });

    return result;
  } catch (error) {
    console.error('❌ Failed to fetch all students:', error);
    throw error;
  }
};

// Get current user profile API
export const getCurrentUserProfile = async (authToken = null) => {
  const headers = setAuthHeader({}, authToken);

  try {
    const result = await apiCall('/users/me', {
      method: 'GET',
      headers: headers,
    });

    return result;
  } catch (error) {
    console.error('❌ getCurrentUserProfile failed:', error);

    // Log more specific error information
    if (error.message.includes('401')) {
      console.error(' Authentication failed - token may be invalid or expired');
    } else if (error.message.includes('403')) {
      console.error(' Access forbidden - user may not have permission to view profile');
    } else if (error.message.includes('500')) {
      console.error(' Internal server error - backend issue');
    }

    throw error;
  }
};

// Create a new booking for a student
export const createStudentBooking = async (bookingData, authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json',
  }, authToken);

  // Backend expects the full booking details
  const payload = {
    cot_id: bookingData.cot_id,
    academic_year: bookingData.academic_year,
    check_in_date: bookingData.check_in_date,
    emergency_contact_name: bookingData.emergency_contact_name,
    emergency_contact_mobile: bookingData.emergency_contact_mobile,
    payment_amount: bookingData.payment_amount,
    payment_method: bookingData.payment_method,
    payment_type: bookingData.payment_type,
  };

  return apiCall('/bookings/me', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });
};



// Create a booking for a student (admin function)
export const createBookingForStudent = async (bookingData, authToken = null) => {
 

  // Set authorization headers with access token
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);

  // Create payload matching the exact format required by /admin/bookings POST endpoint
  const payload = {
    student_id: parseInt(bookingData.student_id),
    cot_id: bookingData.cot_id,
    academic_year: bookingData.academic_year || "2025-2026",
    check_in_date: bookingData.check_in_date || new Date().toISOString().split('T')[0],
    emergency_contact_name: bookingData.emergency_contact_name || "Guardian",
    emergency_contact_mobile: bookingData.emergency_contact_mobile || "",
    payment_amount: parseFloat(bookingData.payment_amount || 5000.00),
    payment_method: bookingData.payment_method || "Online Payment",
    payment_type: bookingData.payment_type || "Advance",
    notes: bookingData.notes || "Booking created by admin."
  };

 

  return apiCall('/admin/bookings', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });
};


// Get all bookings (admin function)
export const getAllBookings = async (authToken = null) => {
  
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);


  return apiCall('/admin/bookings', {
    method: 'GET',
    headers: headers,
  });
};

// Get all payments (for admin)
export const getAllPayments = async (authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);


  return apiCall('/admin/payments', {
    method: 'GET',
    headers: headers,
  });
};

// Get payments for a specific student
export const getStudentPayments = async (authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);


  return apiCall('/payments/me', {
    method: 'GET',
    headers: headers,
  });
};

// Create a new payment record
export const createPayment = async (paymentData, authToken = null) => {
  const headers = setAuthHeader({
    'Content-Type': 'application/json'
  }, authToken);
  return apiCall('/admin/payments', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(paymentData),
  });
};

// Send OTP for password reset
export const sendOTP = async (email,cause) => {
  const response = await fetch(`${API_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email,cause }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to send OTP');
  }
  
  return response.json();
};

// Reset password with OTP
export const resetPassword = async (email, otp, newPassword) => {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      otp: otp,
      new_password: newPassword,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to reset password');
  }
  
  return response.json();
};
