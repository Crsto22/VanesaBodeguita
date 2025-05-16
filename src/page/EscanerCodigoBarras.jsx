import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Barcode,
  ArrowLeft,
  AlertCircle,
  Home
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import IconoProductoCodigoBarras from '../assets/Productos/IconoProductoCodigoBarras.svg';
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

  const stopScanner = () => {
    if (scannerRef.current && isScanning) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
          const videoElement = document.querySelector('#barcode-scanner video');
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
            videoElement.srcObject = null;
          }
          scannerRef.current = null;
          setIsScanning(false);
        }).catch((err) => {
          console.error('Error stopping scanner:', err);
          setError('Error al detener el escáner.');
          setIsScanning(false);
        });
      } catch (err) {
        console.error('Error stopping scanner:', err);
        setError('Error al detener el escáner.');
        setIsScanning(false);
      }
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) {
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
    }

    try {
      setIsScanning(true);
      setError('');
      setScannedProduct(null);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 300, height: 120 },
          aspectRatio: window.innerWidth < 600 ? 1.0 : 3 / 1,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        async (decodedText) => {
          try {
            // Look up product by barcode
            const foundProduct = productos.find(
              (producto) => producto.codigo_barras === decodedText
            );
            await scannerRef.current.stop();
            scannerRef.current.clear();
            const videoElement = document.querySelector('#barcode-scanner video');
            if (videoElement && videoElement.srcObject) {
              const stream = videoElement.srcObject;
              const tracks = stream.getTracks();
              tracks.forEach((track) => track.stop());
              videoElement.srcObject = null;
            }
            scannerRef.current = null;
            setIsScanning(false);

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

    // Cleanup
    return () => {
      stopScanner();
    };
  }, [currentUser, loading]);

  const handleBack = () => {
    stopScanner(); // Ensure camera is disabled
    navigate(-1); // Navigate back to previous page
  };

  const goToHome = () => {
    stopScanner(); // Disable camera
    navigate('/'); // Navigate to home page
  };

  const goToProducts = () => {
    stopScanner(); // Disable camera
    navigate('/productos'); // Navigate to products page
  };

  const handleScanAgain = () => {
    startScanner(); // Restart scanner
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Simple header with back button */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Regresar
              </button>
            </div>
            <div>
              <button
                onClick={goToHome}
                className="flex items-center px-4 py-2 bg-[#45923a] text-white rounded-full transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                Regresar al inicio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="min-h-screen bg-white flex flex-col p-4">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {error ? (
            <div className="bg-red-100 p-4 rounded-lg flex flex-col items-center max-w-lg w-full">
              <AlertCircle size={48} className="text-red-600 mb-2" />
              <p className="text-red-800 text-sm text-center">{error}</p>
              {!scannedProduct && (
                <button
                  onClick={goToProducts}
                  className="mt-4 px-4 py-2 bg-[#45923a] text-white rounded-full transition-colors"
                >
                  Gestionar Productos
                </button>
              )}
            </div>
          ) : scannedProduct ? (
            <div className="flex flex-col items-center max-w-lg w-full">
              <img
                src={scannedProduct.imagen}
                alt={scannedProduct.nombre}
                className="w-40 h-40 object-cover rounded-lg mb-4"
              />
              <h2 className="text-lg font-semibold text-gray-900">
                {scannedProduct.nombre}
              </h2>
              <p className="text-sm text-gray-600">
                Precio: S/ {scannedProduct.has_precio_alternativo ? scannedProduct.precio_alternativo : scannedProduct.precio}
                {scannedProduct.has_precio_alternativo && (
                  <span className="text-xs text-gray-500">
                    {' '}
                    (Motivo: {scannedProduct.motivo_precio_alternativo})
                  </span>
                )}
              </p>
              <button
                onClick={handleScanAgain}
                className="mt-4 px-4 py-2 bg-[#45923a] text-white rounded-full transition-colors"
              >
                Escanear otro producto
              </button>
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
          {!scannedProduct && !error && (
            <>
              <p className="mt-4 text-sm text-gray-600 text-center">
                Alinea el código de barras dentro del recuadro rojo para escanear.
              </p>
              {isScanning && (
                <p className="mt-2 text-sm text-gray-500">Escaneando...</p>
              )}
              <img
                src={IconoProductoCodigoBarras}
                alt="Icono de Código de Barras"
                className="mt-4 w-40"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EscanerCodigoBarras;