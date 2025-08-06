import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { BookHeart, Menu, X } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const activeLinkStyle = "bg-primary-purple/10 text-primary-purple shadow-soft-ui-sm-inset";
  const defaultLinkStyle = "hover:bg-slate-200/50 text-slate-600";

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Burger Menu Button - only show when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-7 left-4 z-50 p-2 bg-primary-purple text-white rounded-lg shadow-lg hover:bg-primary-purple/90 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative
        top-0 left-0 
        w-64 h-full
        flex-shrink-0 bg-base-bg p-6 flex flex-col
        transform transition-transform duration-300 ease-in-out z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 p-2 mb-8">
          <div className="p-2 ">
            <a href="/"><img src="/sgi.png" alt="Sanskrithi Hostel Logo" className="w-28 h-18 -mt-5" /></a>


          </div>
          <div className="flex flex-col">

          </div>
        </div>
        <nav className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-4 p-3 rounded-xl font-semibold transition-all duration-300 ${isActive ? activeLinkStyle : defaultLinkStyle}`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-center text-xs text-text-medium">
          <p>&copy; {new Date().getFullYear()} Sanskrithi School of Engineering</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;