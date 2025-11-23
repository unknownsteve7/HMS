import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';

import {
  login as apiLogin,
  getAllRooms,
  createRoom as apiCreateRoom,
  registerStudent as apiRegisterStudent,
  getAllStudents,
  deleteStudent as apiDeleteStudent,
  updateStudent as apiUpdateStudent,
  getCurrentUserProfile,
  createStudentBooking,
  getStudentBookings,
  getAllBookings,
  getAllPayments,
  createPayment,
  getStudentPayments,
  getAllFacilities,
} from '../apiService';

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [facilities, setFacilities] = useState([]);

  // ---------- Facilities Management ----------
  const fetchFacilities = useCallback(async () => {
    if (facilities.length > 0) return facilities; // Return cached facilities

    setLoading(prev => ({ ...prev, facilities: true }));
    try {
      const data = await getAllFacilities(authToken);
      setFacilities(Array.isArray(data) ? data : []);
      return data || [];
    } catch (error) {
      console.error('Error fetching facilities:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, facilities: false }));
    }
  }, [authToken, facilities.length]);

  // Predefined facilities as fallback
  const defaultFacilities = [
    { facility_id: 'ac', facility_name: 'AC', icon: '❄️' },
    { facility_id: 'fan', facility_name: 'Fan', icon: '💨' },
    { facility_id: 'wifi', facility_name: 'WiFi', icon: '📶' },
    { facility_id: 'bathroom', facility_name: 'Attached Bathroom', icon: '🚿' },
    { facility_id: 'desk', facility_name: 'Study Desk', icon: '📚' },
  ];

  // Get facilities, using cached or default if not available
  const getFacilities = useCallback(async () => {
    if (facilities.length > 0) return facilities;

    const fetchedFacilities = await fetchFacilities();
    if (fetchedFacilities.length > 0) return fetchedFacilities;

    // If API call fails, use default facilities
    return defaultFacilities;
  }, [facilities, fetchFacilities]);

  // ---------- Auth restore on mount ----------
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
  }, []);

  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');
        const user = localStorage.getItem('currentUser');
        const expirationTime = localStorage.getItem('expirationTime');

        if (token && role && user && expirationTime) {
          const now = new Date().getTime();
          if (now < parseInt(expirationTime)) {
            setAuthToken(token);
            setUserRole(role);
            setCurrentUser(JSON.parse(user));
            setIsAuthenticated(true);
          } else {
            // Token expired
            logout();
          }
        }
      } catch (e) {
        console.error('Error in auth restoration', e);
        logout();
      } finally {
        setIsInitializing(false);
      }
    };
    restoreAuthState();
  }, [logout]);

  // ---------- Data fetchers (memoized) ----------
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, rooms: true }));
      const token = authToken || localStorage.getItem('authToken');
      const roomsData = await getAllRooms(token);
      const processedRooms = Array.isArray(roomsData)
        ? roomsData
        : (roomsData && (roomsData.rooms || roomsData.data)) || [];
      setRooms(processedRooms);
      return processedRooms;
    } catch (error) {
      if (error?.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        logout();
      }
      setRooms([]);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  }, [authToken, logout]);

  // In-flight guard to prevent duplicate/looped calls
  const studentsLoadingRef = useRef(false);

  const fetchStudents = useCallback(async () => {
    if (studentsLoadingRef.current) return;
    studentsLoadingRef.current = true;
    try {
      setLoading(prev => ({ ...prev, students: true }));
      const token = authToken || localStorage.getItem('authToken');
      const studentsData = await getAllStudents(token);
      const processedStudents = Array.isArray(studentsData)
        ? studentsData
        : (studentsData && (studentsData.students || studentsData.data)) || [];

      setStudents(prev => {
        // shallow identity guard to avoid unnecessary re-renders
        if (prev.length === processedStudents.length && prev.every((p, i) => p === processedStudents[i])) {
          return prev;
        }
        return processedStudents;
      });

      return processedStudents;
    } catch (error) {
      if (error?.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        logout();
      }
      setStudents([]);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
      studentsLoadingRef.current = false;
    }
  }, [authToken, logout]);

  const fetchBookings = useCallback(async () => {
    try {
      const role = userRole || localStorage.getItem('userRole');
      // Safeguard: Do not fetch if the role is not determined yet.
      if (!role) {
        console.warn("Skipping fetchBookings: user role not available yet.");
        return;
      }

      setLoading(prev => ({ ...prev, bookings: true }));
      const token = authToken || localStorage.getItem('authToken');
      let bookingsData;
      if (role === 'admin') {
        bookingsData = await getAllBookings(token);
      } else {
        bookingsData = await getStudentBookings(token);
      }
      const processedBookings = Array.isArray(bookingsData)
        ? bookingsData
        : bookingsData?.bookings || [];
      setBookings(processedBookings);
      return processedBookings;
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setBookings([]);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, bookings: false }));
    }
  }, [authToken, userRole]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, payments: true }));
      const token = authToken || localStorage.getItem('authToken');
      const role = userRole || localStorage.getItem('userRole');
      let paymentsData;
      if (role === 'admin') {
        paymentsData = await getAllPayments(token);
      } else {
        paymentsData = await getStudentPayments(token);
      }
      const processedPayments = Array.isArray(paymentsData)
        ? paymentsData
        : paymentsData?.payments || [];
      setPayments(processedPayments);
      return processedPayments;
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  }, [authToken, userRole]);

  const fetchUserProfile = useCallback(
    async (providedToken = null) => {
      try {
        setLoading(prev => ({ ...prev, user: true }));
        const token = providedToken || authToken || localStorage.getItem('authToken');

        if (!token) {
          throw new Error('No authentication token available');
        }

        const profileData = await getCurrentUserProfile(token);

        if (!profileData) {
          throw new Error('No profile data received');
        }


        // Update the current user with the fetched profile data
        setCurrentUser(prevUser => ({
          ...prevUser, // Preserve existing user data
          ...profileData, // Update with new profile data
          // Ensure we have the basic fields
          email: profileData.email || (prevUser?.email || ''),
          name: profileData.name || (prevUser?.name || ''),
          role: profileData.role || (prevUser?.role || userRole)
        }));

        // Update local storage with the latest user data
        localStorage.setItem('currentUser', JSON.stringify({
          ...JSON.parse(localStorage.getItem('currentUser') || '{}'),
          ...profileData
        }));

        return profileData;
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        if (error?.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          logout();
        }
        throw error;
      } finally {
        setLoading(prev => ({ ...prev, user: false }));
      }
    },
    [authToken, logout, userRole]
  );

  // ---------- Auto-fetch after auth ----------
  useEffect(() => {
    if (!isAuthenticated) return;


    // First, ensure we have the latest user profile
    fetchUserProfile().catch(err =>
      console.error('Auto-fetch user profile failed:', err)
    );

    // Then fetch other data
    fetchRooms().catch(err =>
      console.error('Auto-fetch rooms failed:', err)
    );
    fetchBookings().catch(err =>
      console.error('Auto-fetch bookings failed:', err)
    );
    fetchPayments().catch(err =>
      console.error('Auto-fetch payments failed:', err)
    );

    if (userRole === 'admin') {
      fetchStudents().catch(err =>
        console.error('Auto-fetch students failed:', err)
      );
    }
  }, [isAuthenticated, userRole, fetchRooms, fetchBookings, fetchPayments, fetchStudents]);

  // ---------- Actions (memoized) ----------
  const login = useCallback(
    async (credentials, role) => {
      setLoading(prev => ({ ...prev, login: true }));
      try {
        const response = await apiLogin(credentials.email, credentials.pass, role);

        const token = response.token || response.access_token || response.authToken || response.auth_token;
        if (!token) {
          throw new Error('No authentication token received from server');
        }

        // Set expiration time (e.g., 30 minutes from now)
        const expirationTime = new Date().getTime() + 30 * 60 * 1000;
        localStorage.setItem('expirationTime', expirationTime.toString());

        // First, set the token
        setAuthToken(token);
        localStorage.setItem('authToken', token);

        // Then set the authentication state
        setIsAuthenticated(true);
        setUserRole(role);
        localStorage.setItem('userRole', role);

        // Set initial user data from the login response
        const userData = role === 'admin'
          ? (response.admin || response.user || { email: credentials.email, role })
          : (response.student || response.user || { email: credentials.email, role });

        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // Fetch additional user profile data
        try {
          await fetchUserProfile(token);
        } catch (profileError) {
          console.warn('⚠️ Could not fetch user profile, using basic user data:', profileError);
        }

        setIsInitializing(false);
        return { ...response, user: userData };
      } catch (error) {
        console.error('Login failed:', error);
        setLoading(prev => ({ ...prev, login: false }));
        throw new Error(error.message || 'Login failed. Please try again.');
      } finally {
        setLoading(prev => ({ ...prev, login: false }));
      }
    },
    [fetchUserProfile]
  );

  const registerStudent = useCallback(async (studentData) => {
    try {
      const response = await apiRegisterStudent(studentData, null); // public registration
      return response;
    } catch (error) {
      console.error('Failed to register student:', error);
      throw error;
    }
  }, []);

  const deleteStudent = useCallback(
    async (studentId) => {
      try {
        if (!authToken) throw new Error('Authentication required to delete students');
        const response = await apiDeleteStudent(studentId, authToken);
        await fetchStudents();
        return response;
      } catch (error) {
        console.error('Failed to delete student:', error);
        throw error;
      }
    },
    [authToken, fetchStudents]
  );

  const updateStudent = useCallback(
    async (studentId, studentData) => {
      try {
        if (!authToken) throw new Error('Authentication required to update students');
        const response = await apiUpdateStudent(studentId, studentData, authToken);
        await fetchStudents();
        return response;
      } catch (error) {
        console.error('Failed to update student:', error);
        throw error;
      }
    },
    [authToken, fetchStudents]
  );

  const addRoom = useCallback(
    async (roomData) => {
      try {
        // generate cot coordinates if needed
        const totalCots = roomData.totalCots;
        const layoutCols = roomData.layoutCols || 6;
        const layoutRows = roomData.layoutRows || Math.ceil(totalCots / layoutCols);

        let cots = [];
        if (roomData.customCots && roomData.customCots.length > 0) {
          cots = roomData.customCots;
        } else {
          for (let i = 0; i < totalCots; i++) {
            const x = i % layoutCols;
            const y = Math.floor(i / layoutCols);
            cots.push({ number: i + 1, x, y, status: 'Available' });
          }
        }

        const roomDataWithCoordinates = { ...roomData, layoutCols, layoutRows, cots };

        if (!authToken) throw new Error('Authentication required to create rooms');
        const response = await apiCreateRoom(roomDataWithCoordinates, authToken);
        await fetchRooms();
        return response;
      } catch (error) {
        console.error('Failed to create room:', error);
        throw error;
      }
    },
    [authToken, fetchRooms]
  );

  const createBooking = useCallback(
    async (bookingData) => {
      try {
        if (!authToken) throw new Error('Authentication required to create a booking.');
        const newBookingResponse = await createStudentBooking(bookingData, authToken);
        await fetchBookings();
        return newBookingResponse;
      } catch (error) {
        console.error('Failed to create booking:', error);
        throw error;
      }
    },
    [authToken, fetchBookings]
  );

  const addPayment = useCallback(
    async (paymentData) => {
      try {
        setLoading(prev => ({ ...prev, payments: true }));
        const token = authToken || localStorage.getItem('authToken');
        const newPayment = await createPayment(paymentData, token);
        await fetchPayments();
        return newPayment;
      } catch (error) {
        console.error('Failed to add payment:', error);
        throw error;
      } finally {
        setLoading(prev => ({ ...prev, payments: false }));
      }
    },
    [authToken, fetchPayments],
  );

  // ---------- Memoized context value ----------
  const value = useMemo(
    () => ({
      // State
      students,
      rooms,
      bookings,
      payments,
      loading,
      isInitializing,
      facilities,
      currentUser,
      isAuthenticated,
      userRole,
      // Actions
      login,
      logout,
      registerStudent,
      fetchRooms,
      createRoom: addRoom,
      deleteStudent,
      updateStudent,
      fetchStudents,
      fetchBookings,
      createBooking,
      addPayment,
      fetchPayments,
      fetchUserProfile,
      getFacilities
    }),
    [
      // State dependencies
      students,
      rooms,
      bookings,
      payments,
      loading,
      isInitializing,
      facilities,
      currentUser,
      isAuthenticated,
      userRole,
      // Action dependencies
      login,
      logout,
      registerStudent,
      addRoom,
      fetchRooms,
      deleteStudent,
      updateStudent,
      fetchStudents,
      fetchBookings,
      createBooking,
      addPayment,
      fetchPayments,
      fetchUserProfile,
      getFacilities,
      fetchFacilities
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
