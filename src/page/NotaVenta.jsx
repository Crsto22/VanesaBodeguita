import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVentas } from '../context/VentasContext';
import { Loader2, ArrowLeft, Printer, Download, Plus } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import domtoimage from 'dom-to-image';
import QRCode from 'react-qr-code';

const NotaVenta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obtenerVentaCompletaPorId } = useVentas();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const notaVentaRef = useRef(null);

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
    if (window.print) {
      setTimeout(() => {
        window.print();
      }, 500);
    } else {
      alert('La función de imprimir no está disponible en este dispositivo. Use la opción de descargar.');
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const dataUrl = await domtoimage.toPng(notaVentaRef.current, {
        bgcolor: '#ffffff',
        quality: 1,
        width: 302 * 3,
        height: notaVentaRef.current.clientHeight * 3,
        style: {
          transform: 'scale(3)',
          transformOrigin: 'top left',
          width: '302px',
          height: `${notaVentaRef.current.clientHeight}px`
        }
      });

      const link = document.createElement('a');
      link.download = `ticket-${id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar el ticket:', error);
      alert('Error al generar el ticket. Intente nuevamente.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          <p className="mt-1 text-gray-600 font-medium text-lg">Cargando ticket...</p>
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

  const renderTicketContent = () => {
    const fecha = new Date(venta.fecha_creacion);
    const fechaFormateada = fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const horaFormateada = fecha.toLocaleString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div className="p-2 bg-white w-[302px] font-arial text-black text-lg font-bold leading-[1]">
        <div className="text-center mb-1">
          <img
            src={Logo}
            alt="Logo"
            className="mx-auto mb-1 max-w-[70px] h-auto"
          />
          <div className="text-2xl">NOTA DE VENTA</div>
        </div>

        <div className="border-t-2 border-dashed border-black my-1"></div>

        <div className="mb-1">
          <div className="flex justify-between text-sm">
            <span>CLIENTE: {venta.nombre_cliente}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>CAJERO: {venta.nombre_cajero || 'SISTEMA'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>FECHA: {fechaFormateada}</span>
            <span>HORA: {horaFormateada}</span>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-black my-1"></div>

        <div className="mb-1">
          {venta.productos.map((producto, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <div>
                  <div className="text-sm font-semibold">{producto.nombre}</div>
                  <div className="text-sm font-semibold">{producto.cantidad} x S/{producto.precio_unitario.toFixed(2)}</div>
                </div>
                <div className="text-sm font-semibold">S/{producto.subtotal.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-black my-1"></div>
        
        <div className="mb-1">
          <div className="flex justify-between text-2xl border-t-2 border-b-2 border-black py-0.5">
            <span>TOTAL:</span>
            <span>S/{venta.total.toFixed(2)}</span>
          </div>

          {venta.estado === 'parcial' && (
            <>
              <div className="flex justify-between text-base">
                <span>Pagado:</span>
                <span>S/{venta.monto_pagado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base text-red-700">
                <span>Pendiente:</span>
                <span>S/{venta.monto_pendiente.toFixed(2)}</span>
              </div>
            </>
          )}

          {venta.estado === 'pendiente' && (
            <div className="flex justify-between text-base text-red-700">
              <span>Pendiente:</span>
              <span>S/{venta.monto_pendiente.toFixed(2)}</span>
            </div>
          )}

          <div className="text-center my-1">
            <span className={`inline-block text-base px-2 py-0.5 border-2 border-black
              ${venta.estado === 'pagado' ? 'bg-green-200 text-green-800' :
                venta.estado === 'parcial' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'}`}>
              {venta.estado.toUpperCase()}
            </span>
          </div>

          {venta.total_retornables > 0 && (
            <div className="text-center text-base">
              Botellas pendientes: {venta.total_retornables}
            </div>
          )}
        </div>

        {venta.historial_retornables && venta.historial_retornables.length > 0 && (
          <>
            <div className="border-t border-dashed border-black my-1"></div>
            <div className="mb-1">
              <div className="text-base">HISTORIAL</div>
              {venta.historial_retornables.map((devolucion, index) => (
                <div key={index} className="mb-0.5">
                  <div className="flex justify-between text-sm">
                    <span>
                      {new Date(devolucion.fecha).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>{devolucion.cantidad_devuelta} devuelto</span>
                  </div>
                  {devolucion.notas && (
                    <div className="text-xs text-gray-700">
                      Notas: {devolucion.notas}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {venta.notas && (
          <>
            <div className="border-t border-dashed border-black my-1"></div>
            <div className="mb-1">
              <div className="text-base">NOTAS</div>
              <div className="text-sm text-gray-700">{venta.notas}</div>
            </div>
          </>
        )}

        <div className="border-t-2 border-dashed border-white my-1"></div>
        <div className="border-t-2 border-dashed border-white my-1"></div>
        <div className="border-t-2 border-dashed border-white my-1"></div>
        <div className="text-center my-2">
          <div style={{ background: 'white', padding: '8px', display: 'inline-block' }}>
            <QRCode value={id} size={100} level="H" />
          </div>
        </div>

        <div className="text-center text-base mb-6">
          <div>¡Gracias por su compra!</div>
        </div>
      </div>
    );
  };

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
            <button
              onClick={handlePrint}
              className="text-[#45923a]"
              aria-label="Imprimir ticket"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="text-[#45923a] relative"
              aria-label="Descargar ticket"
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
          {renderTicketContent()}
        </div>
      </div>

      <div className="fixed -left-[9999px]">
        <div ref={notaVentaRef}>
          {renderTicketContent()}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
        <button
          onClick={handleNuevaVenta}
          className="flex items-center justify-center gap-2 w-full bg-[#45923a] text-white py-3 px-4 rounded-full hover:bg-green-700 transition-colors font-medium"
        >
          <Plus size={18} />
          Nueva Venta
        </button>
      </div>

      <style jsx global>{`
        .font-arial {
          font-family: Arial, sans-serif !important;
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

export default NotaVenta;