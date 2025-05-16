import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  CreditCard,
  Users,
  Barcode,
  Package,
  Bell,
  Menu,
  X,
  Search,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import IconoInicio from "../assets/IconoInicio.svg";
import IconoProductoCodigoBarras from '../assets/Productos/IconoProductoCodigoBarras.svg';

const EscanerCodigoBarras = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Opciones del menú principal - Accesos rápidos
  const quickAccessOptions = [
    { 
      id: 'ventas', 
      title: 'Ventas', 
      icon: <ShoppingCart className="h-6 w-6" />, 
      color: 'bg-emerald-500', 
      description: 'Registrar ventas y ver historial',
      path: '/ventas'
    },
    { 
      id: 'deudas', 
      title: 'Pagar Deudas', 
      icon: <CreditCard className="h-6 w-6" />, 
      color: 'bg-amber-500', 
      description: 'Gestionar pagos pendientes',
      path: '/deudas'
    },
    { 
      id: 'clientes', 
      title: 'Clientes', 
      icon: <Users className="h-6 w-6" />, 
      color: 'bg-blue-500', 
      description: 'Administrar base de clientes',
      path: '/clientes'
    },
    { 
      id: 'escaner', 
      title: 'Escáner de Códigos', 
      icon: <Barcode className="h-6 w-6" />, 
      color: 'bg-violet-500', 
      description: 'Consultar precios por código de barras',
      path: '/escaner'
    },
    { 
      id: 'productos', 
      title: 'Productos', 
      icon: <Package className="h-6 w-6" />, 
      color: 'bg-rose-500', 
      description: 'Inventario y catálogo',
      path: '/productos'
    },
  ];

  // Función mejorada para detener el escáner y liberar la cámara por completo
  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        // Primero detenemos el escáner
        await scannerRef.current.stop();
        console.log('Scanner stopped');
        
        // Limpiamos el elemento del DOM
        scannerRef.current.clear();
        console.log('Scanner cleared');
        
        // Detenemos específicamente todos los tracks de video
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach((video) => {
          if (video.srcObject) {
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach((track) => {
              track.stop();
              console.log('Track stopped:', track.kind);
            });
            video.srcObject = null;
            console.log('Video source cleared');
          }
        });
        
        // También buscamos específicamente el video del escáner
        const videoElement = document.querySelector('#barcode-scanner video');
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach((track) => {
            track.stop();
            console.log('Scanner track stopped:', track.kind);
          });
          videoElement.srcObject = null;
          console.log('Scanner video source cleared');
        }
        
        // Limpiamos la referencia
        scannerRef.current = null;
        setIsScanning(false);
        console.log('Camera completely disabled');
      } catch (err) {
        console.error('Error stopping scanner:', err);
        setError('Error al detener el escáner.');
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    setAppear(true);

    // Initialize scanner
    const html5QrCode = new Html5Qrcode('barcode-scanner', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
      ],
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    // Start scanning
    const startScanner = async () => {
      try {
        setIsScanning(true);
        setError('');
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 300, height: 120 },
            aspectRatio: window.innerWidth < 600 ? 1.0 : 3 / 1,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          },
          async (decodedText) => {
            try {
              // Handle scanned barcode
              console.log('Barcode scanned:', decodedText);
              await stopScanner();
              // Aquí puedes agregar lógica para procesar el código de barras
            } catch (err) {
              console.error('Error during scan cleanup:', err);
              setError('Error al procesar el código escaneado.');
              setIsScanning(false);
            }
          },
          () => {} // Ignore NotFoundException
        );
      } catch (err) {
        setError('No se pudo iniciar la cámara. Por favor, permite el acceso a la cámara o verifica tu dispositivo.');
        setIsScanning(false);
      }
    };

    startScanner();

    // Cleanup on component unmount
    return () => {
      stopScanner();
    };
  }, []);

  // Función para manejar el botón de regresar
  const handleBack = async () => {
    console.log('Regresar: Deteniendo cámara antes de navegar');
    // Aseguramos que la cámara se deshabilite completamente antes de navegar
    await stopScanner();
    // Esperamos un momento para asegurar que todos los recursos se liberen
    setTimeout(() => {
      console.log('Navegando a la página anterior');
      navigate(-1); // Navigate back to previous page
    }, 100);
  };

  const handleOptionClick = async (path) => {
    console.log('Navegando a otra opción: Deteniendo cámara');
    // Aseguramos que el escáner se detenga antes de navegar
    await stopScanner();
    navigate(path);
    setMenuOpen(false);
  };

  // Añadimos listeners para detectar cuando el componente pierde el foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isScanning) {
        console.log('Página oculta: Deteniendo cámara');
        stopScanner();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header component */}
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        notifications={notifications}
      />

      {/* Sidebar component */}
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={handleOptionClick}
        logo={Logo}
      />

      {/* Main content area */}
      <div className="min-h-screen bg-white flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Regresar
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {error ? (
            <div className="bg-red-100 p-4 rounded-lg flex flex-col items-center">
              <AlertCircle size={48} className="text-red-600 mb-2" />
              <p className="text-red-800 text-sm text-center">{error}</p>
            </div>
          ) : (
            <div className="relative w-full max-w-lg h-80 rounded-lg overflow-hidden bg-gray-900">
              <div id="barcode-scanner" className="w-full h-full" />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-[300px] h-[120px] border-2 border-red-500 rounded-md bg-transparent"
                    style={{
                      boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)',
                      background: 'rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <div className="absolute top-0 left-0 w-8 h-2 border-t-2 border-l-2 border-red-500" />
                    <div className="absolute top-0 right-0 w-8 h-2 border-t-2 border-r-2 border-red-500" />
                    <div className="absolute bottom-0 left-0 w-8 h-2 border-b-2 border-l-2 border-red-500" />
                    <div className="absolute bottom-0 right-0 w-8 h-2 border-b-2 border-r-2 border-red-500" />
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="mt-4 text-sm text-gray-600 text-center">
            Alinea el código de barras dentro del recuadro rojo para escanear.
          </p>
          {isScanning && !error && (
            <p className="mt-2 text-sm text-gray-500">Escaneando...</p>
          )}
          <img
            src={IconoProductoCodigoBarras}
            alt="Icono de Código de Barras"
            className="mt-4 w-40"
          />
        </div>
      </div>
    </div>
  );
};

export default EscanerCodigoBarras;