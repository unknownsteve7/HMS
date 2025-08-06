import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
  };

  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        console.log('🔄 Restoring auth state...');
        const storedToken = localStorage.getItem('authToken');
        const storedRole = localStorage.getItem('userRole');

        console.log('📦 Stored auth data:', {
          hasToken: !!storedToken,
          role: storedRole
        });

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
          if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
            logout();
          }
        }
      } catch (e) {
        console.error('Error in auth restoration', e);
        setIsInitializing(false);
      }
    };
    restoreAuthState();
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, rooms: true }));
      const token = authToken || localStorage.getItem('authToken');
      const roomsData = await getAllRooms(token);
      let processedRooms = Array.isArray(roomsData) ? roomsData : (roomsData && (roomsData.rooms || roomsData.data)) || [];
      setRooms(processedRooms);
      return processedRooms;
    } catch (error) {
      if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        logout();
      }
      setRooms([]);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, rooms: false }));
    }
  }, [authToken]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, students: true }));
      const token = authToken || localStorage.getItem('authToken');
      const studentsData = await getAllStudents(token);
      let processedStudents = Array.isArray(studentsData) ? studentsData : (studentsData && (studentsData.students || studentsData.data)) || [];
      setStudents(processedStudents);
      return processedStudents;
    } catch (error) {
      if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        logout();
      }
      setStudents([]);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, students: false }));
    }
  }, [authToken]);

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
      const processedBookings = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [];
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
      const processedPayments = Array.isArray(paymentsData) ? paymentsData : paymentsData.payments || [];
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

  const fetchUserProfile = useCallback(async (providedToken = null) => {
    try {
      setLoading(prev => ({ ...prev, user: true }));
      const token = providedToken || authToken || localStorage.getItem('authToken');
      const profileData = await getCurrentUserProfile(token);
      setCurrentUser(profileData);
      return profileData;
    } catch (error) {
      if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        logout();
      }
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  }, [authToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms().catch(err => console.error('Auto-fetch rooms failed:', err));
      fetchBookings().catch(err => console.error('Auto-fetch bookings failed:', err));
      fetchPayments().catch(err => console.error('Auto-fetch payments failed:', err));
      if (userRole === 'admin') {
        fetchStudents().catch(err => console.error('Auto-fetch students failed:', err));
      }
    }
  }, [isAuthenticated, userRole, fetchRooms, fetchBookings, fetchPayments, fetchStudents]);

  const login = async (credentials, role) => {
    setLoading(prev => ({ ...prev, login: true }));
    try {
      const response = await apiLogin(credentials.email, credentials.pass, role);
      const token = response.token || response.access_token || response.authToken || response.auth_token;

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
  };

  const registerStudent = async (studentData) => {
    try {
      console.log('👤 AppContext: registerStudent called with data:', studentData);

      // Student registration doesn't require authentication - it's for new users
      console.log('🔐 Registering new student (no auth token required)');
      console.log('🚀 Calling apiRegisterStudent with:', studentData);

      const response = await apiRegisterStudent(studentData, null); // No auth token for registration
      console.log('✅ Student registered via API:', response);

      // Don't refresh students list since this is a public registration
      // Only admins would need to see the updated student list

      return response;
    } catch (error) {
      console.error('❌ Failed to register student:', error);
      throw error;
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      console.log('🗑️ AppContext: deleteStudent called for ID:', studentId);

      // If authenticated, use API
      if (authToken) {
        console.log('🔐 Authentication token found, using API for student deletion');
        console.log('🚀 Calling apiDeleteStudent with ID:', studentId);
        console.log('🔑 Auth token:', authToken && typeof authToken === 'string' ? `${authToken.substring(0, 10)}...` : 'null');

        const response = await apiDeleteStudent(studentId, authToken);
        console.log('✅ Student deleted via API:', response);

        // Refresh students list after deletion
        console.log('🔄 Refreshing students list...');
        await fetchStudents();

        return response;
      } else {
        console.log('❌ No authentication token - cannot delete student');
        throw new Error('Authentication required to delete students');
      }
    } catch (error) {
      console.error('❌ Failed to delete student:', error);
      throw error;
    }
  };

  const updateStudent = async (studentId, studentData) => {
    try {
      console.log('✏️ AppContext: updateStudent called for ID:', studentId);
      console.log('📝 Student data:', studentData);

      // If authenticated, use API
      if (authToken) {
        console.log('🔐 Authentication token found, using API for student update');
        console.log('🚀 Calling apiUpdateStudent with ID:', studentId);
        console.log('🔑 Auth token:', authToken && typeof authToken === 'string' ? `${authToken.substring(0, 10)}...` : 'null');

        const response = await apiUpdateStudent(studentId, studentData, authToken);
        console.log('✅ Student updated via API:', response);

        // Refresh students list after update
        console.log('🔄 Refreshing students list...');
        await fetchStudents();

        return response;
      } else {
        console.log('❌ No authentication token - cannot update student');
        throw new Error('Authentication required to update students');
      }
    } catch (error) {
      console.error('❌ Failed to update student:', error);
      throw error;
    }
  };

  const addRoom = async (roomData) => {
    try {
      console.log('🏠 AppContext: addRoom called with data:', roomData);

      // Generate coordinates for cots based on totalCots and layout
      const totalCots = roomData.totalCots;
      const layoutCols = roomData.layoutCols || 6;
      const layoutRows = roomData.layoutRows || Math.ceil(totalCots / layoutCols);

      console.log('📐 Layout calculations:', { totalCots, layoutCols, layoutRows });

      // Use custom cots if provided, otherwise generate default coordinates
      let cots = [];
      if (roomData.customCots && roomData.customCots.length > 0) {
        console.log('✅ Using custom cots:', roomData.customCots);
        cots = roomData.customCots;
      } else {
        console.log('🔄 Generating default cot coordinates...');
        // Generate default cot coordinates
        for (let i = 0; i < totalCots; i++) {
          const x = i % layoutCols;
          const y = Math.floor(i / layoutCols);
          cots.push({
            number: i + 1,
            x: x,
            y: y,
            status: 'Available'
          });
        }
        console.log('🛏️ Generated default cots:', cots);
      }

      const roomDataWithCoordinates = {
        ...roomData,
        layoutCols,
        layoutRows,
        cots
      };

      console.log('📦 Final room data with coordinates:', roomDataWithCoordinates);

      // If authenticated, use API
      if (authToken) {
        console.log('🔐 Authentication token found, using API');
        console.log('🚀 Calling apiCreateRoom with:', roomDataWithCoordinates);
        console.log('🔑 Auth token:', authToken && typeof authToken === 'string' ? `${authToken.substring(0, 10)}...` : 'null');

        const response = await apiCreateRoom(roomDataWithCoordinates, authToken);
        console.log('✅ Room created via API:', response);

        // Refresh rooms list after creation
        console.log('🔄 Refreshing rooms list...');
        await fetchRooms();
        return response;
      } else {
        console.log('❌ No authentication token - cannot create room');
        throw new Error('Authentication required to create rooms');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  };

  const createBooking = async (bookingData) => {
    try {
      console.log('📦 AppContext: createBooking called with data:', bookingData);
      if (!authToken) {
        throw new Error('Authentication required to create a booking.');
      }
      const newBookingResponse = await createStudentBooking(bookingData, authToken);
      console.log('✅ Booking created via API:', newBookingResponse);

      // After creating a booking, always refetch the full list from the server.
      // This ensures data consistency and prevents crashes from partial data.
      console.log('🔄 Refreshing bookings list after creation...');
      await fetchBookings();

      return newBookingResponse;
    } catch (error) {
      console.error('❌ Failed to create booking:', error);
      throw error;
    }
  };

  const addPayment = async (paymentData) => {
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
  };

  const value = {
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};