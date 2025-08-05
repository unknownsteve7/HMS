import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronDown, User, LogOut, BookHeart } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const studentNavLinks = [
  { path: '/student/dashboard', label: 'Dashboard' },
  { path: '/student/browse-rooms', label: 'Room Booking' },
  { path: '/student/my-bookings', label: 'My Bookings' },
  { path: '/student/payment-history', label: 'Payment History' },
  { path: '/student/profile', label: 'My Profile' },
];

const StudentHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAppContext();

  const currentNavItem = studentNavLinks.find(item => location.pathname.startsWith(item.path));
  const pageTitle = currentNavItem ? currentNavItem.label : 'Student Portal';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex-shrink-0 h-24 flex items-center justify-between px-8 bg-base-bg border-b border-subtle-border shadow-soft-ui-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2  ">
            <img src="/sgi.png" alt="Sanskrithi Hostel Logo" className="w-28 h-18 " />
          </div>

        </div>
        <div className="hidden md:block mx-4 w-px h-8 bg-subtle-border"></div>
        <h2 className="hidden md:block text-2xl font-bold text-text-dark">{pageTitle}</h2>
      </div>
      <div className="relative group">
        <div className="flex items-center gap-4 cursor-pointer p-2 rounded-full shadow-soft-ui bg-white">
          <img src={`https://i.pravatar.cc/40?u=${currentUser?.email}`} alt={currentUser?.name} className="w-10 h-10 rounded-full" />
          <div className="text-left hidden md:block">
            <p className="font-semibold text-text-dark">{currentUser?.full_name }</p>
            <p className="text-xs text-text-medium">{currentUser?.email_address}</p>
          </div>
          <ChevronDown className="h-5 w-5 text-text-medium transition-transform duration-300 group-hover:rotate-180" />
        </div>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft-ui overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
          <Link to="/student/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-text-dark hover:bg-slate-100">
            <User className="h-4 w-4" /> My Profile
          </Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-text-dark hover:bg-slate-100">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;