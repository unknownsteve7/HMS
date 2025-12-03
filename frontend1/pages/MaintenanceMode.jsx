import React from 'react';
import { Settings, Clock, AlertTriangle } from 'lucide-react';
import SSELogo from '../components/ui/SSELogo';

const MaintenanceMode = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <SSELogo className="h-16 w-auto" />
          </div>

          {/* Animated Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-6">
                <Settings className="w-16 h-16 text-white animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Service Temporarily Unavailable
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            We're currently performing scheduled maintenance to improve your experience.
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-purple-900">Expected Duration</h3>
              </div>
              <p className="text-sm text-purple-700">Services will resume shortly</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Urgent Support</h3>
              </div>
              <p className="text-sm text-blue-700">Contact hostel office if needed</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">What's Happening?</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our team is working to enhance the hostel management system. 
              Your data is safe and all existing bookings remain valid. 
              We appreciate your patience during this brief interruption.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Sanskrithi School of Engineering Hostel Management
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Please refresh this page in a few minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
