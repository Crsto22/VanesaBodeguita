import React from 'react';
import { Bell, Menu, X, Home, ShoppingCart, AlertCircle } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ menuOpen, setMenuOpen, notifications }) => {
  const { currentUser, userData } = useAuth();
  const { configuracion, configLoaded, saving, enableTienda } = useConfig();
  
  // Get user initial for avatar
  const userInitial = (userData?.nombre?.charAt(0) || currentUser?.email?.charAt(0))?.toUpperCase();
  const displayName = userData?.nombre || currentUser?.email;

  return (
    <header className="sticky top-0 z-10 bg-white backdrop-blur-sm bg-opacity-90 border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-500 transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          {/* Logo - Oculto en móvil cuando hay alertas */}
          <img 
            src={Logo} 
            alt="Logo" 
            className={`h-8 w-auto transition-all duration-300 ${
              configLoaded && (!configuracion.tienda_abierta || !configuracion.hacer_pedidos)
                ? 'hidden sm:block' 
                : 'block'
            }`} 
          />
          
          {/* Alerta de Tienda Cerrada */}
          <AnimatePresence>
            {configLoaded && !configuracion.tienda_abierta && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-1.5 sm:gap-2 bg-red-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg"
              >
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wide whitespace-nowrap">Tienda Cerrada</span>
                </div>
                <button
                  onClick={enableTienda}
                  disabled={saving}
                  className="bg-white hover:bg-gray-100 text-red-600 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Habilitar
                </button>
              </motion.div>
            )}
            
            {/* Alerta de Pedidos Deshabilitados (tienda abierta pero pedidos off) */}
            {configLoaded && configuracion.tienda_abierta && !configuracion.hacer_pedidos && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-1.5 sm:gap-2 bg-orange-500 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg"
              >
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wide whitespace-nowrap">Pedidos Deshabilitados</span>
                </div>
                <button
                  onClick={() => enableTienda()}
                  disabled={saving}
                  className="bg-white hover:bg-gray-100 text-orange-600 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Habilitar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg p-2 text-[#45923a] transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 group"
            aria-label="Ir a inicio"
          >
            <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </Link>

          {/* Sales Button - Only visible on mobile */}
          <Link
            to="/ventas"
            className="md:hidden rounded-lg p-2 bg-[#45923a] text-white transition-all hover:bg-[#3a7d31] focus:outline-none focus:ring-2 focus:ring-[#45923a] group shadow-sm"
            aria-label="Nueva venta"
          >
            <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </Link>
          
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