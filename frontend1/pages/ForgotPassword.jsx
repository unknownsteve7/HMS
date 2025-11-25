import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthLayout from '../components/auth/AuthLayout';
import { sendOTP, resetPassword } from '../apiService';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await sendOTP(email,cause='forgotpassword');
      showSuccess('OTP sent to your email address');
      setStep(2);
    } catch (err) {
      console.error('❌ Failed to send OTP:', err);
      showError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email, otp, newPassword);
      showSuccess('Password reset successfully');
      navigate('/login');
    } catch (err) {
      console.error('❌ Failed to reset password:', err);
      showError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <img src="/SGI LOGO 2023.jpg" alt="Logo" className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-center text-primary-purple mb-2">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </h1>
        <p className="text-center text-text-medium mb-6">
          {step === 1 
            ? 'Enter your email address to receive a password reset OTP' 
            : 'Enter the OTP sent to your email and create a new password'
          }
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <Input
              label="Email Address"
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              className="w-full !py-3 !text-base" 
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <Input
              label="One-Time Password (OTP)"
              id="otp"
              type="text"
              placeholder="Enter the 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              maxLength={6}
            />
            <Input
              label="New Password"
              id="newPassword"
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm New Password"
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              className="w-full !py-3 !text-base" 
              disabled={isLoading || !otp || !newPassword || !confirmPassword}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-text-medium">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-primary-purple hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {step === 2 && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-primary-purple hover:underline font-medium"
            >
              ← Back to Email
            </button>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
};

export default ForgotPassword;

