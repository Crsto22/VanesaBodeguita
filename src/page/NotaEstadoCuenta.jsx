import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVentas } from '../context/VentasContext';
import { useClientes } from '../context/ClientesContext';
import { Loader2, ArrowLeft, Printer, Download, Plus } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import { toPng } from 'html-to-image';

const NotaEstadoCuenta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerVentasPorCliente, obtenerDeudaTotalPorCliente } = useVentas();
  const { obtenerClientePorId } = useClientes();
  const [ventas, setVentas] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showProductsOnly, setShowProductsOnly] = useState(false);
  const estadoCuentaRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const clienteData = await obtenerClientePorId(id);
        if (!clienteData) {
          throw new Error('Cliente no encontrado');
        }
        setCliente(clienteData);

        const ventasData = await obtenerVentasPorCliente(id, false);
        const sortedVentas = ventasData.sort((a, b) => 
          new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        );
        setVentas(sortedVentas);
      } catch (err) {
        console.error('ERROR AL OBTENER DATOS:', err);
        setError(err.message || 'ERROR AL CARGAR EL ESTADO DE CUENTA');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, obtenerVentasPorCliente, obtenerClientePorId]);

  const handlePrint = () => {
    if (window.print) {
      setTimeout(() => {
        window.print();
      }, 500);
    } else {
      alert('LA FUNCIÓN DE IMPRIMIR NO ESTÁ DISPONIBLE EN ESTE DISPOSITIVO. USE LA OPCIÓN DE DESCARGAR.');
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const dataUrl = await toPng(estadoCuentaRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        quality: 1
      });

      const link = document.createElement('a');
      link.download = `ESTADO-CUENTA-${id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('ERROR AL GENERAR EL ESTADO DE CUENTA:', error);
      alert('ERROR AL GENERAR EL ESTADO DE CUENTA. INTENTE NUEVAMENTE.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNuevaVenta = () => {
    navigate('/ventas');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const totalDeuda = obtenerDeudaTotalPorCliente(id);

  const formatDate = (isoString) => {
    const fecha = new Date(isoString);
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).toUpperCase();
  };

  const formatDateTime = (isoString) => {
    const fecha = new Date(isoString);
    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).toUpperCase();
  };

  const formatProductNamesForPendiente = (productos) => {
    if (productos.length === 1) {
      // Si solo hay un producto, mostrar las primeras 2 palabras
      return productos[0].nombre.split(' ').slice(0, 2).join(' ').toUpperCase();
    } else if (productos.length === 2) {
      // Si hay 2 productos, mostrar la primera palabra completa de cada uno
      const firstProduct = productos[0].nombre.split(' ')[0].toUpperCase();
      const secondProduct = productos[1].nombre.split(' ')[0].toUpperCase();
      return `${firstProduct} Y ${secondProduct}`;
    } else {
      // Si hay más de 2 productos, mostrar la primera palabra completa de los primeros 2 y la cantidad restante
      const firstProduct = productos[0].nombre.split(' ')[0].toUpperCase();
      const secondProduct = productos[1].nombre.split(' ')[0].toUpperCase();
      const remaining = productos.length - 2;
      return `${firstProduct}, ${secondProduct} Y ${remaining} MÁS`;
    }
  };

  const truncateProductNames = (productos) => {
    const names = productos.map(p => p.nombre.toUpperCase()).join(', ');
    return names.length > 20 ? names.substring(0, 17) + '...' : names;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          <p className="mt-1 text-gray-600 font-medium text-lg">Cargando estado de cuenta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium text-lg">{error}</p>
          <button
            onClick={handleBack}
            className="mt-1 flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-lg"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => (
    <div className="p-3 bg-white w-[302px] font-mono text-black leading-relaxed">
      <div className="text-center mb-3">
        <img
          src={Logo}
          alt="LOGO"
          className="mx-auto mb-2 max-w-[80px] h-auto"
        />
        <div className="text-2xl font-black uppercase font-consolamono-bold">ESTADO DE CUENTA</div>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="mb-3 space-y-1">
        <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
          <span>CLIENTE: {cliente.nombre.toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
          <span>FECHA: {formatDate(new Date())}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="mb-3">
        <div className="text-base font-black mb-2 text-center font-consolamono-bold">DETALLE DE DEUDAS</div>
        {ventas.length === 0 ? (
          <div className="text-center text-base font-black font-consolamono-bold">NO HAY PAGOS PENDIENTES.</div>
        ) : (
          ventas.map((venta, index) => (
            <div key={venta.id} className="mb-2">
              {!showProductsOnly && (
                <div className="flex justify-between text-base font-black font-consolamono-bold">
                  <span>VENTA {index + 1}</span>
                  <span>{formatDate(venta.fecha_creacion)}</span>
                </div>
              )}
              {showProductsOnly ? (
                venta.monto_pagado > 0 ? (
                  <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
                    <span>PENDIENTE: {formatProductNamesForPendiente(venta.productos)}</span>
                    <span>S/{venta.monto_pendiente.toFixed(2)}</span>
                  </div>
                ) : (
                  venta.productos.map((producto, prodIndex) => (
                    <div key={prodIndex} className="mb-1">
                      <div className="text-base font-black uppercase mb-1 font-consolamono-bold">{producto.nombre.toUpperCase()}</div>
                      <div className="flex justify-between text-base font-black">
                        <span className="font-mono">{producto.cantidad} X S/{producto.precio_unitario.toFixed(2)}</span>
                        <span className="bg-yellow-200 px-2 py-1 rounded font-black font-consolamono-bold">S/{producto.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <>
                  {venta.productos.map((producto, prodIndex) => (
                    <div key={prodIndex} className="mb-2 border-b border-dotted border-gray-400 pb-1">
                      <div className="text-base font-black uppercase mb-1 font-consolamono-bold">{producto.nombre.toUpperCase()}</div>
                      <div className="flex justify-between text-base font-black">
                        <span className="font-mono">{producto.cantidad} X S/{producto.precio_unitario.toFixed(2)}</span>
                        <span className="bg-yellow-200 px-2 py-1 rounded font-black font-consolamono-bold">S/{producto.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  {venta.monto_pagado > 0 && (
                    <div className="flex justify-between text-base font-extrabold border-t border-black pt-1 font-consolamono-bold">
                      <span>TOTAL VENTA:</span>
                      <span>S/{venta.total.toFixed(2)}</span>
                    </div>
                  )}

                  {venta.monto_pagado > 0 && (
                    <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
                      <span>PAGADO:</span>
                      <span className="text-green-700 bg-green-100 px-2 py-1 rounded font-black">S/{venta.monto_pagado.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="bg-black text-white p-1 text-center mb-1">
                    <div className="flex justify-between text-base font-black font-consolamono-bold">
                      <span>POR PAGAR:</span>
                      <span>S/{venta.monto_pendiente.toFixed(2)}</span>
                    </div>
                  </div>
                  {venta.historial_pagos && venta.historial_pagos.length > 0 && (
                    <div className="mt-2">
                      <div className="text-base font-black font-consolamono-bold">PAGOS REALIZADOS:</div>
                      {venta.historial_pagos.map((pago, pagoIndex) => (
                        <div key={pagoIndex} className="text-base font-extrabold font-mono">
                          <div>{formatDateTime(pago.fecha)}: S/{pago.monto.toFixed(2)}</div>
                          {pago.notas && <div className="font-consolamono-bold">NOTAS: {pago.notas.toUpperCase()}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {venta.notas && (
                    <div className="mt-2">
                      <div className="text-base font-black font-consolamono-bold">NOTAS:</div>
                      <div className="text-base font-extrabold text-gray-700 font-mono">{venta.notas.toUpperCase()}</div>
                    </div>
                  )}
                  {index < ventas.length - 1 && (
                    <div className="border-t border-dashed border-black my-2"></div>
                  )}
                </>
              )}
              
              {/* Separador solo para modo "Solo productos" y no en la última venta */}
              {showProductsOnly && index < ventas.length - 1 && (
                <div className="border-t border-dotted border-gray-400 my-2"></div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t-2 border-black my-2"></div>

      <div className="mb-2">
        <div className="bg-black text-white p-1 text-center mb-1">
          <div className="flex justify-between text-lg font-black font-consolamono-bold">
            <span>DEUDA TOTAL:</span>
            <span>S/{totalDeuda.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-dashed border-black my-2"></div>

      <div className="text-center space-y-1">
        <div className="text-lg font-black font-consolamono-bold">¡GRACIAS POR SU PREFERENCIA!</div>
        <div className="text-base font-bold font-mono">Conserve este estado de cuenta</div>
      </div>

      {/* Bottom spacing */}
      <div className="mt-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow-md">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-lg"
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showProductsOnly}
                onChange={() => setShowProductsOnly(!showProductsOnly)}
                className="h-4 w-4 text-green-600"
              />
              Solo productos
            </label>
            <button
              onClick={handlePrint}
              className="text-[#45923a]"
              aria-label="IMPRIMIR ESTADO DE CUENTA"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="text-[#45923a] relative"
              aria-label="DESCARGAR ESTADO DE CUENTA"
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Download size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-24 mb-24 pb-6 flex justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {renderContent()}
        </div>
      </div>

      <div className="fixed -left-[9999px]">
        <div ref={estadoCuentaRef}>
          {renderContent()}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
        <button
          onClick={handleNuevaVenta}
          className="flex items-center justify-center gap-2 w-full bg-[#45923a] text-white py-3 px-4 rounded-full hover:bg-green-700 transition-colors font-medium"
        >
          <Plus size={18} />
          NUEVA VENTA
        </button>
      </div>

      <style jsx global>{`
        .font-mono {
          font-family: 'ConsolaMono-Book' !important;
        }

        .font-consolamono-bold {
          font-family: 'ConsolaMono-Bold' !important;
        }

        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          body {
            font-family: 'ConsolaMono-Book' !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: bold !important;
          }

          body * {
            visibility: hidden !important;
          }

          .mt-24,
          .mt-24 * {
            visibility: visible !important;
          }

          .mt-24 {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            display: flex !important;
            justify-content: center !important;
          }

          .mt-24 > div {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .fixed {
            display: none !important;
          }

          .p-3 {
            width: 80mm !important;
            padding: 4mm !important;
            font-size: 18px !important;
            line-height: 1.5 !important;
          }

          img {
            display: block !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }

          .font-extrabold {
            font-weight: 900 !important;
            font-size: 18px !important;
          }

          .font-black {
            font-weight: 900 !important;
            font-size: 20px !important;
          }

          .text-base {
            font-size: 18px !important;
            line-height: 1.4 !important;
          }

          .text-lg {
            font-size: 22px !important;
            line-height: 1.5 !important;
          }

          .text-2xl {
            font-size: 26px !important;
            line-height: 1.4 !important;
          }

          .space-y-1 > * + * {
            margin-top: 0.3rem !important;
          }

          .mb-2 {
            margin-bottom: 0.6rem !important;
          }

          .mb-1 {
            margin-bottom: 0.4rem !important;
          }

          .bg-black {
            background: black !important;
            color: white !important;
          }

          .bg-yellow-200 {
            background: #fef08a !important;
            color: black !important;
          }

          .bg-green-100 {
            background: #dcfce7 !important;
            color: #166534 !important;
          }

          .rounded {
            border-radius: 0.25rem !important;
          }

          .px-2 {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }

          .py-1 {
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
          }

          @page {
            size: 80mm auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NotaEstadoCuenta;