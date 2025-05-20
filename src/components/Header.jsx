import React from 'react';
import { Bell, Menu, X, Home } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Header = ({ menuOpen, setMenuOpen, notifications }) => {
  const { currentUser, userData } = useAuth();
  
  // Get user initial for avatar
  const userInitial = (userData?.nombre?.charAt(0) || currentUser?.email?.charAt(0))?.toUpperCase();
  const displayName = userData?.nombre || currentUser?.email;

  return (
    <header className="sticky top-0 z-10 bg-white backdrop-blur-sm bg-opacity-90 border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <img src={Logo} alt="Logo" className="h-8 w-auto" />
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg p-2 text-[#45923a] transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 group"
            aria-label="Ir a inicio"
          >
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </Link>
          
          <button 
            className="relative rounded-lg bg-gray-100 p-2 transition-all hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            {notifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-1 ring-white">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">
                {displayName}
              </span>
              <span className="text-xs text-gray-500">
                {userData?.role || 'User'}
              </span>
            </div>
            
            <div className="relative group">
              <button 
                className="h-9 w-9 overflow-hidden rounded-full bg-[#45923a] text-white ring-1 ring-gray-200 transition-all hover:ring-2 focus:outline-none focus:ring-2 focus:ring-[#45923a]"
                aria-label="User profile"
              >
                <span className="flex h-full w-full items-center justify-center text-sm font-medium">
                  {userInitial}
                </span>
              </button>
              <div className="absolute top-full right-0 mt-1 w-48 rounded-lg bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 border border-gray-200">
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;