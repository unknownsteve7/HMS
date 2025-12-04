import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PaymentStatus from './components/payu/PaymentStatus';


import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import StudentLayout from './components/student/StudentLayout';

// Maintenance Mode
// import MaintenanceMode from './pages/MaintenanceMode';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Admin Pages
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import RoomManagement from './pages/RoomManagement';
import BookingManagement from './pages/BookingManagement';
import PaymentsManagement from './pages/PaymentsManagement';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile'; // Shared profile component

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import BrowseRooms from './pages/student/BrowseRooms';
import BookRoom from './pages/student/BookRoom';
import MyBookings from './pages/student/MyBookings';
import PaymentHistory from './pages/student/PaymentHistory';

// Maintenance Mode Flag - Set to true to enable maintenance mode
// const MAINTENANCE_MODE = true;

// Simple test component to verify rendering
const TestComponent = () => (
  <div className="min-h-screen bg-base-bg flex items-center justify-center">
    <div className="text-center p-8">
      <h1 className="text-4xl font-bold text-primary-purple mb-4">Sanskrithi Hostel Management</h1>
      <p className="text-lg text-text-medium mb-6">Application is loading...</p>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto"></div>
    </div>
  </div>
);

// Loading Component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-base-bg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

const AdminPortal = () => (
  <div className="flex h-screen font-sans bg-base-bg relative">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <PageWrapper>
          <Outlet />
        </PageWrapper>
      </main>
    </div>
  </div>
);

const AppRoutes = () => {

  // Debug - log current location
  const locationFromWindow = window.location.pathname;

  try {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="browse-rooms" element={<BrowseRooms />} />
            <Route path="book-room/:roomId" element={<BookRoom />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="payment-history" element={<PaymentHistory />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* PayU Payment Callback Routes - Accessible without authentication */}
        <Route path="/payment/success" element={<PaymentStatus type="success" />} />
        <Route path="/payment/failure" element={<PaymentStatus type="failure" />} />
        <Route path="/payment/cancel" element={<PaymentStatus type="failure" />} />

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/" element={<AdminPortal />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="payments" element={<PaymentsManagement />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  } catch (error) {
    console.error('❌ Error in AppRoutes component:', error);
    return (
      <div className="min-h-screen bg-blue-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-blue-800 mb-4">Routing Error</h1>
          <p className="text-blue-600 mb-4">Error setting up application routes.</p>
          <pre className="text-sm text-blue-500 bg-blue-50 p-4 rounded overflow-auto max-w-md">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }
};

// Simplified AppContent to debug rendering issues
const AppContent = () => {

  try {
    const { isInitializing, isAuthenticated, userRole } = useAppContext();

    // Check if the browser has reloaded but we're still trying to initialize
    const browserHasToken = localStorage.getItem('authToken') !== null;

    // Show loading state
    if (isInitializing) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-base-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Show the actual app routes
    return <AppRoutes />;
  } catch (error) {
    console.error('Error in AppContent component:', error);
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-yellow-800 mb-4">Context Error</h1>
          <p className="text-yellow-600 mb-4">Error accessing application context.</p>
          <pre className="text-sm text-yellow-500 bg-yellow-50 p-4 rounded overflow-auto max-w-md">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }
};

// Import our ErrorBoundary
import ErrorBoundary from './components/ui/ErrorBoundary';

const App = () => {
  // Check maintenance mode first - before any routing
  // if (MAINTENANCE_MODE) {
  //   return <MaintenanceMode />;
  // }

  try {
    return (
      <ErrorBoundary>
        <AppProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ToastProvider>
        </AppProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Application Error</h1>
          <p className="text-red-600 mb-4">Something went wrong while loading the application.</p>
          <pre className="text-sm text-red-500 bg-red-50 p-4 rounded overflow-auto max-w-md">
            {error.message}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Reset Application
          </button>
        </div>
      </div>
    );
  }
};

export default App;

