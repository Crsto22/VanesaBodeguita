import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useVentas } from '../context/VentasContext';
import { Loader2, ArrowLeft, Printer, Download, Plus } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import domtoimage from 'dom-to-image';
import QRCode from 'react-qr-code';

const NotaVenta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { obtenerVentaCompletaPorId } = useVentas();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printExecuted, setPrintExecuted] = useState(false);
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

  // Efecto para detectar modo de impresión automática
  useEffect(() => {
    const printParam = searchParams.get('print');
    if (printParam === 'true') {
      setIsPrintMode(true);
    }
  }, [searchParams]);

  // Efecto para ejecutar impresión automática cuando la venta esté cargada y sea modo impresión
  useEffect(() => {
    if (isPrintMode && venta && !loading && !error && !printExecuted) {
      // Esperar un momento para que el componente se renderice completamente
      const timer = setTimeout(() => {
        console.log('🖨️ Ejecutando impresión automática...');
        setPrintExecuted(true);
        
        if (window.print) {
          window.print();
        } else {
          console.warn('⚠️ window.print no está disponible');
          // Si no hay impresión disponible, redirigir inmediatamente
          navigate('/ventas-destock');
        }
      }, 800); // Reducido de 1000ms a 800ms

      return () => clearTimeout(timer);
    }
  }, [isPrintMode, venta, loading, error, printExecuted, navigate]);

  // Efecto para detectar cuando se cierra el diálogo de impresión - ULTRA AGRESIVO
  useEffect(() => {
    if (isPrintMode && printExecuted) {
      console.log('🖨️ Iniciando detección ultra agresiva...');
      
      const redirectToVentasDestock = () => {
        console.log('🖨️ Redirigiendo inmediatamente...');
        navigate('/ventas-destock');
      };

      // Detectar finalización/cancelación de impresión
      const handleAfterPrint = () => {
        console.log('🖨️ AfterPrint detectado');
        redirectToVentasDestock();
      };

      // Detectar cualquier tecla presionada
      const handleAnyKey = (event) => {
        console.log('🖨️ Tecla detectada:', event.key);
        redirectToVentasDestock();
      };

      // Detectar cualquier click
      const handleAnyClick = () => {
        console.log('🖨️ Click detectado');
        redirectToVentasDestock();
      };

      // Detectar cambio de foco
      const handleFocusChange = () => {
        console.log('🖨️ Cambio de foco detectado');
        redirectToVentasDestock();
      };

      // Detectar movimiento del mouse
      const handleMouseMove = () => {
        console.log('🖨️ Movimiento de mouse detectado');
        redirectToVentasDestock();
      };

      // Detectar scroll
      const handleScroll = () => {
        console.log('🖨️ Scroll detectado');
        redirectToVentasDestock();
      };

      // Detectar cambio de visibilidad
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('🖨️ Página visible otra vez');
          redirectToVentasDestock();
        }
      };

      // Timeout ultra agresivo - 1.5 segundos
      const ultraFastTimer = setTimeout(() => {
        console.log('🖨️ Timeout ultra rápido alcanzado (1.5s)');
        redirectToVentasDestock();
      }, 1500);

      // Agregar todos los event listeners
      window.addEventListener('afterprint', handleAfterPrint);
      document.addEventListener('keydown', handleAnyKey);
      document.addEventListener('keyup', handleAnyKey);
      document.addEventListener('click', handleAnyClick);
      document.addEventListener('mousedown', handleAnyClick);
      document.addEventListener('mousemove', handleMouseMove, { once: true });
      window.addEventListener('focus', handleFocusChange);
      window.addEventListener('blur', handleFocusChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('scroll', handleScroll);
      
      // También detectar eventos táctiles para móviles
      document.addEventListener('touchstart', handleAnyClick);
      document.addEventListener('touchend', handleAnyClick);

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        document.removeEventListener('keydown', handleAnyKey);
        document.removeEventListener('keyup', handleAnyKey);
        document.removeEventListener('click', handleAnyClick);
        document.removeEventListener('mousedown', handleAnyClick);
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('focus', handleFocusChange);
        window.removeEventListener('blur', handleFocusChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('scroll', handleScroll);
        document.removeEventListener('touchstart', handleAnyClick);
        document.removeEventListener('touchend', handleAnyClick);
        clearTimeout(ultraFastTimer);
      };
    }
  }, [isPrintMode, printExecuted, navigate]);

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
    if (isPrintMode) {
      navigate('/ventas-destock');
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
          <p className="mt-1 text-gray-600 font-medium text-lg">
            {isPrintMode ? 'Preparando impresión...' : 'Cargando ticket...'}
          </p>
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
      <div className="p-3 bg-white w-[302px] font-mono text-black leading-relaxed">
        {/* Header */}
        <div className="text-center mb-3">
          <img
            src={Logo}
            alt="Logo"
            className="mx-auto mb-2 max-w-[80px] h-auto"
          />
        </div>
        {/* Ticket Info */}
        <div className="text-center mb-2">
          <div className="text-2xl font-black uppercase font-consolamono-bold">NOTA DE VENTA</div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Customer Info */}
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
            <span>CLIENTE: {venta.nombre_cliente.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
            <span>CAJERO: {(venta.nombre_cajero || 'SISTEMA').toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
            <span>FECHA: {fechaFormateada}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
            <span>HORA: {horaFormateada}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
            <span>ESTADO: {venta.estado.toUpperCase()}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Products */}
        <div className="mb-3">
          <div className="text-base font-black mb-2 text-center font-consolamono-bold">DETALLE DE PRODUCTOS</div>
          {venta.productos.map((producto, index) => (
            <div key={index} className="mb-2 border-b border-dotted border-gray-400 pb-1">
              <div className="text-base font-extrabold uppercase mb-1 font-consolamono-bold">
                {producto.nombre}
              </div>
              <div className="flex justify-between text-base font-black">
                <span className="font-mono">{producto.cantidad} x S/{producto.precio_unitario.toFixed(2)}</span>
                <span className="bg-yellow-200 px-2 py-1 rounded font-black font-consolamono-bold">S/{producto.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-black my-2"></div>
        
        {/* Totals */}
        <div className="mb-2">
          <div className="bg-black text-white p-1 text-center mb-1">
            <div className="flex justify-between text-lg font-black font-consolamono-bold">
              <span>TOTAL:</span>
              <span>S/{venta.total.toFixed(2)}</span>
            </div>
          </div>

          {venta.estado === 'parcial' && (
            <div className="space-y-0.5 text-base font-extrabold">
              <div className="flex justify-between font-consolamono-bold">
                <span>PAGADO:</span>
                <span className="text-green-700 bg-green-100 px-2 py-1 rounded font-black">S/{venta.monto_pagado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-consolamono-bold">
                <span>PENDIENTE:</span>
                <span className="text-red-700 bg-red-100 px-2 py-1 rounded font-black">S/{venta.monto_pendiente.toFixed(2)}</span>
              </div>
            </div>
          )}

          {venta.estado === 'pendiente' && (
            <div className="flex justify-between text-base font-extrabold font-consolamono-bold">
              <span>PENDIENTE:</span>
              <span className="text-red-700 bg-red-100 px-2 py-1 rounded font-black">S/{venta.monto_pendiente.toFixed(2)}</span>
            </div>
          )}

          {venta.total_retornables > 0 && (
            <div className="text-center text-base font-black mt-2 bg-yellow-100 p-1 rounded font-consolamono-bold">
              🍾 BOTELLAS PENDIENTES: {venta.total_retornables}
            </div>
          )}
        </div>

        {venta.historial_retornables && venta.historial_retornables.length > 0 && (
          <>
            <div className="border-t border-dashed border-black my-2"></div>
            <div className="mb-2">
              <div className="text-base font-black text-center mb-1 font-consolamono-bold">📋 HISTORIAL DE DEVOLUCIONES</div>
              {venta.historial_retornables.map((devolucion, index) => (
                <div key={index} className="mb-1 bg-gray-50 p-1 rounded text-base">
                  <div className="flex justify-between font-extrabold">
                    <span className="font-mono">
                      {new Date(devolucion.fecha).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-green-700 font-consolamono-bold">✓ {devolucion.cantidad_devuelta} DEVUELTO</span>
                  </div>
                  {devolucion.notas && (
                    <div className="text-base text-gray-600 mt-0.5 font-bold font-mono">
                      💬 {devolucion.notas}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {venta.notas && (
          <>
            <div className="border-t border-dashed border-black my-2"></div>
            <div className="mb-2">
              <div className="text-base font-black text-center mb-1 font-consolamono-bold">📝 OBSERVACIONES</div>
              <div className="text-base font-bold bg-yellow-50 p-1 rounded text-gray-700 font-mono">{venta.notas}</div>
            </div>
          </>
        )}

        <div className="border-t-2 border-black my-2"></div>
        
        {/* QR Code */}
        <div className="text-center my-3">
          <div className="text-base font-black mb-1 font-consolamono-bold">CÓDIGO DE VERIFICACIÓN</div>
          <div className="bg-white p-2 inline-block border border-gray-300">
            <QRCode value={id} size={80} level="H" />
          </div>
          <div className="text-base font-bold mt-1 font-mono">ID: {id.slice(-8).toUpperCase()}</div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Footer */}
        <div className="text-center space-y-1">
          <div className="text-lg font-black font-consolamono-bold">¡GRACIAS POR SU COMPRA!</div>
          <div className="text-base font-bold font-mono">Conserve este ticket</div>
        </div>

        {/* Bottom spacing */}
        <div className="mt-4"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Indicador de impresión automática */}
      {isPrintMode && printExecuted && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white z-20 p-2">
          <div className="flex items-center justify-center gap-2">
            <Printer className="animate-pulse" size={18} />
            <span className="font-bold text-sm">IMPRIMIENDO... Cualquier acción lo regresará automáticamente</span>
          </div>
        </div>
      )}

      <div className={`fixed top-0 left-0 right-0 bg-white z-10 shadow-md ${isPrintMode && printExecuted ? 'mt-10' : ''}`}>
        <div className="flex justify-between items-center p-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-lg"
          >
            <ArrowLeft size={16} />
            <span>{isPrintMode ? 'Cancelar' : 'Volver'}</span>
          </button>
          {!isPrintMode && (
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
          )}
        </div>
      </div>

      <div className={`mb-24 pb-6 flex justify-center px-4 ${isPrintMode && printExecuted ? 'mt-32' : 'mt-24'}`}>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {renderTicketContent()}
        </div>
      </div>

      <div className="fixed -left-[9999px]">
        <div ref={notaVentaRef}>
          {renderTicketContent()}
        </div>
      </div>

      {!isPrintMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
          <button
            onClick={handleNuevaVenta}
            className="flex items-center justify-center gap-2 w-full bg-[#45923a] text-white py-3 px-4 rounded-full hover:bg-green-700 transition-colors font-medium"
          >
            <Plus size={18} />
            Nueva Venta
          </button>
        </div>
      )}

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

          .space-y-0\.5 > * + * {
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

          .bg-red-100 {
            background: #fee2e2 !important;
            color: #991b1b !important;
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

export default NotaVenta;