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
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { registerStudent } = useAppContext();
  const { showSuccess, showError } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`🔄 Form field changed: ${name} = "${value}"`);
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('📋 Current form data before validation:', formData);

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
      };

      console.log('📝 Submitting registration data:', newStudentData);

      await registerStudent(newStudentData);

      // Show success toast
      showSuccess('Registration successful! Please login with your credentials.', 6000);

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error('Registration failed:', err);
      const errorMessage = err.message || 'An error occurred during registration. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-primary-purple">Student Registration</h1>
        <p className="text-center text-text-medium mt-1 mb-8">Join SSE Hostel Management System</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              placeholder="Enter your full name"
              onChange={handleChange}
              required
            />
            <Input
              label="Email Address"
              name="email_address"
              type="email"
              value={formData.email_address}
              placeholder="Enter your email"
              onChange={handleChange}
              required
            />
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
          </div>

          {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full !py-3 !text-base"
              disabled={isLoading}
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