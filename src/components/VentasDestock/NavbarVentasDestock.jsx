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
  setEscanerActivo,
  onBack,
  isDisabled = false
}) => {
  // Hook de navegación
  const navigate = useNavigate();
  
  // Estado para la hora actual
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estado para controlar el timeout del input de búsqueda
  const [isSearchDisabledByTimeout, setIsSearchDisabledByTimeout] = useState(false);
  const [searchTimeoutId, setSearchTimeoutId] = useState(null);

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

  // Función para iniciar el timeout de búsqueda
  const startSearchTimeout = () => {
    // Limpiar timeout anterior si existe
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }
    
    // Crear nuevo timeout de 3 minutos (180000 ms)
    const timeoutId = setTimeout(() => {
      // Limpiar el texto de búsqueda
      setSearchTerm('');
      // Deshabilitar el input por timeout
      setIsSearchDisabledByTimeout(true);
      // Reactivar el escáner
      setEscanerActivo(true);
      // Enfocar el input invisible del escáner
      setTimeout(() => {
        const scannerInput = document.querySelector('#scanner-input');
        if (scannerInput) {
          scannerInput.focus();
        }
      }, 100);
    }, 180000); // 3 minutos
    
    setSearchTimeoutId(timeoutId);
  };

  // Función para cancelar el timeout de búsqueda
  const cancelSearchTimeout = () => {
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
      setSearchTimeoutId(null);
    }
  };

  // Función para reactivar el input de búsqueda
  const reactivateSearchInput = () => {
    setIsSearchDisabledByTimeout(false);
    cancelSearchTimeout();
  };

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutId) {
        clearTimeout(searchTimeoutId);
      }
    };
  }, [searchTimeoutId]);

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
                placeholder={
                  isSearchDisabledByTimeout 
                    ? "Input deshabilitado por inactividad. Haz clic para reactivar..." 
                    : "Buscar productos por nombre, código de barras o categoría..."
                }
                value={searchTerm}
                onChange={(e) => {
                  if (!isDisabled && !isSearchDisabledByTimeout) {
                    setSearchTerm(e.target.value);
                    // Reiniciar el timeout cada vez que el usuario escribe
                    startSearchTimeout();
                  }
                }}
                onFocus={() => {
                  // Si está deshabilitado por timeout, reactivarlo
                  if (isSearchDisabledByTimeout) {
                    reactivateSearchInput();
                    return;
                  }
                  
                  // Al enfocar el input de búsqueda, deshabilitar el escáner automáticamente
                  setEscanerActivo(false);
                  const scannerInput = document.querySelector('#scanner-input');
                  if (scannerInput) {
                    scannerInput.blur();
                  }
                  
                  // Iniciar timeout si hay texto
                  if (searchTerm.length > 0) {
                    startSearchTimeout();
                  }
                }}
                onBlur={() => {
                  // Si está deshabilitado por timeout, no hacer nada más
                  if (isSearchDisabledByTimeout) {
                    return;
                  }
                  
                  // Al salir del input de búsqueda, habilitar el escáner automáticamente
                  setEscanerActivo(true);
                  // Enfocar el input invisible del escáner después de un pequeño delay
                  setTimeout(() => {
                    const scannerInput = document.querySelector('#scanner-input');
                    if (scannerInput) {
                      scannerInput.focus();
                    }
                  }, 100);
                }}
                onKeyDown={(e) => {
                  // Reiniciar timeout con cualquier tecla presionada
                  if (!isDisabled && !isSearchDisabledByTimeout && searchTerm.length > 0) {
                    startSearchTimeout();
                  }
                }}
                onClick={() => {
                  // Si está deshabilitado por timeout, reactivarlo al hacer clic
                  if (isSearchDisabledByTimeout) {
                    reactivateSearchInput();
                  }
                }}
                className={`w-full pl-12 pr-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                  isDisabled || isSearchDisabledByTimeout 
                    ? 'opacity-50 cursor-pointer bg-gray-50' 
                    : ''
                }`}
                disabled={isDisabled}
                readOnly={isSearchDisabledByTimeout}
              />
            </div>
          </div>
          
          {/* Botón de Historial */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Indicador de estado del escáner */}
            <div className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-gray-700" />
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                escanerActivo 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {escanerActivo ? 'ESCÁNER ON' : 'ESCÁNER OFF'}
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