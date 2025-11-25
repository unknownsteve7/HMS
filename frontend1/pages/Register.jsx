import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import AuthLayout from '../components/auth/AuthLayout';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { sendOtp } from '../apiService';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email_address: '',
    mobile_number: '',
    Registration_number: '',
    Branch: '',
    Year: '',
    gender: '',
    password: '',
    confirmPassword: '',
    otp: '', // OTP for verification
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { registerStudent } = useAppContext();
  const { showSuccess, showError } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSendOtp = async () => {
    if (!formData.email_address) {
      showError('Please enter your email address first');
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendOtp(formData.email_address,'newregistration');
      setOtpSent(true);
      showSuccess('OTP has been sent to your email address');
    } catch (err) {
      console.error('Failed to send OTP:', err);

      // Extract clean error message without status codes
      let errorMessage = err.message || 'Failed to send OTP. Please try again.';

      // Remove HTTP status codes and extract just the message
      if (errorMessage.includes('HTTP 409') || errorMessage.toLowerCase().includes('email already registered')) {
        errorMessage = 'Email already Registered';
      } else if (errorMessage.includes('HTTP')) {
        // Remove HTTP status codes from any other error messages
        errorMessage = errorMessage.replace(/HTTP \d+: /g, '').trim();
      }

      showError(errorMessage);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const newStudentData = {
        full_name: formData.full_name,
        email_address: formData.email_address,
        mobile_number: formData.mobile_number,
        Registration_number: formData.Registration_number,
        Branch: formData.Branch,
        Year: formData.Year, // Keep as string to match backend format
        gender: formData.gender,
        password: formData.password, // Include password for registration
        otp: formData.otp, // Include OTP for verification
      };

      await registerStudent(newStudentData);

      // Show success toast
      showSuccess('Registration successful! Please login with your credentials.', 6000);

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error('Registration failed:', err);

      // Extract clean error message without status codes
      let errorMessage = err.message || 'An error occurred during registration. Please try again.';

      // Remove HTTP status codes and extract just the message
      if (errorMessage.includes('HTTP 409') || errorMessage.toLowerCase().includes('email already registered')) {
        errorMessage = 'Email already Registered';
      } else if (errorMessage.includes('HTTP')) {
        // Remove HTTP status codes from any other error messages
        errorMessage = errorMessage.replace(/HTTP \d+: /g, '').trim();
      }

      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-primary-purple">
          Student Registration
        </h1>
        <p className="text-center text-text-medium mt-1 mb-8">
          Join SSE Hostel Management System
        </p>


        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common fields for both student and admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              placeholder="Enter full name"
              onChange={handleChange}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  name="email_address"
                  value={formData.email_address}
                  placeholder="Enter email address"
                  onChange={handleChange}
                  required
                  className="flex-grow max-w-[60%] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || !formData.email_address || otpSent}
                  className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap min-w-[100px] ${isSendingOtp || !formData.email_address || otpSent
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-purple text-white hover:bg-purple-700'
                    }`}
                >
                  {isSendingOtp ? 'Sending...' : otpSent ? 'Sent' : 'Send OTP'}
                </button>
              </div>
            </div>
            <Input
              label="Mobile Number"
              name="mobile_number"
              value={formData.mobile_number}
              placeholder="Enter 10-digit mobile number"
              onChange={handleChange}
              required
            />
            <Select
              label="Professional Degree"
              name="Registration_number"
              value={formData.Registration_number}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Degree</option>
              <option value="BTECH">BTech</option>
              <option value="MBA">MBA</option>
            </Select>
            <Select
              label="Branch"
              name="Branch"
              value={formData.Branch}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Branch</option>
              <option value="CSE">Computer Science & Engineering (CSE)</option>
              <option value="ECE">Electronics & Communication Engineering (ECE)</option>
              <option value="MECH">Mechanical Engineering (MECH)</option>
              <option value="CIVIL">Civil Engineering (CIVIL)</option>
              <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
              <option value="IT">Information Technology (IT)</option>
            </Select>
            <Select
              label="Year"
              name="Year"
              value={formData.Year}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </Select>
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              placeholder="Enter password (min 6 chars)"
              onChange={handleChange}
              required
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              placeholder="Confirm your password"
              onChange={handleChange}
              required
            />

            {/* OTP input field - only shown after OTP is sent */}
            {otpSent && (
              <Input
                label="Enter OTP"
                name="otp"
                type="text"
                value={formData.otp}
                placeholder="Enter 6-digit OTP"
                onChange={handleChange}
                required
                maxLength={6}
                pattern="\d{6}"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full !py-3 !text-base"
              disabled={isLoading || (!otpSent || formData.otp.length !== 6)}
              leftIcon={isLoading ? <Spinner size="sm" /> : null}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>
        <p className="text-center text-sm text-text-medium mt-6">
          Already have an account? <Link to="/login" className="font-semibold text-primary-purple hover:underline">Login here</Link>
        </p>
      </Card>
    </AuthLayout>
  );
};

export default Register;


