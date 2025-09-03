// apiService.js
// This file contains a collection of simple JavaScript functions for making API calls.
// It should not contain any React-specific code like hooks (e.g., useState, useEffect, useCallback).

// const API_URL = 'http://192.168.29.24:8000';
export const API_URL = 'https://ssehostelbackend-production.up.railway.app';
// export const API_URL = 'https://derek-invited-cook-mills.trycloudflare.com';

/* ------------------------------- Helpers ---------------------------------- */

// Helper: FormData from plain object
const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data || {}).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  return formData;
};

// Safe token logging helper to prevent substring errors
const safeTokenLog = (token) => {
  if (!token) return 'null';
  if (typeof token !== 'string') return 'non-string';
  return `${token.substring(0, 10)}...`;
};

// Helper: set authorization headers (keeps your multi-header approach)
const setAuthHeader = (headers = {}, token = null) => {
  if (!token) {
    token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken_backup');
    if (!token) {
      console.warn('⚠️ No authentication token found in memory or storage');
      return headers;
    } else {
      console.log('🔑 Using token from storage:', safeTokenLog(token));
    }
  }

  headers['Authorization'] = `Bearer ${token}`;
  headers['x-auth-token'] = token;
  headers['x-access-token'] = token;
  headers['auth-token'] = token;
  headers['token'] = token;

  console.log('🔐 Auth headers set with multiple formats');
  return headers;
};

// Normalize endpoints that need trailing slashes (only students for now)
const normalizeEndpoint = (endpoint) => {
  // Add more if you ever expose others with trailing slash-only
  if (endpoint === '/students') return '/students/';
  return endpoint;
};

// Core fetch wrapper
const apiCall = async (endpoint, options = {}) => {
  const normalized = normalizeEndpoint(endpoint);

  try {
    console.log(`🌐 Making API call to: ${API_URL}${normalized}`);
    console.log('📤 Request Method:', options.method || 'GET');
    console.log('📤 Request Headers:', options.headers);

    if (options.body) {
      console.log('📤 Request Body Type:', typeof options.body);
      if (typeof options.body === 'string') {
        try {
          const parsedBody = JSON.parse(options.body);
          console.log('📤 Request Body (Parsed JSON):', parsedBody);
        } catch {
          console.log('📤 Request Body (Raw):', options.body);
        }
      } else {
        console.log('📤 Request Body:', options.body);
      }
    }

    const response = await fetch(`${API_URL}${normalized}`, {
      headers: {
        // Do not force Content-Type for FormData; browser sets boundary automatically
        ...options.headers,
      },
      ...options,
    });

    console.log(`📥 API Response status: ${response.status} ${response.statusText}`);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Special debug for students endpoint
      if ((endpoint === '/students' || endpoint === '/students/') && (response.status === 401 || response.status === 403)) {
        console.error(`❌ Authentication error (${response.status}) when fetching students`);
        const userRole = localStorage.getItem('userRole');
        const hasToken = !!localStorage.getItem('authToken');
        const hasSessionToken = !!sessionStorage.getItem('authToken_backup');
        console.error('🔑 Auth state debug:', {
          userRole,
          hasToken,
          hasSessionToken,
          requestURL: `${API_URL}${normalized}`,
          statusCode: response.status,
        });
      }

      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Parsed Error JSON:', errorJson);
      } catch { }
      const err = new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      err.status = response.status;
      throw err;
    }

    if (response.status === 204 || response.status === 205) {
      console.log('✅ API Success Response: HTTP No Content');
      return { success: true, status: response.status, message: 'Operation completed successfully' };
    }

    const text = await response.text();
    const result = text ? JSON.parse(text) : null;
    console.log('✅ API Success Response:', result);
    return result;
  } catch (error) {
    console.error('💥 API call failed:', error);

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      if (endpoint.includes('/login')) {
        throw new Error('Invalid Credentials. Please check your email and password.');
      } else {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }

    throw error;
  }
};

/* --------------------------------- Auth ----------------------------------- */

export const studentLogin = async (username, password) => {
  const formData = createFormData({ username, password });
  try {
    return await apiCall('/student/login', { method: 'POST', body: formData });
  } catch (error) {
    console.error('❌ Student login failed:', error);
    if (
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('404') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'TypeError'
    ) {
      throw new Error('Invalid Credentials. Please check your email and password.');
    }
    throw error;
  }
};

