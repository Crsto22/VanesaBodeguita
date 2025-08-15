import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Barcode,
  ArrowLeft,
  AlertCircle,
  Home,
  Scan,
  RefreshCw
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Escaner from '../assets/Productos/Escaner.svg';
import EscanerNoEscaneo from '../assets/Productos/EscanerNoEscaneo.svg';
import EscanerPistola from '../assets/Productos/EscanerPistola.svg';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

const EscanerCodigoBarras = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { loading, obtenerProductoPorCodigoBarrasDirecto } = useProducts();
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [countdown, setCountdown] = useState(0);
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const isProcessingRef = useRef(false);
  const countdownTimerRef = useRef(null);

  const stopScanner = async (silent = false) => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        const videoElement = document.querySelector('#barcode-scanner video');
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject;
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
          videoElement.srcObject = null;
        }
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
        if (!silent) {
          setError('Error al detener el escáner.');
        }
        scannerRef.current = null;
        setIsScanning(false);
      }
    } else {
      setIsScanning(false);
    }
  };

  const startCountdown = (seconds) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    setCountdown(seconds);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          handleScanAgain();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(0);
  };

  const handleProcessBarcode = async (code) => {
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;
    try {
      if (!/^\d+$/.test(code)) {
        setError('Código de barras inválido');
        // Timer de 3 segundos para código inválido
        startCountdown(3);
        return;
      }
      const foundProduct = await obtenerProductoPorCodigoBarrasDirecto(code);
      if (foundProduct) {
        setScannedProduct(foundProduct);
        setError('');
        // Timer de 5 segundos cuando encuentra producto
        startCountdown(5);
      } else {
        setError('No se encontró un producto con ese código de barras.');
        // Timer de 3 segundos cuando no encuentra producto
        startCountdown(3);
      }
    } catch (err) {
      console.error('Error processing barcode:', err);
      setError('Error al procesar el código escaneado.');
      // Timer de 3 segundos para errores
      startCountdown(3);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const startScanner = async () => {
    await stopScanner(true); // silent = true para evitar errores

    if (scannerContainerRef.current) {
      scannerContainerRef.current.innerHTML = '';
    }

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

    try {
      setIsScanning(true);
      setError('');
      setScannedProduct(null);
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
            const foundProduct = await obtenerProductoPorCodigoBarrasDirecto(decodedText);
            await stopScanner();
            if (foundProduct) {
              setScannedProduct(foundProduct);
            } else {
              setError('No se encontró un producto con ese código de barras.');
            }
          } catch (err) {
            console.error('Error during scan cleanup:', err);
            setError('Error al procesar el código escaneado.');
            setIsScanning(false);
          }
        },
        () => {} // Ignore NotFoundException
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('No se pudo iniciar la cámara. Por favor, permite el acceso a la cámara o verifica tu dispositivo.');
      setIsScanning(false);
    }
  };

  // useEffect para detectar si es dispositivo móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // Consideramos móvil si es menor a 768px
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setError('Debes iniciar sesión para usar el escáner.');
      setIsScanning(false);
      return;
    }

    // Si es móvil, usar cámara. Si es desktop, usar pistola escáner
    if (isMobile && !loading) {
      startScanner();
    } else if (!isMobile) {
      stopScanner(true); // silent = true
      // Focus en el input oculto para capturar la pistola escáner
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus({ preventScroll: true });
        }
      }, 100);
    }

    return () => {
      stopScanner(true);
    };
  }, [currentUser, loading, isMobile]);

  // useEffect para manejar la entrada de la pistola escáner en desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isMobile && e.key === 'Enter' && barcodeInput.trim()) {
        e.preventDefault();
        handleProcessBarcode(barcodeInput.trim());
        setBarcodeInput('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [barcodeInput, isMobile]);

  // useEffect para mantener el focus en el input cuando está en modo desktop
  useEffect(() => {
    const handleGlobalClick = () => {
      if (!isMobile && barcodeInputRef.current) {
        barcodeInputRef.current.focus({ preventScroll: true });
      }
    };

    if (!isMobile) {
      document.addEventListener('click', handleGlobalClick);
      return () => {
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [isMobile]);

  const handleBack = () => {
    clearCountdown();
    stopScanner(true);
    navigate(-1);
  };

  const goToHome = () => {
    clearCountdown();
    stopScanner(true);
    navigate('/');
  };

  const goToProducts = () => {
    clearCountdown();
    stopScanner(true);
    navigate('/productos');
  };

  const handleScanAgain = async () => {
    clearCountdown();
    setScannedProduct(null);
    setError('');
    isProcessingRef.current = false;
    
    if (isMobile) {
      await startScanner();
    } else {
      // En modo desktop (pistola), solo limpiamos y enfocamos
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus({ preventScroll: true });
      }
    }
  };

  // useEffect para limpiar el countdown al desmontar
  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-100 font-sans text-gray-900 flex flex-col overflow-hidden">
      <header className="bg-white shadow-md sticky top-0 z-10 flex-shrink-0">
        <div className="max-w-full px-3 sm:px-4">
          <div className="flex justify-between h-12 sm:h-16 items-center">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Regresar"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
            </button>
            <h1 className="text-base sm:text-lg font-medium text-gray-900">Escáner de Productos</h1>
            <button
              onClick={goToHome}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Ir a inicio"
            >
              <Home className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 w-full overflow-auto" style={{ height: 'calc(100vh - 3rem)', maxHeight: 'calc(100vh - 3rem)' }}>
        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center w-full max-w-2xl mx-auto shadow-sm">
            <div className="p-2 sm:p-3 mb-3 sm:mb-4">
              <img
                src={EscanerNoEscaneo}
                alt="Icono de Código de Barras"
                className="w-20 sm:w-32"
              />
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Ocurrió un error</h2>
            <p className="text-xs sm:text-sm text-gray-600 text-center mb-3 sm:mb-4">{error}</p>
            {countdown > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-3 sm:mb-4 w-full">
                <p className="text-xs sm:text-sm text-blue-600 text-center">
                  Reintentando automáticamente en <span className="font-bold">{countdown}</span> segundo{countdown !== 1 ? 's' : ''}...
                </p>
              </div>
            )}
            <div className="w-full flex flex-col gap-2 sm:gap-3">
              <button
                onClick={handleScanAgain}
                className="w-full py-2 sm:py-3 bg-[#45923a] text-white rounded-lg sm:rounded-xl font-medium flex items-center justify-center transition hover:bg-[#3a7a31] shadow-sm text-sm sm:text-base"
              >
                <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Escanear otro producto
              </button>

              {!scannedProduct && (
                <button
                  onClick={goToProducts}
                  className="w-full py-2 sm:py-3 bg-white border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-medium transition hover:bg-gray-50 shadow-sm text-sm sm:text-base"
                >
                  Gestionar Productos
                </button>
              )}
            </div>
          </div>
        ) : scannedProduct ? (
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-start lg:gap-6 h-full">
            {/* Imagen del producto */}
            <div className="w-full lg:w-1/2 mb-4 lg:mb-0">
              <div className="bg-white rounded-2xl p-3 md:p-4 shadow-lg border border-gray-200 h-full">
                <img
                  src={scannedProduct.imagen}
                  alt={scannedProduct.nombre}
                  className="w-full h-48 sm:h-56 md:h-64 lg:h-80 xl:h-96 object-contain rounded-xl"
                />
              </div>
            </div>

            {/* Datos del producto */}
            <div className="w-full lg:w-1/2 bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200 flex flex-col">
              {/* Badge */}
              <div className="inline-flex bg-indigo-50 rounded-full px-4 py-2 mb-4 self-start">
                <span className="text-sm font-medium text-indigo-600">Producto Escaneado</span>
              </div>

              {/* Título del producto */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {scannedProduct.nombre}
              </h2>

              {/* Contenedor de precios */}
              <div className="bg-gray-50 rounded-2xl p-4 md:p-5 mb-4 space-y-3 flex-grow">
                {/* Precio regular */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                  <span className="text-sm md:text-base font-bold text-gray-700">
                    Precio regular:
                  </span>
                  <div className="flex items-end">
                    <span className="text-sm text-indigo-600 mr-1 mb-1">S/</span>
                    <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-indigo-600">
                      {Number(scannedProduct.precio).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Precio alternativo */}
                {scannedProduct.has_precio_alternativo && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                      <span className="text-sm md:text-base font-bold text-gray-700">
                        Precio {scannedProduct.motivo_precio_alternativo}:
                      </span>
                      <div className="flex items-end">
                        <span className="text-sm text-green-600 mr-1 mb-1">S/</span>
                        <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600">
                          {Number(scannedProduct.precio_alternativo).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown */}
              {countdown > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4">
                  <p className="text-sm md:text-base text-green-600 text-center">
                    Escaneando automáticamente en{' '}
                    <span className="font-bold text-lg md:text-xl">
                      {countdown}
                    </span>{' '}
                    segundo{countdown !== 1 ? 's' : ''}...
                  </p>
                </div>
              )}

              {/* Botón de escanear */}
              <button
                onClick={handleScanAgain}
                className="w-full py-3 md:py-4 bg-[#45923a] text-white rounded-2xl font-semibold text-sm md:text-base 
                           flex items-center justify-center gap-3 transition-all duration-200 
                           hover:bg-[#3a7a31] active:bg-[#2d5e26] active:scale-[0.98] 
                           shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-200"
              >
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
                Escanear otro producto
              </button>
            </div>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="w-full max-w-4xl mx-auto flex flex-col h-full gap-4">
                {/* Interfaz de cámara para móviles */}
                <div className="relative w-full flex-1 rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-md border-2 border-indigo-500 min-h-[300px]">
                  <div id="barcode-scanner" ref={scannerContainerRef} className="w-full h-full" />

                  {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div
                        className="w-[250px] h-[100px] sm:w-[300px] sm:h-[120px] border-2 border-indigo-400 rounded-md bg-transparent relative"
                        style={{
                          boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)',
                        }}
                      >
                        <div
                          className="absolute left-0 top-0 h-[2px] bg-indigo-400 w-full"
                          style={{
                            animation: 'scanline 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }}
                        />
                        <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-indigo-400" />
                        <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-indigo-400" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-indigo-400" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-indigo-400" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
                    <div className="flex items-center">
                      {isScanning ? (
                        <>
                          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-400 mr-2 animate-pulse" />
                          <p className="text-white text-xs sm:text-sm font-medium">Escaneando...</p>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-yellow-400 mr-2" />
                          <p className="text-white text-xs sm:text-sm font-medium">Preparando cámara...</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 w-full shadow-sm border border-gray-100 flex-shrink-0">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-1 sm:p-2 mb-2 sm:mb-3">
                      <img
                        src={Escaner}
                        alt="Icono de Código de Barras"
                        className="w-16 sm:w-20"
                      />
                    </div>
                    <h2 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                      Escáner de Código de Barras con Cámara
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Alinea el código de barras del producto dentro del recuadro para escanearlo automáticamente.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Interfaz de pistola escáner para desktop */}
                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 mb-4">
                      <img
                        src={EscanerPistola}
                        alt="Icono de Pistola Escáner"
                        className="w-32"
                      />
                    </div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                      Escáner con Pistola de Código de Barras
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Usa tu pistola escáner para leer los códigos de barras. Los productos aparecerán automáticamente.
                    </p>
                    <div className="bg-[#45923a]/10 border border-[#45923a]/20 rounded-xl p-4 max-w-md">
                      <div className="flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-[#45923a] mr-2 animate-pulse" />
                        <p className="text-[#45923a] text-sm font-medium">Listo para escanear</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Input oculto para capturar la pistola escáner en desktop */}
        <input
          ref={barcodeInputRef}
          type="text"
          inputMode="none"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none"
          autoComplete="off"
        />
      </main>

      <style jsx global>{`
        @keyframes scanline {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(120px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EscanerCodigoBarras;