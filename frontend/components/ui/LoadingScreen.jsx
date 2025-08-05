import React from 'react';

const LoadingScreen = ({ message = 'Loading...', fullScreen = true }) => {
  return (
    <div 
      className={`flex items-center justify-center bg-base-bg ${fullScreen ? 'min-h-screen' : 'h-full w-full'}`}
    >
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-primary-purple mb-4">
          Sanskrithi Hostel Management
        </h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-6"></div>
        <p className="text-lg text-text-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;