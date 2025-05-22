
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVentas } from '../context/VentasContext';
import { Loader2, ArrowLeft, Printer, Download, Plus } from 'lucide-react';
import Logo from '../assets/Logo.svg';

const NotaVenta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerVentaCompletaPorId } = useVentas();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        setLoading(true);
        const ventaData = await obtenerVentaCompletaPorId(id);
        if (!ventaData) {
          setError('Venta no encontrada');
        } else {
          setVenta(ventaData);
        }
      } catch (err) {
        console.error('Error al obtener venta:', err);
        setError('Error al cargar los detalles de la venta');
      } finally {
        setLoading(false);
      }
    };

    fetchVenta();
  }, [id, obtenerVentaCompletaPorId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Lógica para descargar la nota de venta como PDF o imagen
    // Esta es una implementación básica que podría expandirse según necesidades
    alert('Funcionalidad de descarga en desarrollo');
  };

  const handleNuevaVenta = () => {
    navigate('/ventas');
  };

  const handleBack = () => {
    navigate(-1); // Navigate back one step in history
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          <p className="mt-2 text-gray-600 font-medium">Cargando nota de venta...</p>
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
              aria-label="Imprimir nota de venta"
            >
              <Printer size={20} />
            </button>
            <button 
              onClick={handleDownload} 
              className="text-[#45923a]"
              aria-label="Descargar nota de venta"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="mt-24 pb-6 flex justify-center px-4">
        <div className="max-w-[384px] w-full bg-white rounded-lg shadow-lg">
          {/* Receipt Content */}
          <div className="p-4 font-mono text-sm text-gray-800 bg-gray-50 border-t border-b border-gray-200">
            {/* Logo and Header */}
            <div className="text-center mb-4">
              <img
                src={Logo}
                alt="Logo"
                className="mx-auto mb-2"
                style={{ maxWidth: '80px', height: 'auto' }}
              />
              <h2 className="text-lg font-bold text-gray-900">Nota de Venta</h2>
              <p className="text-xs">Venta #{id}</p>
              <p className="text-xs">
                Fecha: {new Date(venta.fecha_creacion).toLocaleString('es-PE', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </p>
              <p className="text-xs">Cajero: {venta.nombre_cajero || 'Desconocido'}</p>
              <p className="text-xs">Cliente: {venta.nombre_cliente}</p>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Products */}
            <div className="mb-4">
              <div className="flex justify-between font-bold text-xs">
                <span>Descripción</span>
                <span>Total</span>
              </div>
              {venta.productos.map((producto, index) => (
                <div key={index} className="flex justify-between mt-1 text-xs">
                  <div>
                    <p className="font-medium">
                      {producto.nombre} x{producto.cantidad}
                    </p>
                    <p className="text-gray-600">
                      S/{producto.precio_unitario.toFixed(2)}/u
                      {producto.retornable && ` | Retornables: ${producto.cantidad_retornable}`}
                    </p>
                  </div>
                  <p className="font-medium">S/{producto.subtotal.toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Totals */}
            <div className="text-right mb-4">
              <p className="text-xs font-bold">Total: S/{venta.total.toFixed(2)}</p>
              {venta.estado === 'parcial' && (
                <>
                  <p className="text-xs">Pagado: S/{venta.monto_pagado.toFixed(2)}</p>
                  <p className="text-xs text-red-600">Pendiente: S/{venta.monto_pendiente.toFixed(2)}</p>
                </>
              )}
              {venta.estado === 'pendiente' && (
                <p className="text-xs text-red-600">Pendiente: S/{venta.monto_pendiente.toFixed(2)}</p>
              )}
              <p
                className={`text-xs font-medium capitalize ${
                  venta.estado === 'pagado'
                    ? 'text-green-600'
                    : venta.estado === 'parcial'
                    ? 'text-[#ffa40c]'
                    : 'text-red-600'
                }`}
              >
                Estado: {venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1)}
              </p>
              {venta.total_retornables > 0 && (
                <p className="text-xs">Retornables pendientes: {venta.total_retornables}</p>
              )}
            </div>

            {/* Returnables History */}
            {venta.historial_retornables && venta.historial_retornables.length > 0 && (
              <>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div className="mb-4">
                  <p className="font-bold text-xs">Historial de Retornables</p>
                  {venta.historial_retornables.map((devolucion, index) => (
                    <div key={index} className="text-xs mt-1">
                      <p>
                        {new Date(devolucion.fecha).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                        : {devolucion.cantidad_devuelta} devuelto(s)
                      </p>
                      {devolucion.notas && <p className="text-gray-600">Notas: {devolucion.notas}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            {venta.notas && (
              <>
                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div>
                  <p className="font-bold text-xs">Notas</p>
                  <p className="text-xs text-gray-600">{venta.notas}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer button - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white z-10 shadow-t-md p-4">
        <button
          onClick={handleNuevaVenta}
          className="flex items-center justify-center gap-2 w-full bg-[#45923a] text-white py-3 px-4 rounded-full hover:bg-green-700 transition-colors font-medium"
        >
          <Plus size={18} />
          Nueva Venta
        </button>
      </div>

      {/* Print styles - Solo aplicados cuando se imprime */}
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
          .mt-24 *, .mt-24 {
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
        }
      `}</style>
    </div>
  );
};

export default NotaVenta;
