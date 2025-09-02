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
  const { login, isAuthenticated, userRole } = useAppContext();



  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userRole) {
      console.log('🔄 User already authenticated, redirecting...', { userRole });

      // Add a small delay to ensure context is fully updated
      setTimeout(() => {
        if (userRole === 'admin') {
          console.log('🚀 Redirecting to admin dashboard');
          navigate('/', { replace: true });
        } else {
          console.log('🚀 Redirecting to student dashboard');
          navigate('/student/dashboard', { replace: true });
        }
      }, 300);
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login...', { email, role: activeTab });

      const response = await login({ email, pass: password }, activeTab);
      console.log('✅ Login successful:', response);

      // Wait a moment for state to be updated
      setTimeout(() => {
        console.log('🧭 Navigating after login:', {
          isAuthenticated: true,
          userRole: activeTab,
          navigatingTo: activeTab === 'admin' ? '/' : '/student/dashboard'
        });

        // Navigation will be handled by the useEffect above
        // But we can also navigate here as a fallback
        if (activeTab === 'admin') {
          navigate('/', { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
      }, 500);
    } catch (err) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetApp = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Application cache cleared');
    window.location.reload();
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full !py-3 !text-base" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
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
      </Card>
    </AuthLayout>
  );
};

export default Login;