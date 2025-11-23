import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, userRole, isInitializing } = useAppContext();
  const location = useLocation();

  

  // Show loading state during initialization
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

  // Check if user is authenticated and has required role
  const hasAccess = isAuthenticated && (
    allowedRoles.length === 0 ||
    allowedRoles.includes(userRole)
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={userRole === 'admin' ? '/' : '/student'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;