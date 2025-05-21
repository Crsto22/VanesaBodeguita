import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Pencil, CreditCard, Users, Barcode, Package, User, PlusCircle, ScanBarcode, X, Milk, Minus, Plus } from 'lucide-react';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useClientes } from '../context/ClientesContext';
import { useVentas } from '../context/VentasContext';
import ProductoNinguno from '../assets/Ventas/ProductoNinguno.svg';
import ClientesDrawer from '../components/Ventas/ClientesDrawer';
import ProductosDrawer from '../components/Ventas/ProductosDrawer';
import ConfirmarVentaDrawer from '../components/Ventas/ConfirmarVentaDrawer';
import EditarPrecioDrawer from '../components/Ventas/EditarPrecioDrawer';
import EscanearProductoDrawer from '../components/Ventas/EscanearProductoDrawer';

const Ventas = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { clientes, obtenerClientePorId, loading: clientesLoading } = useClientes();
  const { crearVenta } = useVentas();
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [drawerClientesOpen, setDrawerClientesOpen] = useState(false);
  const [drawerProductosOpen, setDrawerProductosOpen] = useState(false);
  const [drawerConfirmarOpen, setDrawerConfirmarOpen] = useState(false);
  const [drawerEditarPrecioOpen, setDrawerEditarPrecioOpen] = useState(false);
  const [drawerEscanearOpen, setDrawerEscanearOpen] = useState(false);
  const [productoEditIndex, setProductoEditIndex] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ventaId, setVentaId] = useState(null);

  const quickAccessOptions = [
    {
      id: 'ventas',
      title: 'Ventas',
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'bg-emerald-500',
      description: 'Registrar ventas y ver historial',
      path: '/ventas',
    },
    {
      id: 'deudas',
      title: 'Pagar Deudas',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-amber-500',
      description: 'Gestionar pagos pendientes',
      path: '/deudas',
    },
    {
      id: 'clientes',
      title: 'Clientes',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      description: 'Administrar base de clientes',
      path: '/clientes',
    },
    {
      id: 'escaner',
      title: 'Escáner de Códigos',
      icon: <Barcode className="h-6 w-6" />,
      color: 'bg-violet-500',
      description: 'Consultar precios por código de barras',
      path: '/escaner',
    },
    {
      id: 'productos',
      title: 'Productos',
      icon: <Package className="h-6 w-6" />,
      color: 'bg-rose-500',
      description: 'Inventario y catálogo',
      path: '/productos',
    },
  ];

  useEffect(() => {
    setAppear(true);
  }, []);

  useEffect(() => {
    try {
      const ventaGuardada = localStorage.getItem('ventaEnProgreso');
      if (ventaGuardada) {
        const { clienteSeleccionado, selectedProductos } = JSON.parse(ventaGuardada);
        if (clienteSeleccionado && clienteSeleccionado.id) {
          const clienteActual = obtenerClientePorId(clienteSeleccionado.id);
          if (clienteActual) {
            setClienteSeleccionado(clienteActual);
          }
        }
        if (Array.isArray(selectedProductos) && selectedProductos.length > 0) {
          setSelectedProductos(
            selectedProductos.filter(
              (p) =>
                p.id &&
                p.nombre &&
                typeof p.cantidad === 'number' &&
                typeof p.precio_unitario === 'number' &&
                typeof p.subtotal === 'string'
            )
          );
        }
      }
    } catch (err) {
      console.error('Error al recuperar datos de localStorage:', err);
      localStorage.removeItem('ventaEnProgreso');
    }
  }, [obtenerClientePorId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'ventaEnProgreso',
        JSON.stringify({
          clienteSeleccionado,
          selectedProductos,
        })
      );
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
    }
  }, [clienteSeleccionado, selectedProductos]);

  useEffect(() => {
    if (clienteSeleccionado && !clientesLoading) {
      const clienteActual = obtenerClientePorId(clienteSeleccionado.id);
      if (!clienteActual) {
        setError('El cliente seleccionado ya no está disponible');
        setClienteSeleccionado(null);
      } else if (
        clienteActual.nombre !== clienteSeleccionado.nombre ||
        clienteActual.telefono !== clienteSeleccionado.telefono
      ) {
        setClienteSeleccionado(clienteActual);
      }
    }
  }, [clientes, clientesLoading, clienteSeleccionado, obtenerClientePorId]);

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleSelectCliente = (cliente) => {
    if (!cliente || !cliente.id) {
      setError('Cliente inválido seleccionado');
      console.error('Invalid client selected:', cliente);
      return;
    }
    console.log('Selected client:', cliente);
    setClienteSeleccionado(cliente);
    setDrawerClientesOpen(false);
    setError('');
  };

  const handleRemoveCliente = (e) => {
    e.stopPropagation();
    console.log('Removing client:', clienteSeleccionado);
    setClienteSeleccionado(null);
  };

  const handleSelectProducto = (producto) => {
    setSelectedProductos((prev) => [...prev, producto]);
    setDrawerProductosOpen(false);
    setDrawerEscanearOpen(false);
  };

  const handleRemoveProducto = (index) => {
    setSelectedProductos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              cantidad: nuevaCantidad,
              subtotal: (nuevaCantidad * p.precio_unitario).toFixed(2),
              cantidad_retornable: p.retornable && p.tipo_unidad !== 'kilogramo' ? nuevaCantidad : 0,
            }
          : p
      )
    );
  };

  const handleUpdatePrecio = (index, nuevoPrecio) => {
    const precio = parseFloat(nuevoPrecio);
    if (isNaN(precio) || precio <= 0) {
      setError('El precio debe ser un número positivo');
      return;
    }
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              precio_unitario: precio,
              subtotal: (p.cantidad * precio).toFixed(2),
            }
          : p
      )
    );
    setError('');
    setDrawerEditarPrecioOpen(false);
  };

  const handleFractionPrice = (index, fraction) => {
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index && p.tipo_unidad === 'kilogramo'
          ? {
              ...p,
              precio_unitario: parseFloat((p.precio_referencia * fraction).toFixed(2)),
              subtotal: parseFloat((p.cantidad * p.precio_referencia * fraction).toFixed(2)),
            }
          : p
      )
    );
  };

  const handleUpdateRetornables = (index, retornablesDevueltos) => {
    setSelectedProductos((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              cantidad_retornable: retornablesDevueltos,
            }
          : p
      )
    );
  };

  const handleOpenEditarPrecio = (index) => {
    setProductoEditIndex(index);
    setDrawerEditarPrecioOpen(true);
  };

  const handleRegistrarVenta = () => {
    setError('');
    if (selectedProductos.length === 0) {
      setError('Debe seleccionar al menos un producto');
      return;
    }
    const hasOwedRetornables = selectedProductos.some((p) => p.retornable && p.cantidad_retornable > 0);
    if (hasOwedRetornables && !clienteSeleccionado) {
      setError('Se requiere un cliente registrado para productos retornables con botellas pendientes');
      return;
    }
    setDrawerConfirmarOpen(true);
  };

  const handleConfirmarVenta = async ({ estado, montoPagado, historialPagos, notas }) => {
    try {
      const total = calcularTotal();
      const ventaData = {
        cliente_ref: clienteSeleccionado ? clienteSeleccionado.id : null,
        nombre_cliente: clienteSeleccionado ? clienteSeleccionado.nombre : 'Cliente Genérico',
        productos: selectedProductos.map((p) => ({
          producto_ref: p.id,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio_unitario: parseFloat(p.precio_unitario),
          subtotal: parseFloat(p.subtotal),
          retornable: p.retornable,
          cantidad_retornable: p.cantidad_retornable,
        })),
        notas: notas || '',
        estado,
        monto_pagado: montoPagado,
        monto_pendiente: total - montoPagado,
        historial_pagos: historialPagos,
      };
      console.log('Venta Data to be sent:', ventaData);
      const ventaId = await crearVenta(ventaData);
      setVentaId(ventaId);
      setSuccess(`Venta registrada con éxito (ID: ${ventaId})`);
      setClienteSeleccionado(null);
      setSelectedProductos([]);
      localStorage.removeItem('ventaEnProgreso');
      setDrawerConfirmarOpen(false);
      return ventaId;
    } catch (error) {
      setError(`Error al registrar venta: ${error.message}`);
      throw error;
    }
  };

  const handleViewNotaVenta = () => {
    if (ventaId) {
      navigate(`/ventas/${ventaId}`);
    } else {
      setError('No se pudo cargar la nota de venta: ID no disponible');
    }
  };

  const calcularTotal = () => {
    return selectedProductos.reduce((sum, p) => sum + parseFloat(p.subtotal), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} notifications={notifications} />
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={handleOptionClick}
        logo={Logo}
      />
      <main className="pt-3 px-2 sm:px-4 pb-8 flex flex-col h-full">
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'} flex flex-col h-full`}>
          {error && (
            <div className="mb-3 p-2 sm:p-3 bg-red-100 text-red-700 rounded-md text-xs sm:text-sm flex justify-between items-center">
              {error}
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900"
                aria-label="Cerrar error"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {success && (
            <div className="mb-3 p-2 sm:p-3 bg-green-100 text-green-700 rounded-md text-xs sm:text-sm flex justify-between items-center">
              {success}
              <button
                onClick={() => setSuccess('')}
                className="text-green-700 hover:text-green-900"
                aria-label="Cerrar éxito"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex flex-row justify-center gap-2 sm:gap-6 mb-4">
            <div className="relative">
              <button
                className={`flex btn rounded-full flex-row items-center justify-center p-3 border-none text-white shadow-md transition-all ${clienteSeleccionado ? 'bg-[#ffa40c] hover:bg-[#e69500] pr-10' : 'bg-[#ffa40c] hover:bg-[#e69500]'}`}
                onClick={() => setDrawerClientesOpen(true)}
                disabled={clientesLoading}
              >
                <User size={17} className="flex-shrink-0" />
                <span className="text-sm truncate max-w-[150px]">
                  {clientesLoading
                    ? 'Cargando clientes...'
                    : clienteSeleccionado
                      ? clienteSeleccionado.nombre
                      : 'Cliente Genérico'}
                </span>
              </button>
              {clienteSeleccionado && (
                <button
                  onClick={handleRemoveCliente}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-[#ffc157] transition-colors z-10"
                  aria-label="Quitar cliente"
                >
                  <X size={14} strokeWidth={2.5} className="text-white" />
                </button>
              )}
            </div>
            <button
              className="btn border-none btn-soft rounded-full flex flex-row items-center justify-center p-3 sm:p-4 bg-[#45923a] hover:bg-[#3a7d30] text-white shadow-md transition-all"
              onClick={() => setDrawerProductosOpen(true)}
            >
              <PlusCircle size={17} />
              <span className="text-sm sm:text-base font-medium">Producto</span>
            </button>
            <button
              className="flex btn btn-dash border-none rounded-full flex-row items-center justify-center p-3 sm:p-4 bg-gray-200 hover:bg-gray-300 shadow-md transition-all"
              onClick={() => setDrawerEscanearOpen(true)}
            >
              <ScanBarcode strokeWidth={2.5} size={20} />
            </button>
          </div>
          <div className="flex flex-col flex-1 p-1 min-h-0">
            <div className="flex-1 rounded-lg bg-white shadow-md p-3 sm:p-4 flex flex-col border border-dashed border-gray-300 overflow-hidden">
              {selectedProductos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto flex-1">
                  <div className="flex items-center justify-center mb-3">
                    <img src={ProductoNinguno} className="h-24 sm:h-32 rounded-2xl text-gray-400" alt="Sin productos" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">
                    No se ha agregado ningún producto
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Busque el producto o escanee el código de barras para agregar productos a la venta.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                  <ul className="divide-y divide-gray-200 overflow-y-auto flex-1">
                    {selectedProductos.map((producto, index) => (
                      <li key={index} className="py-3 flex items-start">
                        <div className="flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                          {producto.imagen ? (
                            <img src={producto.imagen} alt={producto.nombre} className="object-cover w-full h-full" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 pr-2 break-words">{producto.nombre}</p>
                            <button
                              onClick={() => handleRemoveProducto(index)}
                              className="p-1 rounded-full hover:bg-gray-200 flex-shrink-0"
                              aria-label="Quitar producto"
                            >
                              <X size={16} strokeWidth={2.5} className="text-gray-500" />
                            </button>
                          </div>
                          {producto.tipo_unidad === 'kilogramo' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Precio por kg: S/{producto.precio_referencia.toFixed(2)}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {producto.tipo_unidad === 'kilogramo' ? (
                              <>
                                <div className="flex items-center">
                                  <span className="px-3 text-sm sm:text-base font-medium text-gray-700">S/{producto.precio_unitario.toFixed(2)}</span>
                                  <button
                                    onClick={() => handleOpenEditarPrecio(index)}
                                    className="bg-gray-100 hover:bg-gray-200 p-2 border border-gray-300 rounded-md"
                                    aria-label="Editar precio"
                                  >
                                    <Pencil size={20} className="text-gray-600" />
                                  </button>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleFractionPrice(index, 0.25)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#45923a] hover:bg-[#3a7d30] rounded-md shadow-sm"
                                    title="250 gramos"
                                  >
                                    1/4 kg
                                  </button>
                                  <button
                                    onClick={() => handleFractionPrice(index, 0.5)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#45923a] hover:bg-[#3a7d30] rounded-md shadow-sm"
                                    title="500 gramos"
                                  >
                                    1/2 kg
                                  </button>
                                  <button
                                    onClick={() => handleFractionPrice(index, 0.75)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#45923a] hover:bg-[#3a7d30] rounded-md shadow-sm"
                                    title="750 gramos"
                                  >
                                    3/4 kg
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                                  <button
                                    onClick={() => handleUpdateCantidad(index, producto.cantidad - 1)}
                                    className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                                    disabled={producto.cantidad <= 1}
                                  >
                                    <Minus size={20} />
                                  </button>
                                  <span className="px-3 text-sm sm:text-base font-medium text-gray-700">{producto.cantidad}</span>
                                  <button
                                    onClick={() => handleUpdateCantidad(index, producto.cantidad + 1)}
                                    className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100"
                                  >
                                    <Plus size={20} />
                                  </button>
                                </div>
                                <span className="text-sm text-gray-600">x</span>
                                <div className="flex items-center">
                                  <span className="px-3 text-sm sm:text-base font-medium text-gray-700">S/{producto.precio_unitario.toFixed(2)}</span>
                                  <button
                                    onClick={() => handleOpenEditarPrecio(index)}
                                    className="bg-gray-100 hover:bg-gray-200 p-2 border border-gray-300 rounded-md"
                                    aria-label="Editar precio"
                                  >
                                    <Pencil size={20} className="text-gray-600" />
                                  </button>
                                </div>
                              </>
                            )}
                            <span className="text-sm font-bold text-[#45923a]">
                              = S/{producto.subtotal}
                            </span>
                          </div>
                          {producto.retornable && (
                            <div className="mt-2 flex items-center gap-2">
                              <Milk size={14} className="text-blue-600" />
                              <span className="text-xs text-gray-600">Debe:</span>
                              <select
                                value={producto.cantidad_retornable}
                                onChange={(e) => handleUpdateRetornables(index, parseInt(e.target.value) || 0)}
                                className="p-1 border border-gray-300 rounded-md text-xs shadow-sm"
                              >
                                {[...Array(producto.cantidad + 1)].map((_, i) => (
                                  <option key={i} value={i}>
                                    {i} {i === 1 ? 'botella' : 'botellas'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                      <span className="text-base sm:text-lg font-bold text-[#45923a]">S/{calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-full mt-auto pt-3">
                    {/* Botón de Registrar Venta se maneja en la sección fixed */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedProductos.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 shadow-lg z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-medium text-gray-800">Total:</span>
              <span className="text-lg font-bold text-[#45923a]">S/{calcularTotal().toFixed(2)}</span>
            </div>
            <button
              onClick={handleRegistrarVenta}
              className="w-full py-3 bg-gradient-to-r from-[#45923a] to-[#3d8433] hover:from-[#3a7d30] hover:to-[#326c29] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
            >
              <ShoppingCart size={20} strokeWidth={2} />
              <span className="font-bold">Registrar Venta</span>
            </button>
          </div>
        )}
      </main>
      <ClientesDrawer
        isOpen={drawerClientesOpen}
        onClose={() => setDrawerClientesOpen(false)}
        onSelectCliente={handleSelectCliente}
      />
      <ProductosDrawer
        isOpen={drawerProductosOpen}
        onClose={() => setDrawerProductosOpen(false)}
        onSelectProducto={handleSelectProducto}
      />
      <ConfirmarVentaDrawer
        isOpen={drawerConfirmarOpen}
        onClose={() => setDrawerConfirmarOpen(false)}
        onConfirm={handleConfirmarVenta}
        onViewNotaVenta={handleViewNotaVenta}
        clienteSeleccionado={clienteSeleccionado}
        setClienteSeleccionado={setClienteSeleccionado}
        total={calcularTotal()}
        currentUser={currentUser}
        clientesLoading={clientesLoading}
      />
      {productoEditIndex !== null && (
        <EditarPrecioDrawer
          isOpen={drawerEditarPrecioOpen}
          onClose={() => {
            setDrawerEditarPrecioOpen(false);
            setProductoEditIndex(null);
          }}
          producto={selectedProductos[productoEditIndex]}
          onConfirm={(nuevoPrecio) => handleUpdatePrecio(productoEditIndex, nuevoPrecio)}
        />
      )}
      <EscanearProductoDrawer
        isOpen={drawerEscanearOpen}
        onClose={() => setDrawerEscanearOpen(false)}
        onSelectProducto={handleSelectProducto}
      />
    </div>
  );
};

export default Ventas;