export const adminLogin = async (username, password) => {
  console.log('🔐 Admin login attempt:', { username });
  const formData = createFormData({ username, password });
  try {
    const result = await apiCall('/admin/login', { method: 'POST', body: formData });
    console.log('✅ Admin login successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Admin login failed:', error);
    if (
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('404') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'TypeError'
    ) {
      throw new Error('Invalid Credentials. Please check your email and password.');
    }
    throw error;
  }
};

export const login = async (email, password, role = 'student') => {
  try {
    return role === 'admin' ? await adminLogin(email, password) : await studentLogin(email, password);
  } catch (error) {
    console.error('❌ Login failed:', error);
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.name === 'TypeError'
    ) {
      throw new Error('Invalid Credentials. Please check your email and password.');
    }
    throw error;
  }
};

export const getCurrentUserProfile = async (authToken = null) => {
  console.log('👤 getCurrentUserProfile called with token:', safeTokenLog(authToken));
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  console.log('📤 getCurrentUserProfile headers:', headers);
  return apiCall('/users/me', { method: 'GET', headers });
};

/* ------------------------------ Facilities -------------------------------- */

export const getAllFacilities = async (authToken = null) => {
  console.log('🏢 getAllFacilities called with token:', safeTokenLog(authToken));
  try {
    const headers = setAuthHeader({}, authToken);
    console.log('🔐 getAllFacilities using auth headers:', headers);
    const result = await apiCall('/facilities', { method: 'GET', headers });
    console.log(`✅ getAllFacilities success, received ${Array.isArray(result) ? result.length : 'non-array'} items`);
    return result;
  } catch (error) {
    console.error('❌ getAllFacilities failed:', error);
    throw error;
  }
};

/* --------------------------------- Rooms ---------------------------------- */

export const getAllRooms = async (authToken = null) => {
  console.log('🏠 getAllRooms called with token:', safeTokenLog(authToken));
  try {
    const headers = setAuthHeader({}, authToken);
    console.log('🔐 getAllRooms using auth headers:', headers);
    const result = await apiCall('/rooms', { method: 'GET', headers });
    console.log(`✅ getAllRooms success, received ${Array.isArray(result) ? result.length : 'non-array'} items`);
    return result;
  } catch (error) {
    console.error('❌ getAllRooms failed:', error);
    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      console.log('🔄 Trying getAllRooms with explicit Bearer auth header');
      try {
        const token = authToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken_backup');
        if (!token) throw new Error('No authentication token available');
        const headers = { Authorization: `Bearer ${token}` };
        const result = await apiCall('/rooms', { method: 'GET', headers });
        console.log(`✅ getAllRooms retry success, received ${Array.isArray(result) ? result.length : 'non-array'} items`);
        return result;
      } catch (retryError) {
        console.error('❌ getAllRooms retry also failed:', retryError);
        throw retryError;
      }
    }
    throw error;
  }
};

export const getRoomById = async (roomId, authToken = null) => {
  console.log(`🏠 getRoomById called for room ${roomId} with token:`, safeTokenLog(authToken));
  try {
    const headers = setAuthHeader({}, authToken);
    console.log('🔐 getRoomById using auth headers:', headers);
    const result = await apiCall(`/rooms/${roomId}`, { method: 'GET', headers });
    console.log('✅ getRoomById success response:', result);
    return result;
  } catch (error) {
    console.error(`❌ getRoomById failed for room ${roomId}:`, error);
    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      console.log('🔄 Trying getRoomById with explicit Bearer header');
      try {
        const token = authToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken_backup');
        if (!token) throw new Error('No authentication token available');
        const headers = { Authorization: `Bearer ${token}` };
        const result = await apiCall(`/rooms/${roomId}`, { method: 'GET', headers });
        console.log('✅ getRoomById retry success response:', result);
        return result;
      } catch (retryError) {
        console.error(`❌ getRoomById retry also failed for room ${roomId}:`, retryError);
        throw retryError;
      }
    }
    throw error;
  }
};

