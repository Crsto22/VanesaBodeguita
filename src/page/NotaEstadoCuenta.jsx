import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVentas } from '../context/VentasContext';
import { useClientes } from '../context/ClientesContext';
import { Loader2, ArrowLeft, Printer, Download, Plus } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import domtoimage from 'dom-to-image';

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
      const dataUrl = await domtoimage.toPng(estadoCuentaRef.current, {
        bgcolor: '#ffffff',
        quality: 1,
        width: 302 * 3,
        height: estadoCuentaRef.current.clientHeight * 3,
        style: {
          transform: 'scale(3)',
          transformOrigin: 'top left',
          width: '302px',
          height: `${estadoCuentaRef.current.clientHeight}px`
        }
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
    <div className="p-2 bg-white w-[302px] font-arial text-black text-lg font-bold leading-[1]">
      <div className="text-center mb-1">
        <img
          src={Logo}
          alt="LOGO"
          className="mx-auto mb-1 max-w-[70px] h-auto"
        />
        <div className="text-2xl">ESTADO DE CUENTA</div>
      </div>

      <div className="border-t-2 border-dashed border-black my-1"></div>

      <div className="mb-1">
        <div className="flex justify-between text-sm">
          <span>CLIENTE: {cliente.nombre.toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>FECHA: {formatDate(new Date())}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-black my-1"></div>

      <div className="mb-1">
        {ventas.length === 0 ? (
          <div className="text-center text-sm">NO HAY PAGOS PENDIENTES.</div>
        ) : (
          ventas.map((venta, index) => (
            <div key={venta.id} className="mb-1">
              {!showProductsOnly && (
                <div className="flex justify-between text-sm font-extrabold">
                  <span>VENTA {index + 1}</span>
                  <span>{formatDate(venta.fecha_creacion)}</span>
                </div>
              )}
              {showProductsOnly ? (
                venta.monto_pagado > 0 ? (
                  <div className="flex justify-between text-sm text-black">
                    <span>RESTANTE: ({truncateProductNames(venta.productos)})</span>
                    <span>S/{venta.monto_pendiente.toFixed(2)}</span>
                  </div>
                ) : (
                  venta.productos.map((producto, prodIndex) => (
                    <div key={prodIndex} className="mb-1">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-sm font-semibold">{producto.nombre.toUpperCase()}</div>
                          <div className="text-sm font-semibold">{producto.cantidad} X S/{producto.precio_unitario.toFixed(2)}</div>
                        </div>
                        <div className="text-sm font-semibold">S/{producto.subtotal.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <>
                  {venta.productos.map((producto, prodIndex) => (
                    <div key={prodIndex} className="mb-1">
                      <div className="flex justify-between">
                        <div>
                          <div className="text-sm font-semibold">{producto.nombre.toUpperCase()}</div>
                          <div className="text-sm font-semibold">{producto.cantidad} X S/{producto.precio_unitario.toFixed(2)}</div>
                        </div>
                        <div className="text-sm font-semibold">S/{producto.subtotal.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}

                  {venta.monto_pagado > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>PAGADO:</span>
                      <span>S/{venta.monto_pagado.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-red-700 font-extrabold">
                    <span>POR PAGAR:</span>
                    <span>S/{venta.monto_pendiente.toFixed(2)}</span>
                  </div>
                  {venta.historial_pagos && venta.historial_pagos.length > 0 && (
                    <div className="mt-1">
                      <div className="text-sm font-semibold">PAGOS REALIZADOS:</div>
                      {venta.historial_pagos.map((pago, pagoIndex) => (
                        <div key={pagoIndex} className="text-xs">
                          <div>{formatDateTime(pago.fecha)}: S/{pago.monto.toFixed(2)}</div>
                          {pago.notas && <div>NOTAS: {pago.notas.toUpperCase()}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {venta.notas && (
                    <div className="mt-1">
                      <div className="text-sm font-semibold">NOTAS:</div>
                      <div className="text-xs text-gray-700">{venta.notas.toUpperCase()}</div>
                    </div>
                  )}
                  {index < ventas.length - 1 && (
                    <div className="border-t border-dashed border-black my-1"></div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t-2 border-dashed border-black my-1"></div>

      <div className="mb-1">
        <div className="flex justify-between text-2xl border-t-2 border-b-2 border-black py-0.5">
          <span>DEUDA TOTAL:</span>
          <span>S/{totalDeuda.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center text-base mb-6">
        <div>¡GRACIAS POR SU PREFERENCIA!</div>
      </div>
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
        .font-arial {
          font-family: Arial, sans-serif !important;
          text-transform: uppercase !important;
        }

        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          body {
            font-family: Arial, sans-serif !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            text-transform: uppercase !important;
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

          .p-2 {
            width: 80mm !important;
            padding: 4mm !important;
          }

          img {
            display: block !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }

          @page {
            size: 100mm auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NotaEstadoCuenta;