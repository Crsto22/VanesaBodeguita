import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Barcode, 
  ArrowLeft, 
  Settings,
  Bell,
  User,
  ShoppingCart,
  Clock,
  ScanBarcode,
  Sun,
  Moon,
  History
} from 'lucide-react';
import Logo from '../../assets/Logo.svg';
import { useAuth } from '../../context/AuthContext';

const NavbarVentasDestock = ({ 
  searchTerm, 
  setSearchTerm, 
  barcodeInput, 
  setBarcodeInput, 
  escanerActivo,
  toggleEscaner,
  onBack,
  isDisabled = false
}) => {
  // Hook de navegación
  const navigate = useNavigate();
  
  // Estado para la hora actual
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar la hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatear la fecha y hora
  const formatWeekday = (date) => {
    const options = { weekday: 'long' };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatDayMonth = (date) => {
    const options = { 
      day: 'numeric', 
      month: 'long'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Función para determinar si es día o noche
  const isDayTime = (date) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const totalMinutes = hour * 60 + minute;
    
    // Día: 6:30 AM (390 min) a 6:30 PM (1110 min)
    // Noche: 6:30 PM (1110 min) a 6:30 AM (390 min)
    return totalMinutes >= 390 && totalMinutes < 1110; // 6:30 AM a 6:30 PM
  };

  // Importar useAuth para obtener datos del usuario
  const { currentUser, userData } = useAuth();
  
  // Get user initial for avatar
  const userInitial = (userData?.nombre?.charAt(0) || currentUser?.email?.charAt(0))?.toUpperCase();
  const displayName = userData?.nombre || currentUser?.email;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 h-16 flex items-center px-6">
      <div className="flex items-center gap-6 flex-1">
        {/* Botón de regreso */}
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          title="Volver al Dashboard"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        
        {/* Logo del sistema */}
        <div className="flex items-center">
          <img 
            src={Logo} 
            alt="Logo" 
            className="h-10 w-10 object-contain" 
          />
        </div>
        
        {/* Barra de búsqueda */}
        <div className="flex-1 max-w-2xl mx-8 flex items-center gap-4">
          <div className="relative flex-1">
            <div className="bg-white border-2 border-gray-200 overflow-hidden focus-within:border-[#45923a] rounded-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar productos por nombre, código de barras o categoría..."
                value={searchTerm}
                onChange={(e) => {
                  if (!isDisabled) {
                    setSearchTerm(e.target.value);
                  }
                }}
                onFocus={() => {
                  // Al enfocar el input de búsqueda, quitar focus del input invisible del escáner
                  const scannerInput = document.querySelector('#scanner-input');
                  if (scannerInput) {
                    scannerInput.blur();
                  }
                }}
                className={`w-full pl-12 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none ${
                  !escanerActivo ? '' : 'bg-gray-50'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={escanerActivo || isDisabled}
              />
            </div>
          </div>
          
          {/* Toggle del Escáner y Botón de Historial */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Toggle del Escáner */}
            <div className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-gray-700" />
             
              <button
                onClick={() => {
                  if (!isDisabled) {
                    toggleEscaner();
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  escanerActivo ? 'bg-green-500' : 'bg-gray-300'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={escanerActivo ? 'Escáner activado' : 'Escáner desactivado'}
                disabled={isDisabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    escanerActivo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-medium ${escanerActivo ? 'text-green-600' : 'text-gray-500'}`}>
                {escanerActivo ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Botón de Historial de Ventas */}
            <button
              onClick={() => navigate('/ventas/historial')}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Ver historial de ventas"
              disabled={isDisabled}
            >
              <History size={16} />
              <span>Historial de Ventas</span>
            </button>
          </div>
        </div>
        
        {/* Controles del usuario */}
        <div className="flex items-center justify-end gap-3 ml-auto">
          {/* Reloj y Fecha */}
          <div className="flex items-center bg-[#093a4b] px-4 py-1.5 rounded-full text-white shadow-lg">
            <div className="flex items-center gap-3">
              {/* Icono de Sol o Luna */}
              <div className="flex items-center justify-center">
                {isDayTime(currentTime) ? (
                  <Sun className="w-6 h-6 text-yellow-300" />
                ) : (
                  <Moon className="w-6 h-6 text-blue-200" />
                )}
              </div>
              
              <div className="text-2xl font-extrabold leading-tight tracking-wide drop-shadow-sm">
                {formatTime(currentTime)}
              </div>
              <div className="flex flex-col">
                <div className="text-sm text-white/90 font-medium  uppercase tracking-wider">
                  {formatWeekday(currentTime)}
                </div>
                <div className="text-sm text-white/90 font-medium  ">
                  {formatDayMonth(currentTime)}
                </div>
              </div>
            </div>
          </div>

          {/* Notificaciones */}
          <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#45923a] rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">3</span>
            </span>
          </button>
          
          {/* Configuraciones */}
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Settings size={20} className="text-gray-600" />
          </button>
          
          {/* Separador */}
          <div className="w-px h-6 bg-gray-200"></div>
          
          {/* Usuario */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">
                {displayName}
              </span>
              <span className="text-xs text-gray-500">
                {userData?.role || 'User'}
              </span>
            </div>
            
            <div className="w-9 h-9 bg-[#45923a] rounded-full flex items-center justify-center text-white">
              <span className="text-sm font-medium">{userInitial}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarVentasDestock;