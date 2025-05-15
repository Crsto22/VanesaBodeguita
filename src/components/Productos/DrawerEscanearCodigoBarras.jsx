import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import IconoProductoCodigoBarras from '../../assets/Productos/IconoProductoCodigoBarras.svg'; // Adjust the path as needed
const DrawerEscanearCodigoBarras = ({ isOpen, onClose, onBarcodeScanned, colors }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      // Initialize scanner
      html5QrCode = new Html5Qrcode('barcode-scanner', {
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
              aspectRatio: window.innerWidth < 600 ? 1.0 : 3/1,
              experimentalFeatures: { useBarCodeDetectorIfSupported: true },
            },
            (decodedText) => {
              onBarcodeScanned(decodedText);
              stopScanner();
              onClose();
            },
            () => {} // Ignore NotFoundException
          );
        } catch (err) {
          setError('No se pudo iniciar la cámara. Por favor, permite el acceso a la cámara o verifica tu dispositivo.');
          setIsScanning(false);
        }
      };

      startScanner();
    }

    // Cleanup
    return () => {
      if (html5QrCode && isScanning) {
        try {
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
            scannerRef.current = null;
            setIsScanning(false);
          });
        } catch (err) {
          console.error('Error stopping scanner:', err);
        }
      }
    };
  }, [isOpen, onBarcodeScanned, onClose]);

  const stopScanner = () => {
    if (scannerRef.current && isScanning) {
      try {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
          scannerRef.current = null;
          setIsScanning(false);
        });
      } catch (err) {
        console.error('Error stopping scanner:', err);
        setError('Error al detener el escáner.');
        setIsScanning(false);
      }
    }
  };

  const handleBack = () => {
    stopScanner();
    onClose();
  };

  return (
<>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={handleBack} />
      )}
      <div
        className={`fixed inset-0 bg-white rounded-t-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '100vh',
          overflowY: 'auto',
          '--tw-ring-color': colors.primary,
        }}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Regresar
            </button>
            <button onClick={handleBack}>
              <X className="h-6 w-6 text-gray-500 hover:text-gray-700" />
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
    </>
  );
};

export default DrawerEscanearCodigoBarras;