import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-bg p-4">
      {children}
    </div>
  );
};

export default AuthLayout;