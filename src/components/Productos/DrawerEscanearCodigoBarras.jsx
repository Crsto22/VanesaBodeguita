import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const DrawerEscanearCodigoBarras = ({ isOpen, onClose, onBarcodeScanned, colors }) => {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize the scanner
      const html5QrCode = new Html5Qrcode('barcode-scanner', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
      });

      scannerRef.current = html5QrCode;

      // Start scanning
      const startScanner = async () => {
        try {
          setIsScanning(true);
          await html5QrCode.start(
            { facingMode: 'environment' }, // Use rear camera
            {
              fps: 10,
              qrbox: { width: 250, height: 100 }, // Rectangular scan area for barcodes
            },
            (decodedText) => {
              // On successful scan, pass the barcode to the parent and close
              onBarcodeScanned(decodedText);
              html5QrCode.stop();
              setIsScanning(false);
              onClose();
            },
            (errorMessage) => {
              // Handle scan errors silently
              console.error('Scan error:', errorMessage);
            }
          );
        } catch (err) {
          setError('Error al iniciar la cámara. Por favor, permite el acceso a la cámara.');
          setIsScanning(false);
        }
      };

      startScanner();

      // Cleanup on unmount or close
      return () => {
        if (scannerRef.current && isScanning) {
          scannerRef.current.stop().catch((err) => {
            console.error('Error stopping scanner:', err);
          });
          scannerRef.current.clear();
        }
      };
    }
  }, [isOpen, onBarcodeScanned, onClose]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed inset-0 bg-white rounded-t-2xl shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
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
            <h2 className="text-lg font-semibold">Escanear Código de Barras</h2>
            <button onClick={onClose}>
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : (
              <div id="barcode-scanner" className="w-full max-w-md h-64" />
            )}
            <p className="mt-4 text-sm text-gray-600">
              Alinea el código de barras dentro del recuadro para escanear.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DrawerEscanearCodigoBarras;