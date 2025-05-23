import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Package, Check } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useProducts } from '../../context/ProductContext';
import Escaner from '../../assets/Productos/Escaner.svg';
import EscanerNoEscaneo from '../../assets/Productos/EscanerNoEscaneo.svg';

const EscanearProductoDrawer = ({ isOpen, onClose, onSelectProducto, setError }) => {
  const { productos, loading, obtenerCategoriaPorId } = useProducts();
  const [isScanning, setIsScanning] = useState(false);
  const [localError, setLocalError] = useState('');
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
              setSelectedProduct(foundProduct);
              if (foundProduct.has_precio_alternativo && foundProduct.precio_alternativo) {
                setPriceModalOpen(true);
              } else {
                const precio = parseFloat(foundProduct.precio);
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
              }
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

  const handleSelectPrecio = (precio) => {
    if (selectedProduct) {
      onSelectProducto({
        id: selectedProduct.id,
        nombre: selectedProduct.nombre,
        cantidad: selectedProduct.tipo_unidad === 'kilogramo' ? 1 : 1,
        precio_unitario: parseFloat(precio),
        subtotal: parseFloat(precio).toFixed(2),
        retornable: selectedProduct.retornable || false,
        cantidad_retornable: selectedProduct.retornable && selectedProduct.tipo_unidad !== 'kilogramo' ? 1 : 0,
        tipo_unidad: selectedProduct.tipo_unidad || 'unidad',
        precio_referencia: selectedProduct.tipo_unidad === 'kilogramo' ? parseFloat(selectedProduct.precio) : null,
        imagen: selectedProduct.imagen || null,
      });
    }
    setPriceModalOpen(false);
    onClose();
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

        {priceModalOpen && selectedProduct && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
              onClick={() => setPriceModalOpen(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[95] p-4">
              <div 
                className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden animate-in fade-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-800">Seleccionar Precio</h3>
                    <button
                      onClick={() => setPriceModalOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {selectedProduct.imagen ? (
                          <img
                            src={selectedProduct.imagen}
                            alt={selectedProduct.nombre}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{selectedProduct.nombre}</h4>
                        <span className="text-xs text-gray-500">
                          {obtenerCategoriaPorId(selectedProduct.categoria_ref)?.nombre || 'Sin categoría'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleSelectPrecio(selectedProduct.precio)}
                      className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-[#45923a] hover:bg-[#f9fdf8] transition-all focus:outline-none focus:ring-2 focus:ring-[#45923a] group relative"
                    >
                      <div className="flex flex-col items-center text-center">
                        <h5 className="font-bold text-gray-800">Precio Normal</h5>
                        <p className="text-xs text-gray-500 mb-2">
                          Precio estándar del producto
                        </p>
                        <span className="text-xl font-bold text-[#45923a] mb-1">
                          S/{parseFloat(selectedProduct.precio).toFixed(2)}
                          {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                        </span>
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#45923a] mt-1">
                          <Check className="h-4 w-4 text-[#45923a] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-xl border-2 border-[#45923a] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </button>
                    
                    <button
                      onClick={() => handleSelectPrecio(parseFloat(selectedProduct.precio_alternativo))}
                      className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-[#ffa40c] hover:bg-[#fff8e6] transition-all focus:outline-none focus:ring-2 focus:ring-[#ffa40c] group relative"
                    >
                      <div className="flex flex-col items-center text-center">
                        <h5 className="font-bold text-gray-800">
                          Precio {selectedProduct.motivo_precio_alternativo || 'Alternativo'}
                        </h5>
                        <p className="text-xs text-gray-500 mb-2">
                          Precio especial
                        </p>
                        <span className="text-xl font-bold text-[#ffa40c] mb-1">
                          S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}
                          {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                        </span>
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-[#ffa40c] mt-1">
                          <Check className="h-4 w-4 text-[#ffa40c] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="absolute inset-0 rounded-xl border-2 border-[#ffa40c] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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
        .animate-in {
          animation: animateIn 0.3s ease-in-out;
        }
        @keyframes animateIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default EscanearProductoDrawer;