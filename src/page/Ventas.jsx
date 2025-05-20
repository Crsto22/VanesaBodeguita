
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, Users, Barcode, Package, User, PlusCircle, ScanBarcode, X, Milk, Minus, Plus } from 'lucide-react';
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
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [selectedProductos, setSelectedProductos] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Opciones del menú principal - Accesos rápidos
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

  // Animación de entrada
  useEffect(() => {
    setAppear(true);
  }, []);

  // Inicializar estado desde localStorage
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

  // Guardar estado en localStorage
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

  // Sincronizar clienteSeleccionado
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
      setSuccess(`Venta registrada con éxito (ID: ${ventaId})`);
      setClienteSeleccionado(null);
      setSelectedProductos([]);
      localStorage.removeItem('ventaEnProgreso');
      setDrawerConfirmarOpen(false);
    } catch (error) {
      setError(`Error al registrar venta: ${error.message}`);
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
      <main className="pt-3 px-1 pb-8">
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm flex justify-between items-center">
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
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm flex justify-between items-center">
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
                className={`flex btn rounded-full flex-row items-center justify-center p-3 border-none text-white shadow-md transition-all ${
                  clienteSeleccionado ? 'bg-[#ffa40c] hover:bg-[#e69500] pr-10' : 'bg-[#ffa40c] hover:bg-[#e69500]'
                }`}
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
              onClick={() => navigate('/escaner')}
            >
              <ScanBarcode strokeWidth={2.5} size={20} />
            </button>
          </div>
          <div className="flex flex-col h-96 p-1">
            <div className="flex-1 rounded-lg bg-white shadow-md p-4 sm:p-6 flex flex-col border border-dashed border-gray-300">
              {selectedProductos.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center max-w-md flex-1">
                  <div className="flex items-center justify-center mb-4">
                    <img src={ProductoNinguno} className="h-32 rounded-2xl text-gray-400" alt="Sin productos" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-2">
                    No se ha agregado ningún producto
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500">
                    Busque el producto o escanee el código de barras para agregar productos a la venta.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {selectedProductos.map((producto, index) => (
                      <li key={index} className="py-4 flex items-center">
                        <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                          {producto.imagen ? (
                            <img src={producto.imagen} alt={producto.nombre} className="object-cover w-full h-full" />
                          ) : (
                            <Package className="h-7 w-7 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                            <button
                              onClick={() => handleRemoveProducto(index)}
                              className="p-1 rounded-full hover:bg-gray-200"
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
                          <div className="flex items-center gap-3 mt-2">
                            {producto.tipo_unidad === 'kilogramo' ? (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={producto.precio_unitario}
                                  onChange={(e) => handleUpdatePrecio(index, parseFloat(e.target.value) || 0)}
                                  className="w-20 p-2 border border-gray-300 rounded-md text-sm shadow-sm"
                                  placeholder="Precio unitario"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleFractionPrice(index, 0.25)}
                                    className="px-2 py-1 text-xs font-medium text-white bg-[#45923a] hover:bg-[#3a7d30] rounded-md"
                                  >
                                    1/4
                                  </button>
                                  <button
                                    onClick={() => handleFractionPrice(index, 0.5)}
                                    className="px-2 py-1 text-xs font-medium text-white bg-[#45923a] hover:bg-[#3a7d30] rounded-md"
                                  >
                                    1/2
                                  </button>
                                  <button
                                    onClick={() => handleFractionPrice(index, 0.75)}
                                    className="px-2 py-1 text-xs font-medium text-white bg-[#45923a] hover:bg-[#3a7d30] rounded-md"
                                  >
                                    3/4
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                                <button
                                  onClick={() => handleUpdateCantidad(index, producto.cantidad - 1)}
                                  className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                                  disabled={producto.cantidad <= 1}
                                >
                                  <Minus size={18} />
                                </button>
                                <span className="px-3 text-sm font-medium text-gray-700">{producto.cantidad}</span>
                                <button
                                  onClick={() => handleUpdateCantidad(index, producto.cantidad + 1)}
                                  className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            )}
                            {producto.tipo_unidad !== 'kilogramo' && (
                              <>
                                <span className="text-sm text-gray-600">x</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={producto.precio_unitario}
                                  onChange={(e) => handleUpdatePrecio(index, parseFloat(e.target.value) || 0)}
                                  className="w-20 p-2 border border-gray-300 rounded-md text-sm shadow-sm"
                                  placeholder="Precio unitario"
                                />
                              </>
                            )}
                            <span className="text-sm font-bold text-[#45923a]">
                              = S/{producto.subtotal}
                            </span>
                          </div>
                          {producto.retornable && (
                            <div className="mt-2 flex items-center gap-2">
                              <Milk size={16} className="text-blue-600" />
                              <span className="text-xs text-gray-600">Debe:</span>
                              <select
                                value={producto.cantidad_retornable}
                                onChange={(e) => handleUpdateRetornables(index, parseInt(e.target.value) || 0)}
                                className="p-1 border border-gray-300 rounded-md text-sm shadow-sm"
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
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total:</span>
                      <span className="text-lg font-bold text-[#45923a]">S/{calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRegistrarVenta}
                    className="mt-4 w-full py-3 bg-[#45923a] hover:bg-[#3a7d30] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <ShoppingCart size={20} />
                    Registrar Venta
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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
        clienteSeleccionado={clienteSeleccionado}
        setClienteSeleccionado={setClienteSeleccionado}
        total={calcularTotal()}
        currentUser={currentUser}
        clientesLoading={clientesLoading}
      />
    </div>
  );
};

export default Ventas;
