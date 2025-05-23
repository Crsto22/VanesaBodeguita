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
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';

const EscanerCodigoBarras = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { productos, loading } = useProducts();
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  const stopScanner = async () => {
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
        setError('Error al detener el escáner.');
        setIsScanning(false);
      }
    }
  };

  const startScanner = async () => {
    // Ensure any existing scanner is stopped
    await stopScanner();

    // Clear the scanner container
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
            const foundProduct = productos.find(
              (producto) => producto.codigo_barras === decodedText
            );
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

  useEffect(() => {
    if (!currentUser) {
      setError('Debes iniciar sesión para usar el escáner.');
      setIsScanning(false);
      return;
    }

    if (!loading) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [currentUser, loading]);

  const handleBack = () => {
    stopScanner();
    navigate(-1);
  };

  const goToHome = () => {
    stopScanner();
    navigate('/');
  };

  const goToProducts = () => {
    stopScanner();
    navigate('/productos');
  };

  const handleScanAgain = async () => {
    setScannedProduct(null);
    setError('');
    await startScanner();
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex justify-between h-16 items-center">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Regresar"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">Escáner de Productos</h1>
            <button
              onClick={goToHome}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Ir a inicio"
            >
              <Home className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 max-w-lg mx-auto w-full">
        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center w-full mt-4 shadow-sm">
            <div className=" p-3 mb-4">
            <img
                  src={EscanerNoEscaneo}
                  alt="Icono de Código de Barras"
                  className="w-32 "
                />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Ocurrió un error</h2>
            <p className="text-sm text-gray-600 text-center mb-6">{error}</p>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleScanAgain}
                className="w-full py-3 bg-[#45923a] text-white rounded-xl font-medium flex items-center justify-center transition hover:bg-indigo-700 shadow-sm"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Escanear otro producto
              </button>

              {!scannedProduct && (
                <button
                  onClick={goToProducts}
                  className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium transition hover:bg-gray-50 shadow-sm"
                >
                  Gestionar Productos
                </button>
              )}
            </div>
          </div>
        ) : scannedProduct ? (
          <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-4">
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 rounded-2xl p-4 mb-6 w-full flex justify-center">
                <img
                  src={scannedProduct.imagen}
                  alt={scannedProduct.nombre}
                  className="w-40 h-40 object-contain rounded-lg"
                />
              </div>

              <div className="bg-indigo-50 rounded-full px-4 py-1 mb-2">
                <span className="text-xs font-medium text-indigo-600">Producto Escaneado</span>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                {scannedProduct.nombre}
              </h2>

              <div className="w-full bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-gray-500">Precio regular:</span>
                  <div className="flex items-end">
                    <span className="text-sm text-indigo-600 mr-1 mb-1">S/</span>
                    <span className="text-2xl font-bold text-indigo-600">{scannedProduct.precio}</span>
                  </div>
                </div>

                {scannedProduct.has_precio_alternativo && (
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Precio {scannedProduct.motivo_precio_alternativo}:</span>
                    </div>
                    <div className="flex items-end">
                      <span className="text-sm text-green-600 mr-1 mb-1">S/</span>
                      <span className="text-2xl font-bold text-green-600">{scannedProduct.precio_alternativo}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleScanAgain}
                className="w-full py-3 bg-[#45923a] text-white rounded-xl font-medium flex items-center justify-center transition hover:bg-indigo-700 shadow-sm"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Escanear otro producto
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative w-full aspect-square max-w-md rounded-2xl overflow-hidden bg-black shadow-md mt-4 border-2 border-indigo-500">
              <div id="barcode-scanner" ref={scannerContainerRef} className="w-full h-full" />

              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="w-[300px] h-[120px] border-2 border-indigo-400 rounded-md bg-transparent relative"
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
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-400" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-400" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-400" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-400" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center">
                  {isScanning ? (
                    <>
                      <div className="h-3 w-3 rounded-full bg-green-400 mr-2 animate-pulse" />
                      <p className="text-white text-sm font-medium">Escaneando...</p>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full bg-yellow-400 mr-2" />
                      <p className="text-white text-sm font-medium">Preparando cámara...</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 w-full mt-4 shadow-sm border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className=" p-4 mb-4">
                <img
                  src={Escaner}
                  alt="Icono de Código de Barras"
                  className="w-32 "
                />
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Escáner de Código de Barras
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Alinea el código de barras del producto dentro del recuadro para escanearlo automáticamente.
                </p>

               
              </div>
            </div>
          </>
        )}
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