export const createRoom = async (roomData, authToken = null) => {
  console.log('🔍 RAW roomData received by createRoom:', roomData);
  console.log('🔍 roomData keys:', Object.keys(roomData || {}));
  Object.entries(roomData || {}).forEach(([k, v]) => console.log(`    ${k}:`, v, `(type: ${typeof v})`));

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  // Transform cots (validate)
  const cotsData = roomData.cots || roomData.customCots || [];
  console.log('🛏️ Cots data before transformation:', cotsData);
  if (!Array.isArray(cotsData)) throw new Error('Invalid cots data format');

  const transformedCots = cotsData.map((cot, index) => {
    if (!cot || typeof cot.number !== 'number') {
      console.error(`❌ Invalid cot at index ${index}:`, cot);
      throw new Error(`Invalid cot data at index ${index}`);
    }
    return {
      cot_number: cot.number,
      pos_x: typeof cot.x === 'number' ? cot.x : 0,
      pos_y: typeof cot.y === 'number' ? cot.y : 0,
    };
  });

  // Facilities mapping
  let facilityNameToId = {};
  try {
    console.log('🏢 Fetching facilities from API...');
    const facilities = await getAllFacilities(authToken);
    if (Array.isArray(facilities)) {
      facilityNameToId = facilities.reduce((m, f) => {
        if (f.facility_name && f.facility_id) m[f.facility_name] = f.facility_id;
        return m;
      }, {});
      console.log('🏢 Dynamic facility mapping created:', facilityNameToId);
    }
  } catch (e) {
    console.error('❌ Failed to fetch facilities, using empty mapping:', e);
  }

  let facilitiesArray = [];
  if (roomData.facilities) {
    if (Array.isArray(roomData.facilities)) {
      facilitiesArray = roomData.facilities
        .map((name) => (typeof name === 'string' && name.includes('-') ? name : facilityNameToId[name] || null))
        .filter(Boolean);
    } else if (typeof roomData.facilities === 'object') {
      facilitiesArray = Object.values(roomData.facilities)
        .map((name) => facilityNameToId[name] || name)
        .filter(Boolean);
    }
  }

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
    total_cots: transformedCots.length,
    cots: transformedCots,
    facilities: facilitiesArray,
  };

  console.log('📋 Final Payload for POST /rooms:', payload);
  const res = await fetch(`${API_URL}/rooms`, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  const result = await res.json();
  console.log('✅ Room created successfully:', result);
  return result;
};

