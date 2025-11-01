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
  const [mostrarFechaHora, setMostrarFechaHora] = useState(false);
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
    <div className="p-4 bg-white w-[302px] text-black leading-tight font-mono">
      {/* Header */}
      <div className="text-center mb-3">
        <img
          src={Logo}
          alt="LOGO"
          className="mx-auto mb-2 max-w-[70px] h-auto"
        />
        <div className="text-xl font-black uppercase tracking-wide">ESTADO DE CUENTA</div>
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Info Cliente */}
      <div className="mb-3 text-sm ">
        <div className="font-bold">CLIENTE: <span className="font-medium">{cliente.nombre}</span> </div>
        <div className="font-bold mt-1">FECHA: <span className="font-medium">{formatDate(new Date())}</span></div>     
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Productos */}
      <div className="mb-3">
        <div className="text-center text-base font-black uppercase mb-2">PRODUCTOS</div>
        {ventas.length === 0 ? (
          <div className="text-center text-sm font-bold">NO HAY PAGOS PENDIENTES</div>
        ) : (
          ventas.map((venta, index) => (
            <div key={venta.id} className="mb-3">
              {/* Mostrar fecha y hora arriba de TODA la venta */}
              {mostrarFechaHora && (
                <div className="text-xs text-gray-600 mb-1 font-bold">
                  {formatDateTime(venta.fecha_creacion)}
                </div>
              )}
              
              {/* SI ES PARCIAL: Solo mostrar el bloque PARCIAL */}
              {venta.monto_pagado > 0 ? (
                <div>
                  <div className="text-sm font-black uppercase">PARCIAL:</div>
                  <div className="text-xs mb-1">
                    ({venta.productos.map(p => p.nombre.toUpperCase()).join(', ')})
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span>TOTAL: S/{venta.total.toFixed(2)} PAGO: S/{venta.monto_pagado.toFixed(2)}</span>
                    <span className="text-sm">S/{venta.monto_pendiente.toFixed(2)}</span>
                  </div>
                  <div className="border-b border-dotted border-gray-400 mt-1"></div>
                </div>
              ) : (
                /* SI ES COMPLETA: Mostrar productos individuales */
                venta.productos.map((producto, prodIndex) => (
                  <div key={prodIndex} className="mb-2">
                    <div className="text-sm font-black uppercase">{producto.nombre}</div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>{producto.cantidad} X S/{producto.precio_unitario.toFixed(2)}</span>
                      <span>S/{producto.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="border-b border-dotted border-gray-400 mt-1"></div>
                  </div>
                ))
              )}

              {index < ventas.length - 1 && (
                <div className="border-t-2 border-dashed border-gray-300 my-3"></div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t-2 border-black my-3"></div>

      {/* Total */}
      <div className="bg-black text-white p-2 text-center">
        <div className="flex justify-between text-lg font-black">
          <span>DEUDA TOTAL:</span>
          <span>S/{totalDeuda.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Footer */}
      <div className="text-center text-xs mt-3">
        <div className="font-bold uppercase">¡GRACIAS POR SU PREFERENCIA!</div>
        <div className="text-gray-600 mt-1">Conserve este estado de cuenta</div>
      </div>

      {/* Bottom spacing */}
      <div className="mt-3"></div>
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
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text text-xs font-medium">Mostrar fecha y hora</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-success checkbox-sm"
                  checked={mostrarFechaHora}
                  onChange={(e) => setMostrarFechaHora(e.target.checked)}
                />
              </label>
            </div>
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

      <style jsx global>{`
        @media print {
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          body {
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

          .text-xs {
            font-size: 11px !important;
          }

          .text-sm {
            font-size: 13px !important;
          }

          .text-base {
            font-size: 15px !important;
          }

          .text-lg {
            font-size: 17px !important;
          }

          .text-xl {
            font-size: 19px !important;
          }

          .bg-black {
            background: black !important;
            color: white !important;
          }

          .text-gray-600 {
            color: #4b5563 !important;
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