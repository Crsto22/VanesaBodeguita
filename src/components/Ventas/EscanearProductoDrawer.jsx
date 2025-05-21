import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, AlertCircle, Package, Check } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useProducts } from '../../context/ProductContext';
import IconoProductoCodigoBarras from '../../assets/Productos/IconoProductoCodigoBarras.svg';

const EscanearProductoDrawer = ({ isOpen, onClose, onSelectProducto }) => {
  const { productos, loading, obtenerCategoriaPorId } = useProducts();
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const handleSelectPrecio = (precio) => {
    if (!selectedProduct) return;
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
    setToast({ message: 'Producto agregado', type: 'success', visible: true });
    setPriceModalOpen(false);
    setSelectedProduct(null);
    onClose(); // Close the drawer after price selection, matching ProductosDrawer
  };

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen && !priceModalOpen) {
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
                if (loading) {
                  setToast({ message: 'Cargando productos, intenta de nuevo.', type: 'error', visible: true });
                  return;
                }
                const producto = productos.find((p) => p.codigo_barras === decodedText);
                if (producto) {
                  stopScanner(); // Stop scanner before proceeding
                  if (producto.has_precio_alternativo && producto.precio_alternativo) {
                    setSelectedProduct(producto);
                    setPriceModalOpen(true);
                  } else {
                    onSelectProducto({
                      id: producto.id,
                      nombre: producto.nombre,
                      cantidad: producto.tipo_unidad === 'kilogramo' ? 1 : 1,
                      precio_unitario: parseFloat(producto.precio),
                      subtotal: parseFloat(producto.precio).toFixed(2),
                      retornable: producto.retornable || false,
                      cantidad_retornable: producto.retornable && producto.tipo_unidad !== 'kilogramo' ? 1 : 0,
                      tipo_unidad: producto.tipo_unidad || 'unidad',
                      precio_referencia: producto.tipo_unidad === 'kilogramo' ? parseFloat(producto.precio) : null,
                      imagen: producto.imagen || null,
                    });
                    setToast({ message: 'Producto agregado', type: 'success', visible: true });
                    onClose(); // Close drawer after adding product, matching ProductosDrawer
                  }
                } else {
                  setToast({ message: 'Producto no encontrado', type: 'error', visible: true });
                }
              } catch (err) {
                console.error('Error during scan processing:', err);
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
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, priceModalOpen, productos, loading, onSelectProducto, onClose]);

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const handleBack = () => {
    stopScanner();
    setPriceModalOpen(false);
    setSelectedProduct(null);
    onClose();
  };

  return (
    <>
      {toast.visible && (
        <div className="fixed top-0 left-0 right-0 w-full z-[100] px-4 flex justify-center pointer-events-none">
          <div
            className={`max-w-md w-full shadow-lg rounded-lg transform transition-all duration-300 ease-in-out mt-4 pointer-events-auto ${
              toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            } ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
            role="alert"
            tabIndex="-1"
            aria-labelledby="header-notification"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p id="header-notification" className="text-white font-medium">
                    {toast.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {priceModalOpen && selectedProduct && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={handleBack}
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
                    onClick={handleBack}
                    className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
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
                    className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 group relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">Precio Normal</h5>
                      <p className="text-xs text-gray-500 mb-2">Precio estándar del producto</p>
                      <span className="text-xl font-bold text-green-600 mb-1">
                        S/{parseFloat(selectedProduct.precio).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-green-500 mt-1">
                        <Check className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>

                  <button
                    onClick={() => handleSelectPrecio(parseFloat(selectedProduct.precio_alternativo))}
                    className="flex-1 p-3 rounded-xl border border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 group relative"
                  >
                    <div className="flex flex-col items-center text-center">
                      <h5 className="font-bold text-gray-800">
                        Precio {selectedProduct.motivo_precio_alternativo || 'Alternativo'}
                      </h5>
                      <p className="text-xs text-gray-500 mb-2">Precio especial</p>
                      <span className="text-xl font-bold text-amber-600 mb-1">
                        S/{parseFloat(selectedProduct.precio_alternativo).toFixed(2)}
                        {selectedProduct.tipo_unidad === 'kilogramo' && <span className="text-xs ml-1">/kg</span>}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-amber-500 mt-1">
                        <Check className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-xl border-2 border-amber-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 ease-in-out ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleBack}
        />
      )}
      <div
        className={`fixed inset-0 bg-white rounded-t-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '100vh', overflowY: 'auto' }}
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

export default EscanearProductoDrawer;