export const updateRoom = async (roomId, roomData, authToken = null) => {
  console.log('🔍 RAW roomData received by updateRoom:', roomData);
  console.log('🔍 Room ID:', roomId);
  Object.entries(roomData || {}).forEach(([k, v]) => console.log(`    ${k}:`, v, `(type: ${typeof v})`));

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const cotsData = roomData.cots || roomData.customCots || [];
  console.log('🛏️ Cots data before transformation:', cotsData);
  const transformedCots = cotsData.map((cot, index) => ({
    cot_number: cot.number,
    pos_x: typeof cot.x === 'number' ? cot.x : 0,
    pos_y: typeof cot.y === 'number' ? cot.y : 0,
  }));
  console.log('🛏️ Transformed cots with coordinates:', transformedCots);

  let facilityNameToId = {};
  try {
    console.log('🏢 Fetching facilities from API...');
    const facilities = await getAllFacilities(authToken);
    if (Array.isArray(facilities)) {
      facilityNameToId = facilities.reduce((m, f) => {
        if (f.facility_name && f.facility_id) m[f.facility_name] = f.facility_id;
        return m;
      }, {});
      console.log('🏢 Dynamic facility mapping created:', facilityNameToId);
    }
  } catch (e) {
    console.error('❌ Failed to fetch facilities, using empty mapping:', e);
  }

  let facilitiesArray = [];
  if (roomData.facilities) {
    if (Array.isArray(roomData.facilities)) {
      facilitiesArray = roomData.facilities
        .map((name) => (typeof name === 'string' && name.includes('-') ? name : facilityNameToId[name] || null))
        .filter(Boolean);
    } else if (typeof roomData.facilities === 'object') {
      facilitiesArray = Object.values(roomData.facilities)
        .map((name) => facilityNameToId[name] || name)
        .filter(Boolean);
    }
  }

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
    total_cots: transformedCots.length,
    cots: transformedCots,
    facilities: facilitiesArray,
  };

  console.log('📋 Final Payload for PUT /rooms/' + roomId + ':', payload);
  const res = await fetch(`${API_URL}/rooms/${roomId}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  const result = await res.json();
  console.log('✅ Room updated successfully:', result);
  return result;
};

export const deleteRoom = async (roomId, authToken = null) => {
  console.log('🗑️ deleteRoom called for room ID:', roomId);
  console.log('🔑 Using auth token:', safeTokenLog(authToken));
  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  console.log('🚀 Sending DELETE to:', `${API_URL}/rooms/${roomId}`);

  const response = await fetch(`${API_URL}/rooms/${roomId}`, { method: 'DELETE', headers });
  if (response.status === 204) {
    console.log('✅ Room deleted successfully (HTTP 204)');
    return { success: true, message: 'Room deleted successfully' };
  }
  if (response.ok) {
    console.log(`✅ Room deleted successfully (HTTP ${response.status})`);
    return { success: true, message: 'Room deleted successfully' };
  }
  const errorText = await response.text();
  throw new Error(`HTTP ${response.status}: ${errorText}`);
};

/* ------------------------------- Students --------------------------------- */

export const registerStudent = async (studentData, authToken = null) => {
  console.log('👤 registerStudent called with data:', studentData);
  console.log('🔑 Using auth token:', safeTokenLog(authToken));

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const payload = {
    full_name: studentData.full_name,
    email_address: studentData.email_address,
    mobile_number: studentData.mobile_number,
    Registration_number: studentData.Registration_number,
    Branch: studentData.Branch,
    Year: studentData.Year,
    gender: studentData.gender,
    password: studentData.password,
  };

  console.log('📋 Student Registration Payload:', payload);
  return apiCall('/students/register', { method: 'POST', headers, body: JSON.stringify(payload) });
};

// *** The critical change: call /students/ (with trailing slash) ***
export const getAllStudents = async (authToken = null) => {
  console.log('👥 getAllStudents called with token:', authToken ? `${authToken.substring(0, 10)}...` : 'null');
  console.log('👥 API_URL for students:', `${API_URL}/students/`); // trailing slash

  try {
    const adminData = localStorage.getItem('adminData');
    const userRole = localStorage.getItem('userRole');
    console.log('📊 Admin debug info:', { hasAdminData: !!adminData, storedRole: userRole, isAdmin: userRole === 'admin' });

    const headers = setAuthHeader({}, authToken);
    console.log('🔐 getAllStudents using auth headers:', headers);

    const result = await apiCall('/students/', { method: 'GET', headers }); // trailing slash here
    console.log(`✅ getAllStudents success, received ${Array.isArray(result) ? result.length : 'non-array'} items`);
    return result;
  } catch (error) {
    console.error('❌ getAllStudents failed:', error);

    if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      console.log('🔄 Trying getAllStudents with explicit Bearer header (trailing slash)');
      try {
        const token = authToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken_backup');
        if (!token) throw new Error('No authentication token available');
        const headers = { Authorization: `Bearer ${token}` };
        const result = await apiCall('/students/', { method: 'GET', headers }); // still trailing slash
        console.log(`✅ getAllStudents retry success, received ${Array.isArray(result) ? result.length : 'non-array'} items`);
        return result;
      } catch (retryError) {
        console.error('❌ getAllStudents retry also failed:', retryError);
        throw retryError;
      }
    }

    if (error.message.includes('401')) console.error('🔓 Authentication failed - token may be invalid or expired');
    else if (error.message.includes('403')) console.error('🚫 Access forbidden - user may not have permission to view students');
    else if (error.message.includes('500')) console.error('🔥 Internal server error - backend issue');

    throw error;
  }
};

export const deleteStudent = async (studentId, authToken = null) => {
  console.log('🗑️ deleteStudent called for ID:', studentId);
  console.log('🔑 Using auth token:', safeTokenLog(authToken));
  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  try {
    const result = await apiCall(`/students/${studentId}`, { method: 'DELETE', headers });
    console.log('✅ Student deletion successful:', result);
    return result;
  } catch (error) {
    console.error('❌ Student deletion failed:', error);
    throw error;
  }
};

export const updateStudent = async (studentId, studentData, authToken = null) => {
  console.log('✏️ updateStudent called for ID:', studentId);
  console.log('📝 Student data:', studentData);
  console.log('🔑 Using auth token:', safeTokenLog(authToken));

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  console.log('📤 updateStudent headers:', headers);
  const result = await apiCall(`/students/${studentId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(studentData),
  });
  console.log('✅ Student update successful:', result);
  return result;
};

/* ------------------------------- Bookings --------------------------------- */

export const createStudentBooking = async (bookingData, authToken = null) => {
  console.log('📦 createStudentBooking called with data:', bookingData);
  console.log('🔑 Using auth token:', safeTokenLog(authToken));

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

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

  console.log('📋 Booking Payload:', payload);
  console.log('🚀 Sending to API: /bookings/me');
  return apiCall('/bookings/me', { method: 'POST', headers, body: JSON.stringify(payload) });
};

