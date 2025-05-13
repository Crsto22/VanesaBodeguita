import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen, quickAccessOptions, onOptionClick, logo }) => {
  const [animateIn, setAnimateIn] = useState(false);
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className={`absolute left-0 top-0 h-full w-72 transform overflow-y-auto bg-white shadow-xl transition-transform duration-300 ${
          animateIn ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-[#45923a] to-[#3d8033] px-6 py-8 text-white">
          <div className="mb-4 flex justify-center">
            <img src={logo} alt="Logo" className="h-20 w-auto" />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium">Bienvenido</h3>
            <p className="text-sm text-white/80">
              {userData?.nombre || currentUser?.email}
            </p>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a 
                href="#" 
                className="flex items-center rounded-xl bg-[#45923a]/10 p-3 font-medium text-[#45923a] transition-all hover:bg-[#45923a]/15"
              >
                <Home className="mr-3 h-5 w-5" />
                <span>Inicio</span>
              </a>
            </li>

            {quickAccessOptions.map((option) => (
              <li key={option.id}>
                <button 
                  onClick={() => onOptionClick(option.id)}
                  className="flex w-full items-center rounded-xl p-3 transition-all hover:bg-gray-100"
                >
                  <span className={`mr-3 flex h-8 w-8 items-center justify-center rounded-lg ${option.color} text-white`}>
                    {option.icon}
                  </span>
                  <span className="font-medium">{option.title}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t pt-4">
            <button 
              onClick={handleLogout}
              className="flex w-full items-center rounded-xl bg-red-50 p-3 font-medium text-red-600 transition-all hover:bg-red-100"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;