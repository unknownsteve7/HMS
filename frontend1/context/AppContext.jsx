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
        const storedToken = localStorage.getItem('authToken');
        const storedRole = localStorage.getItem('userRole');

        if (!storedToken || !storedRole) {
          setIsInitializing(false);
          return;
        }

        setAuthToken(storedToken);
        setUserRole(storedRole);
        setIsAuthenticated(true);

        const storedUserStr = localStorage.getItem('currentUser');
        if (storedUserStr) {
          try {
            setCurrentUser(JSON.parse(storedUserStr));
          } catch (err) {
            console.error('Error parsing stored user data', err);
          }
        }

        setIsInitializing(false);

        try {
          const userData = await getCurrentUserProfile(storedToken);
          if (userData) {
            setCurrentUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
          }
        } catch (error) {
          if (error?.message && (error.message.includes('401') || error.message.includes('403'))) {
            logout();
          }
        }
      } catch (e) {
        console.error('Error in auth restoration', e);
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
      setLoading(prev => ({ ...prev, bookings: true }));
      const token = authToken || localStorage.getItem('authToken');
      const role = userRole || localStorage.getItem('userRole');
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
        const profileData = await getCurrentUserProfile(token);
        setCurrentUser(profileData);
        return profileData;
      } catch (error) {
        if (error?.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          logout();
        }
        throw error;
      } finally {
        setLoading(prev => ({ ...prev, user: false }));
      }
    },
    [authToken, logout]
  );

  // ---------- Auto-fetch after auth ----------
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchRooms().catch(err => console.error('Auto-fetch rooms failed:', err));
    fetchBookings().catch(err => console.error('Auto-fetch bookings failed:', err));
    fetchPayments().catch(err => console.error('Auto-fetch payments failed:', err));
    if (userRole === 'admin') {
      fetchStudents().catch(err => console.error('Auto-fetch students failed:', err));
    }
  }, [isAuthenticated, userRole, fetchRooms, fetchBookings, fetchPayments, fetchStudents]);

  // ---------- Actions (memoized) ----------
  const login = useCallback(
    async (credentials, role) => {
      setLoading(prev => ({ ...prev, login: true }));
      try {
        const response = await apiLogin(credentials.email, credentials.pass, role);
        const token =
          response.token || response.access_token || response.authToken || response.auth_token;

        if (token) {
          setAuthToken(token);
          localStorage.setItem('authToken', token);
        } else {
          throw new Error('No authentication token received from server');
        }

        setIsAuthenticated(true);
        setUserRole(role);
        localStorage.setItem('userRole', role);

        const userData = role === 'admin' ? (response.admin || response.user) : (response.student || response.user);
        if (!userData) {
          throw new Error(`No user data received for ${role} login`);
        }
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));

        await fetchUserProfile(token);
        setIsInitializing(false);
        return response;
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
    [authToken, fetchPayments]
  );

  // ---------- Memoized context value ----------
  const value = useMemo(
    () => ({
      students,
      rooms,
      bookings,
      payments,
      addRoom,
      fetchRooms,
      deleteStudent,
      updateStudent,
      registerStudent,
      fetchStudents,
      createBooking,
      fetchBookings,
      addPayment,
      fetchPayments,
      fetchUserProfile,
      isAuthenticated,
      userRole,
      currentUser,
      authToken,
      isInitializing,
      login,
      logout,
      loading,
    }),
    [
      students,
      rooms,
      bookings,
      payments,
      addRoom,
      fetchRooms,
      deleteStudent,
      updateStudent,
      registerStudent,
      fetchStudents,
      createBooking,
      fetchBookings,
      addPayment,
      fetchPayments,
      fetchUserProfile,
      isAuthenticated,
      userRole,
      currentUser,
      authToken,
      isInitializing,
      login,
      logout,
      loading,
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