export const getStudentBookings = async (authToken = null) => {
  try {
    const result = await apiCall('/bookings/me', { method: 'GET', headers: setAuthHeader({}, authToken) });
    console.log('✅ Student bookings fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch student bookings:', error);
    throw error;
  }
};

export const getStudentDashboard = async (authToken = null) => {
  try {
    console.log('🔄 Fetching student dashboard data...');
    const result = await apiCall('/students/dashboard/me', { method: 'GET', headers: setAuthHeader({}, authToken) });
    console.log('✅ Student dashboard data fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to fetch student dashboard data:', error);
    throw error;
  }
};

export const createBookingForStudent = async (bookingData, authToken = null) => {
  console.log('📦 createBookingForStudent called with data:', bookingData);
  console.log('🔑 Using auth token:', safeTokenLog(authToken));

  const headers = setAuthHeader({ 'Content-Type': 'application/json' }, authToken);

  const payload = {
    student_id: parseInt(bookingData.student_id),
    cot_id: bookingData.cot_id,
    academic_year: bookingData.academic_year || '2025-2026',
    check_in_date: bookingData.check_in_date || new Date().toISOString().split('T')[0],
    emergency_contact_name: bookingData.emergency_contact_name || 'Guardian',
    emergency_contact_mobile: bookingData.emergency_contact_mobile || '',
    payment_amount: parseFloat(bookingData.payment_amount || 5000.0),
    payment_method: bookingData.payment_method || 'Online Payment',
    payment_type: bookingData.payment_type || 'Advance',
    notes: bookingData.notes || 'Booking created by admin.',
  };

  console.log('📋 Admin Booking Payload:', payload);
  console.log('🚀 Sending to API: /admin/bookings');
  return apiCall('/admin/bookings', { method: 'POST', headers, body: JSON.stringify(payload) });
};

export const getAllBookings = async (authToken = null) => {
  console.log('📦 getAllBookings called');
  console.log('🔑 Using auth token:', safeTokenLog(authToken));
  const headers = setAuthHeader({ 'Content-Type': 'application/json' }, authToken);
  console.log('🚀 Sending to API: /admin/bookings');
  return apiCall('/admin/bookings', { method: 'GET', headers });
};

/* -------------------------------- Payments -------------------------------- */

export const getAllPayments = async (authToken = null) => {
  const headers = setAuthHeader({ 'Content-Type': 'application/json' }, authToken);
  console.log('🚀 Sending to API: /admin/payments');
  return apiCall('/admin/payments', { method: 'GET', headers });
};

export const getStudentPayments = async (authToken = null) => {
  const headers = setAuthHeader({ 'Content-Type': 'application/json' }, authToken);
  console.log('🚀 Sending to API: /payments/me');
  return apiCall('/payments/me', { method: 'GET', headers });
};

export const createPayment = async (paymentData, authToken = null) => {
  const headers = setAuthHeader({ 'Content-Type': 'application/json' }, authToken);
  return apiCall('/admin/payments', { method: 'POST', headers, body: JSON.stringify(paymentData) });
};

/* ------------------------------ PayU Helpers ------------------------------ */

