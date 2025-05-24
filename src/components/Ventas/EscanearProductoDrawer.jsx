
import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Package, Scan } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useProducts } from '../../context/ProductContext';
import Escaner from '../../assets/Productos/Escaner.svg';
import EscanerNoEscaneo from '../../assets/Productos/EscanerNoEscaneo.svg';

const EscanearProductoDrawer = ({ isOpen, onClose, onSelectProducto, setError }) => {
  const { productos, loading } = useProducts();
  const [isScanning, setIsScanning] = useState(false);
  const [localError, setLocalError] = useState('');
  const scannerRef = useRef(null);
  const scannerContainerRef = useRef(null);

  const COLORS = {
    primary: '#45923a',
    secondary: '#ffa40c',
    dark: '#2c5b24',
    light: '#f9fdf8',
    background: '#f5f7fa',
    gradient: 'linear-gradient(135deg, #45923a 0%, #3a7d30 100%)',
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        const videoElement = document.querySelector('#barcode-scanner-drawer video');
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
        setLocalError('Error al detener el escáner.');
      }
    }
  };

  const startScanner = async () => {
    await stopScanner();

    if (scannerContainerRef.current) {
      scannerContainerRef.current.innerHTML = '';
    }

    const html5QrCode = new Html5Qrcode('barcode-scanner-drawer', {
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
      setLocalError('');
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
              const precio = foundProduct.has_precio_alternativo && foundProduct.precio_alternativo
                ? parseFloat(foundProduct.precio_alternativo)
                : parseFloat(foundProduct.precio);
              onSelectProducto({
                id: foundProduct.id,
                nombre: foundProduct.nombre,
                cantidad: foundProduct.tipo_unidad === 'kilogramo' ? 1 : 1,
                precio_unitario: precio,
                subtotal: precio.toFixed(2),
                retornable: foundProduct.retornable || false,
                cantidad_retornable: foundProduct.retornable && foundProduct.tipo_unidad !== 'kilogramo' ? 1 : 0,
                tipo_unidad: foundProduct.tipo_unidad || 'unidad',
                precio_referencia: foundProduct.tipo_unidad === 'kilogramo' ? parseFloat(foundProduct.precio) : null,
                imagen: foundProduct.imagen || null,
              });
              onClose();
            } else {
              setError('No se encontró un producto con ese código de barras.');
              onClose();
            }
          } catch (err) {
            console.error('Error during scan cleanup:', err);
            setLocalError('Error al procesar el código escaneado.');
            setIsScanning(false);
          }
        },
        () => {} // Ignore NotFoundException
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setLocalError('No se pudo iniciar la cámara. Por favor, permite el acceso a la cámara o verifica tu dispositivo.');
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen && !loading) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, loading]);

  const handleScanAgain = async () => {
    setLocalError('');
    await startScanner();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-0 z-[50] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } bg-gradient-to-b from-white to-gray-50 flex flex-col h-full`}
      >
        <div className="flex items-center justify-between py-4 px-5 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Escanear Producto</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-safe">
          {localError ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <img
                src={EscanerNoEscaneo}
                alt="Error al escanear"
                className="w-32 mb-4"
              />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Ocurrió un error</h3>
              <p className="text-sm text-gray-600 mb-6">{localError}</p>
              <button
                onClick={handleScanAgain}
                className="w-full max-w-md py-3 bg-[#45923a] text-white rounded-xl font-medium flex items-center justify-center transition hover:bg-[#3a7d30] shadow-sm"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-lg mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-md mt-4 border-2 border-[#45923a]">
                <div id="barcode-scanner-drawer" ref={scannerContainerRef} className="w-full h-full" />
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="w-[300px] h-[120px] border-2 border-[#45923a] rounded-md bg-transparent relative"
                      style={{ boxShadow: '0 0 20px rgba(69, 146, 58, 0.3)' }}
                    >
                      <div
                        className="absolute left-0 top-0 h-[2px] bg-[#45923a] w-full"
                        style={{ animation: 'scanline 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                      />
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#45923a]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#45923a]" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#45923a]" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#45923a]" />
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

              <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-auto mt-4 shadow-sm border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={Escaner}
                    alt="Icono de Código de Barras"
                    className="w-32 mb-4"
                  />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Escáner de Código de Barras
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Alinea el código de barras del producto dentro del recuadro para escanearlo automáticamente.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
    </>
  );
};

export default EscanearProductoDrawer;

