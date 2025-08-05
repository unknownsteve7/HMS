import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser, userRole } = useAppContext();
  const currentNavItem = NAV_ITEMS.find(item => `/${location.pathname.split('/')[1]}` === item.path);
  const pageTitle = currentNavItem ? currentNavItem.label : 'Admin Portal';

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  // Get user display information
  const userName = currentUser?.full_name || currentUser?.name || currentUser?.first_name || currentUser?.student_name || currentUser?.username || 'User';
  const userEmail = currentUser?.email || '';
  const displayRole = userRole === 'admin' ? 'Administrator' : 'Student'; return (
    <header className="flex-shrink-0 h-24 flex items-center justify-between px-8 md:px-8 pl-16 md:pl-8 bg-base-bg border-b border-subtle-border">
      <h1 className="text-3xl font-bold text-text-dark">{pageTitle}</h1>
      <div className="relative group">
        <div className="flex items-center gap-4 cursor-pointer p-2 px-5 rounded-full shadow-soft-ui bg-white">
          <div className="text-left hidden md:block">
            <p className="font-semibold text-text-dark">{currentUser?.full_name}</p>
            <p className="text-xs text-text-medium">{displayRole}</p>
          </div>
          <ChevronDown className="h-5 w-5 text-text-medium transition-transform duration-300 group-hover:rotate-180" />
        </div>
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft-ui overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-text-dark hover:bg-slate-100">
            <User className="h-4 w-4" /> Profile
          </Link>
          <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-text-dark hover:bg-slate-100">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;