export const initiatePayUPayment = async (paymentData, authToken = null, showToast = null) => {
  console.log('💳 initiatePayUPayment called with data:', paymentData);
  console.log('🔑 Using auth token:', safeTokenLog(authToken));

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  
  // Show toast if showToast function is provided
  if (typeof showToast === 'function') {
    showToast('Redirecting to PayU gateway...', 'info');
    // Add a small delay to ensure the toast is shown before the page redirects
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Get the base URL for callbacks
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/payment/success`;
  const failureUrl = `${baseUrl}/payment/failure`;

  console.log('🔗 Success URL:', successUrl);
  console.log('🔗 Failure URL:', failureUrl);

  let payload;
  if (typeof paymentData === 'object' && paymentData.booking_id) {
    payload = {
      booking_id: paymentData.booking_id,
      student_id: paymentData.student_id,
      amount: parseFloat(paymentData.amount),
      room_id: paymentData.room_id,
      cot_id: paymentData.cot_id,
      product_info: 'Hostel Room Booking - Sanskrithi School of Engineering',
      // Add callback URLs to the payload
      success_url: successUrl,
      failure_url: failureUrl,
    };
  } else {
    payload = {
      booking_id: paymentData,
      amount: parseFloat(authToken), // legacy signature safety
      product_info: 'Hostel Room Booking - Sanskrithi School of Engineering',
      // Add callback URLs to the payload
      success_url: successUrl,
      failure_url: failureUrl,
    };
  }

  console.log('📋 PayU payment payload:', payload);
  console.log('🌐 Sending request to:', `${API_URL}/api/payments/initiate`);
  console.log('🔑 Request headers:', headers);
  
  try {
    const response = await fetch(`${API_URL}/api/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // Expect JSON response
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify(payload)
    });

    console.log('🔄 Received response status:', response.status, response.statusText);

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ Error response from server:', responseData);
      throw new Error(responseData.detail || 'Payment initiation failed.');
    }

    console.log('✅ Received PayU data:', responseData);

    const { action, params } = responseData;
    if (!action || !params) {
      throw new Error('Invalid payment initiation response from server.');
    }

    // Create a form dynamically
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.style.display = 'none'; // Hide the form

    // Add parameters as hidden input fields
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      }
    }

    // Append the form to the body and submit
    document.body.appendChild(form);
    console.log('🚀 Submitting dynamically created form to PayU...');
    form.submit();

    return { status: 'redirecting' };
  } catch (error) {
    console.error('❌ Error initiating PayU payment:', error);
    throw error;
  }
};

export const getPayUTransactionDetails = async (txnid, authToken = null) => {
  console.log('📄 Fetching PayU transaction details:', txnid);
  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const result = await apiCall(`/api/payments/transaction/${txnid}`, { method: 'GET', headers });
  console.log('✅ Transaction details fetched:', result);
  return result;
};

export const getStudentPayUTransactions = async (authToken = null) => {
  console.log('📋 Fetching student PayU transactions');
  const headers = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const result = await apiCall('/payments/student/transactions', { method: 'GET', headers });
  console.log('✅ Student PayU transactions fetched:', result);
  return result;
};

// Handle PayU success callback
export const handlePayUSuccess = async (txnid, authToken = null) => {
  console.log('🔄 Handling PayU success callback for txnid:', txnid);
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  
  try {
    const result = await apiCall(`/api/payments/transaction/${txnid}`, { 
      method: 'GET', 
      headers 
    });
    console.log('✅ PayU transaction details:', result);
    return result;
  } catch (error) {
    console.error('❌ Error fetching PayU transaction:', error);
    throw error;
  }
};

// Handle PayU failure callback
export const handlePayUFailure = async (txnid, authToken = null) => {
  console.log('❌ Handling PayU failure callback for txnid:', txnid);
  return { status: 'failed', txnid };
};

export const redirectToPayU = (paymentData) => {
  console.log(' Redirecting to PayU gateway:', paymentData);
  try {
    sessionStorage.setItem('paymentInProgress', 'true');
    sessionStorage.setItem('paymentTxnId', paymentData.txnid || '');

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.action_url;

    const payuParams = [
      'key',
      'txnid',
      'amount',
      'productinfo',
      'firstname',
      'email',
      'phone',
      'hash',
      'surl',
      'furl',
      'curl',
      'udf1',
      'udf2',
      'udf3',
      'udf4',
      'udf5',
    ];

    payuParams.forEach((param) => {
      if (paymentData[param] !== undefined) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = param;
        input.value = paymentData[param];
        form.appendChild(input);

        if (param === 'surl') console.log('🔗 SUCCESS URL (surl):', paymentData[param]);
        if (param === 'furl') console.log('🔗 FAILURE URL (furl):', paymentData[param]);
      }
    });

    document.body.appendChild(form);
    form.submit();
    console.log('✅ Form submitted to PayU gateway');
  } catch (error) {
    console.error('❌ Error redirecting to PayU:', error);
    throw error;
  }
};

/* --------------------------- Named + Default API -------------------------- */

export const api = {
  // auth
  login,
  studentLogin,
  adminLogin,
  getCurrentUserProfile,

  // facilities
  getAllFacilities,

  // rooms
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,

  // students
  registerStudent,
  getAllStudents,
  deleteStudent,
  updateStudent,

  // bookings
  createStudentBooking,
  getStudentBookings,
  getStudentDashboard,
  createBookingForStudent,
  getAllBookings,

  // payments
  getAllPayments,
  getStudentPayments,
  createPayment,

  // PayU
  initiatePayUPayment,
  getPayUTransactionDetails,
  getStudentPayUTransactions,
  redirectToPayU,
};

export default api;
