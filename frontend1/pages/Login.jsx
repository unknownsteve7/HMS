import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthLayout from '../components/auth/AuthLayout';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, userRole, currentUser } = useAppContext();



  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userRole && currentUser) {
      console.log('🔄 User authenticated and profile loaded, redirecting...', { userRole, currentUser });
      // Only navigate when context is fully ready
      if (userRole === 'admin') {
        navigate('/', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, userRole, currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login...', { email, role: activeTab });

      const response = await login({ email, pass: password }, activeTab);
      console.log('✅ Login successful:', response);
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
      // Always reload after login attempt, success or error
      setTimeout(() => {
        window.location.reload();
      }, 50);
    }
  };

  const handleResetApp = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Application cache cleared');
    // Instead of reload, navigate to login and let context re-initialize
    navigate('/login', { replace: true });
  };

  const tabStyle = "px-4 py-2 font-semibold text-center w-1/2 cursor-pointer transition-all duration-300 rounded-t-lg";
  const activeTabStyle = "text-primary-purple border-b-2 border-primary-purple";
  const inactiveTabStyle = "text-text-medium hover:text-text-dark";

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <img src="/SGI LOGO 2023.jpg" alt="Logo" className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-center text-primary-purple">Welcome Back</h1>
        <p className="text-center text-text-medium mt-1 mb-6">Sign in to your account</p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-purple mb-4"></div>
            <p className="text-lg text-primary-purple font-semibold">Signing In...</p>
            <p className="text-sm text-text-medium mt-2">Please wait while we load your profile.</p>
          </div>
        ) : (
          <>
            <div className="flex border-b border-subtle-border mb-6">
              <div onClick={() => setActiveTab('student')} className={`${tabStyle} ${activeTab === 'student' ? activeTabStyle : inactiveTabStyle}`}>
                Student
              </div>
              <div onClick={() => setActiveTab('admin')} className={`${tabStyle} ${activeTab === 'admin' ? activeTabStyle : inactiveTabStyle}`}>
                Admin
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                label="Email Address"
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full !py-3 !text-base" disabled={isLoading}>
                Sign In
              </Button>
            </form>

            {activeTab === 'student' && (
              <p className="text-center text-sm text-text-medium mt-6">
                Don't have an account? <Link to="/register" className="font-semibold text-primary-purple hover:underline">Register here</Link>
              </p>
            )}

            <button
              type="button"
              onClick={handleResetApp}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Having trouble? Reset application
            </button>
          </>
        )}
      </Card>
    </AuthLayout>
  );
};

export default Login;
