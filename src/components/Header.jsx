import React from 'react';
import { Bell, Menu, X } from 'lucide-react';
import Logo from '../assets/Logo.svg';

const Header = ({ menuOpen, setMenuOpen, userName, notifications }) => {
  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo y botón de menú */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 text-gray-500 transition-all hover:bg-gray-100"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <img src={Logo} alt="Logo" className="h-8 w-auto" />
        </div>

        {/* Notificaciones y perfil */}
        <div className="flex items-center gap-3">
          <button className="relative rounded-full bg-gray-100 p-2 transition-all hover:bg-gray-200">
            <Bell className="h-5 w-5 text-gray-700" />
            {notifications > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                {notifications}
              </span>
            )}
          </button>
          <button className="relative h-9 w-9 overflow-hidden rounded-full bg-[#45923a] text-white ring-2 ring-white">
            <span className="flex h-full w-full items-center justify-center text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
