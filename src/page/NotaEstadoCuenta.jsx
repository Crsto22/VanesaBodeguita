import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVentas } from '../context/VentasContext';
import { useClientes } from '../context/ClientesContext';
import { Loader2, ArrowLeft, Printer, Download } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import domtoimage from 'dom-to-image';

const NotaEstadoCuenta = () => {
  const { id } = useParams(); // Client ID
  const navigate = useNavigate();
  const { obtenerVentasPorCliente, obtenerDeudaTotalPorCliente } = useVentas();
  const { obtenerClientePorId } = useClientes();
  const [ventas, setVentas] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false); // New state for download loading
  const estadoCuentaRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch client
        const clienteData = obtenerClientePorId(id);
        if (!clienteData) {
          throw new Error('Cliente no encontrado');
        }
        setCliente(clienteData);

        // Fetch sales with pending or partial status
        const ventasData = await obtenerVentasPorCliente(id, false);
        // Sort sales by fecha_creacion in descending order
        const sortedVentas = ventasData.sort((a, b) => 
          new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
        );
        setVentas(sortedVentas);
      } catch (err) {
        console.error('Error al obtener datos:', err);
        setError(err.message || 'Error al cargar el estado de cuenta');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, obtenerVentasPorCliente, obtenerClientePorId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true); // Start loading
      const dataUrl = await domtoimage.toPng(estadoCuentaRef.current, {
        bgcolor: '#ffffff',
        quality: 1,
        width: 384 * 2,
        height: estadoCuentaRef.current.clientHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: '384px',
          height: `${estadoCuentaRef.current.clientHeight}px`
        }
      });

      const link = document.createElement('a');
      link.download = `estado-cuenta-${id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar el estado de cuenta:', error);
      alert('Error al generar el estado de cuenta. Intente nuevamente.');
    } finally {
      setIsDownloading(false); // Stop loading
    }
  };

  const handleNuevaVenta = () => {
    navigate('/ventas');
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Calculate total debt
  const totalDeuda = obtenerDeudaTotalPorCliente(id);

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          <p className="mt-2 text-gray-600 font-medium">Cargando estado de cuenta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => (
    <div className="p-4 font-mono text-sm text-gray-800 bg-gray-50 border-t border-b border-gray-200">
      {/* Header */}
      <div className="text-center mb-4">
        <img
          src={Logo}
          alt="Logo"
          className="mx-auto mb-2"
          style={{ maxWidth: '80px', height: 'auto' }}
        />
        <h2 className="text-lg font-bold text-gray-900">Estado de Cuenta</h2>
        <p className="text-xs font-medium">Cliente: {cliente.nombre}</p>
        <p className="text-xs">ID Cliente: {id.slice(0, 8)}</p>
        <p className="text-xs">
          Fecha: {new Date().toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Sales List */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>
      <p className="text-xs font-bold text-gray-900 mb-2">Detalles de Ventas Pendientes</p>
      {ventas.length === 0 ? (
        <p className="text-xs text-center text-gray-600">
          No hay pagos pendientes.
        </p>
      ) : (
        ventas.map((venta, index) => (
          <div key={venta.id} className="mb-4">
            <div className="flex justify-between font-bold text-xs">
              <span>Venta #{venta.id.slice(0, 8)}</span>
              <span>{formatDate(venta.fecha_creacion)}</span>
            </div>
            {/* Products */}
            <div className="mt-1">
              {venta.productos.map((producto, prodIndex) => (
                <div key={prodIndex} className="flex justify-between text-xs mt-1">
                  <div>
                    <p className="font-medium">
                      {producto.nombre} x{producto.cantidad}
                    </p>
                    <p className="text-gray-600">
                      S/{producto.precio_unitario.toFixed(2)} c/u
                    </p>
                  </div>
                  <p className="font-medium">S/{producto.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="text-right mt-2 space-y-1">
              <p className="text-xs font-bold">
                Total: S/{venta.total.toFixed(2)}
              </p>
              {venta.monto_pagado > 0 && (
                <p className="text-xs">
                  Pagado: S/{venta.monto_pagado.toFixed(2)}
                </p>
              )}
              <p className="text-xs font-extrabold text-red-600">
                Por Pagar: S/{venta.monto_pendiente.toFixed(2)}
              </p>
            </div>
            
            {/* Payment History */}
            {venta.historial_pagos && venta.historial_pagos.length > 0 && (
              <div className="mt-2">
                <p className="font-bold text-xs">Pagos Realizados</p>
                {venta.historial_pagos.map((pago, pagoIndex) => (
                  <div key={pagoIndex} className="text-xs mt-1">
                    <p>
                      {formatDate(pago.fecha)}: S/{pago.monto.toFixed(2)}
                    </p>
                    {pago.notas && (
                      <p className="text-gray-600">Notas: {pago.notas}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Notes */}
            {venta.notas && (
              <div className="mt-2">
                <p className="font-bold text-xs">Notas</p>
                <p className="text-xs text-gray-600">{venta.notas}</p>
              </div>
            )}
            {index < ventas.length - 1 && (
              <div className="border-t border-dashed border-gray-400 my-2"></div>
            )}
          </div>
        ))
      )}

      {/* Summary */}
      <div className="border-t border-dashed border-gray-400 my-4"></div>
      <div className="mb-4">
        <div className="flex justify-between text-xs mt-2">
          <span className="font-medium text-xl">Deuda Total:</span>
          <span className="font-bold text-red-600 text-xl">S/{totalDeuda.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow-md">
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Volver</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-[#45923a]"
              aria-label="Imprimir estado de cuenta"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="text-[#45923a] relative"
              aria-label="Descargar estado de cuenta"
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

      {/* Content - Scrollable */}
      <div className="mt-24 pb-6 flex justify-center px-4">
        <div className="max-w-[384px] w-full bg-white rounded-lg shadow-lg">
          {renderContent()}
        </div>
      </div>

      {/* Hidden content for high-quality image generation */}
      <div className="fixed -left-[9999px]">
        <div
          ref={estadoCuentaRef}
          className="bg-white w-[384px] text-sm"
          style={{
            fontFamily: "'Courier New', monospace",
            lineHeight: '1.5',
            color: '#000',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
          }}
        >
          {renderContent()}
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-gray-100 {
            background-color: white !important;
          }
          .max-w-[384px] {
            max-width: 100% !important;
          }
          .shadow-lg {
            box-shadow: none !important;
          }
          .mt-24 {
            margin-top: 0 !important;
          }
          .mt-24 *,
          .mt-24 {
            visibility: visible;
          }
          .mt-24 {
            position: absolute;
            left: 0;
            top: 0;
          }
          .fixed {
            display: none !important;
          }
          .bg-red-50 {
            background-color: #fef2f2 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NotaEstadoCuenta;