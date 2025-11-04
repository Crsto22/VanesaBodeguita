import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ShoppingCart, CreditCard, Users, Barcode, Package, Search, 
  AlertCircle, Milk, DollarSign, CheckSquare, ChevronDown, 
  Calendar, Clock, Eye, ListOrdered, RefreshCw, Wallet, History, X, Plus, Minus, Printer, BookOpen, Grid3x3
} from 'lucide-react';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useClientes } from '../context/ClientesContext';
import { useVentas } from '../context/VentasContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';

const DeudasDestock = () => {
  const navigate = useNavigate();
  const { clienteId } = useParams();
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const { clientes, loading: clientesLoading, obtenerClientePorId, obtenerClientes } = useClientes();
  const { obtenerDeudaTotalPorCliente, obtenerVentasPorCliente, registrarAbono, pagarVenta, registrarDevolucionRetornables, loading: ventasLoading } = useVentas();
  const { userData } = useAuth();
  const { obtenerProductoPorId, obtenerProductoPorIdDirecto } = useProducts();
  const [clientesConDeudas, setClientesConDeudas] = useState([]);
  const [isCalculating, setIsCalculating] = useState(true);
  
  // Estados para el cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [activeTab, setActiveTab] = useState('deudas');
  const [vistaMode, setVistaMode] = useState('cuaderno'); // 'ventas' o 'cuaderno'
  
  // Estados para gestión de pagos
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [pagarTodo, setPagarTodo] = useState(false);
  const [modoAbono, setModoAbono] = useState(false);
  const [montoAbono, setMontoAbono] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [loadingPago, setLoadingPago] = useState(false);
  const [expandedVentas, setExpandedVentas] = useState({});
  const [resumido, setResumido] = useState(() => {
    const saved = localStorage.getItem('deudasDestock_resumido');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Estados para gestión de botellas
  const [ventasConRetornables, setVentasConRetornables] = useState([]);
  const [cantidadesBotellas, setCantidadesBotellas] = useState({});
  const [loadingBotellas, setLoadingBotellas] = useState(false);
  const [productDetailsCache, setProductDetailsCache] = useState({});
  
  // Estado para modal de confirmación de impresión
  const [mostrarModalImprimir, setMostrarModalImprimir] = useState(false);

  const quickAccessOptions = [
    { id: 'ventas', title: 'Ventas', icon: <ShoppingCart className="h-6 w-6" />, color: 'bg-emerald-500', description: 'Registrar ventas y ver historial', path: '/ventas' },
    { id: 'deudas', title: 'Pagar Deudas', icon: <CreditCard className="h-6 w-6" />, color: 'bg-amber-500', description: 'Gestionar pagos pendientes', path: '/deudas' },
    { id: 'clientes', title: 'Clientes', icon: <Users className="h-6 w-6" />, color: 'bg-blue-500', description: 'Administrar base de clientes', path: '/clientes' },
    { id: 'escaner', title: 'Escáner de Códigos', icon: <Barcode className="h-6 w-6" />, color: 'bg-violet-500', description: 'Consultar precios por código de barras', path: '/escaner' },
    { id: 'productos', title: 'Productos', icon: <Package className="h-6 w-6" />, color: 'bg-rose-500', description: 'Inventario y catálogo', path: '/productos' },
  ];

  useEffect(() => {
    setAppear(true);

    const calcularDeudasYRetornables = async () => {
      if (clientesLoading || ventasLoading) {
        setIsCalculating(true);
        return;
      }

      setIsCalculating(true);

      const clientesConDatos = await Promise.all(
        clientes.map(async (cliente) => {
          const deudaTotal = obtenerDeudaTotalPorCliente(cliente.id);
          const ventasCliente = await obtenerVentasPorCliente(cliente.id, true);
          const totalRetornables = ventasCliente.reduce(
            (sum, venta) => sum + (venta.total_retornables || 0),
            0
          );

          return {
            ...cliente,
            deudaTotal,
            totalRetornables,
          };
        })
      );

      const clientesFiltrados = clientesConDatos.filter(
        (cliente) => cliente.deudaTotal > 0 || cliente.totalRetornables > 0
      );

      setClientesConDeudas(clientesFiltrados);
      setIsCalculating(false);
    };

    calcularDeudasYRetornables();
  }, [clientes, clientesLoading, ventasLoading, obtenerDeudaTotalPorCliente, obtenerVentasPorCliente]);

  const isLoading = clientesLoading || ventasLoading || isCalculating;

  const clientesFiltrados = clientesConDeudas.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefono.includes(searchTerm)
  );

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleClienteClick = (clienteId) => {
    navigate(`/deudas-desktop/${clienteId}`);
  };

  // Cargar cliente seleccionado cuando cambia el clienteId en la URL
  useEffect(() => {
    const cargarClienteSeleccionado = async () => {
      if (clienteId) {
        try {
          setLoadingPago(true);
          const cliente = await obtenerClientePorId(clienteId);
          setClienteSeleccionado(cliente);
          
          // Cargar ventas del cliente
          const ventasCliente = await obtenerVentasPorCliente(clienteId);
          const ventasPendientes = ventasCliente.filter(v => v.monto_pendiente > 0);
          setVentas(ventasPendientes);
          
          // Inicializar estado de acordeones
          const initialExpanded = {};
          ventasPendientes.forEach(venta => {
            initialExpanded[venta.id] = false;
          });
          setExpandedVentas(initialExpanded);
        } catch (err) {
          console.error('Error al cargar cliente:', err);
          setError('Error al cargar los datos del cliente.');
        } finally {
          setLoadingPago(false);
        }
      } else {
        setClienteSeleccionado(null);
        setVentas([]);
      }
    };
    
    cargarClienteSeleccionado();
  }, [clienteId, obtenerClientePorId, obtenerVentasPorCliente]);

  // Cargar ventas con retornables cuando se activa el tab de botellas
  useEffect(() => {
    const cargarVentasConRetornables = async () => {
      if (clienteId && activeTab === 'botellas') {
        try {
          setLoadingBotellas(true);
          const ventasCliente = await obtenerVentasPorCliente(clienteId, true);
          const ventasConRetornablesPendientes = ventasCliente.filter(v => v.total_retornables > 0);
          setVentasConRetornables(ventasConRetornablesPendientes);
          
          // Inicializar cantidades
          const initialCantidades = {};
          ventasConRetornablesPendientes.forEach(venta => {
            initialCantidades[venta.id] = 0;
          });
          setCantidadesBotellas(initialCantidades);
          
          // Cargar detalles de productos
          const cache = {};
          for (const venta of ventasConRetornablesPendientes) {
            for (const producto of venta.productos.filter(p => p.retornable && p.cantidad_retornable > 0)) {
              if (!cache[producto.producto_ref]) {
                let detalles = obtenerProductoPorId(producto.producto_ref);
                if (!detalles) {
                  detalles = await obtenerProductoPorIdDirecto(producto.producto_ref);
                }
                cache[producto.producto_ref] = detalles || { nombre: 'Producto Desconocido', imagen: '' };
              }
            }
          }
          setProductDetailsCache(cache);
        } catch (err) {
          console.error('Error al cargar ventas con retornables:', err);
          setError('Error al cargar las botellas pendientes.');
        } finally {
          setLoadingBotellas(false);
        }
      }
    };
    
    cargarVentasConRetornables();
  }, [clienteId, activeTab, obtenerVentasPorCliente, obtenerProductoPorId, obtenerProductoPorIdDirecto]);

  // Colores
  const colors = {
    primary: '#45923a',
    secondary: '#ffa40c',
    primaryLight: '#e8f5e9',
    secondaryLight: '#fff3e0',
    textDark: '#2d3748',
    textLight: '#f8f9fa'
  };

  // Calcular total de deuda del cliente seleccionado
  const totalDeuda = ventas.reduce((sum, venta) => sum + (venta.monto_pendiente || 0), 0);

  // Obtiene la fecha más reciente (ISO) dentro de todos los historial_pagos de las ventas
  const getLatestPaymentDateAcrossVentas = (ventasList) => {
    let latest = null;
    ventasList.forEach((v) => {
      if (v.historial_pagos && Array.isArray(v.historial_pagos)) {
        v.historial_pagos.forEach((p) => {
          if (p && p.fecha) {
            const d = new Date(p.fecha);
            if (!isNaN(d)) {
              if (!latest || d > latest) latest = d;
            }
          }
        });
      }
    });
    // Retornamos el objeto Date (o null) para comparar con fecha_creacion de las ventas
    return latest || null;
  };

  // Función para manejar cambio de estado resumido con localStorage
  const handleResumidoChange = (value) => {
    setResumido(value);
    localStorage.setItem('deudasDestock_resumido', JSON.stringify(value));
  };

  // Función para actualizar lista de clientes sin recargar la página
  const actualizarListaClientes = async () => {
    try {
      setIsCalculating(true);
      
      // Obtener clientes frescos desde el servidor
      await obtenerClientes();
      
      // Esperar un momento para que el contexto se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const clientesConDeudasActualizados = [];
      
      // Usar los clientes del contexto (ya actualizados)
      const clientesActuales = clientes.length > 0 ? clientes : await obtenerClientes();
      
      for (const cliente of clientesActuales) {
        const deudaInfo = await obtenerDeudaTotalPorCliente(cliente.id);
        if (deudaInfo.deuda_total > 0 || deudaInfo.total_retornables > 0) {
          clientesConDeudasActualizados.push({
            ...cliente,
            deuda_total: deudaInfo.deuda_total,
            total_retornables: deudaInfo.total_retornables
          });
        }
      }
      
      setClientesConDeudas(clientesConDeudasActualizados);
    } catch (error) {
      console.error('Error al actualizar lista de clientes:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Funciones de gestión de pagos
  const toggleExpandVenta = (ventaId) => {
    setExpandedVentas(prev => ({ ...prev, [ventaId]: !prev[ventaId] }));
  };

  const handleSelectVenta = (ventaId) => {
    setSelectedVentas((prev) =>
      prev.includes(ventaId) ? prev.filter((id) => id !== ventaId) : [...prev, ventaId]
    );
    setPagarTodo(false);
    setModoAbono(false);
    setMontoAbono('');
  };

  const handlePagarTodo = () => {
    if (pagarTodo) setSelectedVentas([]);
    else setSelectedVentas(ventas.map((venta) => venta.id));
    setPagarTodo(!pagarTodo);
    setModoAbono(false);
    setMontoAbono('');
  };

  const calcularMontoTotal = () => {
    if (pagarTodo) return ventas.reduce((sum, venta) => sum + (venta.monto_pendiente || 0), 0);
    return selectedVentas.reduce((sum, ventaId) => {
      const venta = ventas.find((v) => v.id === ventaId);
      return sum + (venta ? venta.monto_pendiente : 0);
    }, 0);
  };

  const imprimirComprobantePago = async (nombreCliente, montoAbono, deudaTotalAnterior, deudaTotalNueva) => {
    try {
      const cajero = userData?.nombre || 'Cajero';
      const response = await fetch('http://localhost:5000/api/imprimir-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_cliente: nombreCliente,
          monto_abono: montoAbono,
          cajero: cajero,
          deuda_total_anterior: deudaTotalAnterior,
          deuda_total_nueva: deudaTotalNueva
        })
      });
      if (!response.ok) console.error('Error al imprimir comprobante:', response.statusText);
      else console.log('Comprobante de pago enviado a impresión');
    } catch (error) {
      console.error('Error al llamar a la API de impresión:', error);
    }
  };

  const handleImprimirEstadoCuenta = async () => {
    try {
      if (!clienteSeleccionado || ventas.length === 0) {
        setError('No hay ventas pendientes para imprimir.');
        return;
      }

      // Formatear fecha actual
      const fechaActual = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Construir array de ventas en el formato requerido
      const ventasFormateadas = ventas.map(venta => {
        const esParcial = venta.monto_pendiente < venta.total;
        const { date, time } = formatDateTime(venta.fecha_creacion);
        const fechaHora = `${date}, ${time}`;

        if (esParcial) {
          // Venta parcial: enviar solo nombres de productos y montos
          return {
            tipo: 'parcial',
            fecha_hora: fechaHora,
            productos_nombres: venta.productos.map(p => p.nombre),
            total: parseFloat(venta.total.toFixed(2)),
            pagado: parseFloat((venta.total - venta.monto_pendiente).toFixed(2)),
            pendiente: parseFloat(venta.monto_pendiente.toFixed(2))
          };
        } else {
          // Venta pendiente completa: enviar productos detallados
          return {
            tipo: 'pendiente',
            fecha_hora: fechaHora,
            productos: venta.productos.map(producto => ({
              nombre: producto.nombre,
              cantidad: producto.cantidad,
              precio_unitario: parseFloat(producto.precio_unitario.toFixed(2)),
              subtotal: parseFloat(producto.subtotal.toFixed(2))
            }))
          };
        }
      });

      // Construir objeto completo para enviar
      const datosImpresion = {
        cliente: clienteSeleccionado.nombre,
        fecha: fechaActual,
        ventas: ventasFormateadas,
        deuda_total: parseFloat(totalDeuda.toFixed(2))
      };

      console.log('Enviando a impresión:', datosImpresion);

      // Enviar a la API de impresión
      const response = await fetch('http://localhost:5001/api/imprimir-estado-cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosImpresion)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al imprimir estado de cuenta:', errorText);
        setError('Error al enviar a impresión. Verifica que el servidor de impresión esté activo.');
      } else {
        console.log('Estado de cuenta enviado a impresión correctamente');
        // Opcional: mostrar mensaje de éxito
      }
    } catch (error) {
      console.error('Error al imprimir estado de cuenta:', error);
      setError('Error al conectar con el servidor de impresión.');
    }
  };

  const handleConfirmarPago = async () => {
    setError('');
    try {
      setLoadingPago(true);
      const deudaTotalAnterior = totalDeuda;
      let montoTotalPagado = 0;
      
      if (modoAbono) {
        const monto = parseFloat(montoAbono);
        if (isNaN(monto)) {
          setError('El monto del abono debe ser un número válido.');
          return;
        }
        montoTotalPagado = monto;
        await registrarAbono(clienteId, monto, notas);
      } else {
        if (selectedVentas.length === 0 && !pagarTodo) {
          setError('Selecciona al menos una venta o activa "Pagar todo".');
          return;
        }
        const ventasAPagar = pagarTodo ? ventas : ventas.filter(v => selectedVentas.includes(v.id));
        montoTotalPagado = ventasAPagar.reduce((sum, venta) => sum + (venta.monto_pendiente || 0), 0);
        for (const venta of ventasAPagar) await pagarVenta(venta.id);
      }
      
      const deudaTotalNueva = deudaTotalAnterior - montoTotalPagado;
      await imprimirComprobantePago(clienteSeleccionado.nombre, montoTotalPagado, deudaTotalAnterior, deudaTotalNueva);
      
      // Recargar ventas
      const ventasCliente = await obtenerVentasPorCliente(clienteId);
      const ventasPendientes = ventasCliente.filter(v => v.monto_pendiente > 0);
      setVentas(ventasPendientes);
      setSelectedVentas([]);
      setPagarTodo(false);
      setModoAbono(false);
      setMontoAbono('');
      
      // Actualizar lista de clientes sin recargar la página
      await actualizarListaClientes();
    } catch (err) {
      setError(err.message || 'Error al procesar el pago.');
      console.error(err);
    } finally {
      setLoadingPago(false);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { date: dateStr, time: timeStr };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  // Funciones para gestión de botellas
  const adjustCantidadBotella = (ventaId, increment) => {
    const venta = ventasConRetornables.find(v => v.id === ventaId);
    const currentValue = cantidadesBotellas[ventaId] || 0;
    const newValue = increment ? currentValue + 1 : currentValue - 1;

    if (newValue < 0 || newValue > venta.total_retornables) {
      return;
    }

    setCantidadesBotellas(prev => ({
      ...prev,
      [ventaId]: newValue
    }));
  };

  const calcularTotalBotellas = () => {
    return Object.values(cantidadesBotellas).reduce((sum, cantidad) => sum + cantidad, 0);
  };

  const calcularTotalBotellasCliente = () => {
    return ventasConRetornables.reduce((sum, venta) => sum + (venta.total_retornables || 0), 0);
  };

  const handleConfirmarDevolucion = async () => {
    setError('');
    try {
      setLoadingBotellas(true);
      const totalBotellas = calcularTotalBotellas();
      if (totalBotellas === 0) {
        setError('Debes especificar al menos una botella para devolver.');
        return;
      }

      for (const [ventaId, cantidad] of Object.entries(cantidadesBotellas)) {
        if (cantidad > 0) {
          await registrarDevolucionRetornables(ventaId, cantidad, '');
        }
      }

      // Recargar datos
      const ventasCliente = await obtenerVentasPorCliente(clienteId, true);
      const ventasConRetornablesPendientes = ventasCliente.filter(v => v.total_retornables > 0);
      setVentasConRetornables(ventasConRetornablesPendientes);
      
      // Reiniciar cantidades
      const initialCantidades = {};
      ventasConRetornablesPendientes.forEach(venta => {
        initialCantidades[venta.id] = 0;
      });
      setCantidadesBotellas(initialCantidades);
      
      // Actualizar lista de clientes sin recargar la página
      await actualizarListaClientes();
      
      // Recargar detalles de productos
      const cache = {};
      for (const venta of ventasConRetornablesPendientes) {
        for (const producto of venta.productos.filter(p => p.retornable && p.cantidad_retornable > 0)) {
          if (!cache[producto.producto_ref]) {
            let detalles = obtenerProductoPorId(producto.producto_ref);
            if (!detalles) {
              detalles = await obtenerProductoPorIdDirecto(producto.producto_ref);
            }
            cache[producto.producto_ref] = detalles || { nombre: 'Producto Desconocido', imagen: '' };
          }
        }
      }
      setProductDetailsCache(cache);
    } catch (err) {
      setError(err.message || 'Error al registrar la devolución.');
      console.error(err);
    } finally {
      setLoadingBotellas(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-red-100 rounded-full flex-1"></div>
        <div className="h-6 bg-blue-100 rounded-full flex-1"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
        <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        notifications={notifications}
      />
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={handleOptionClick}
        logo={Logo}
      />
      
      <main className="ml-0">
        <div className={`transition-opacity duration-500 ${appear ? 'opacity-100' : 'opacity-0'}`}>
          {/* Layout de 2 columnas */}
          <div className="flex" style={{ height: 'calc(100vh - 64px)' }}>
            
            {/* COLUMNA IZQUIERDA - Lista de Clientes */}
            <div className="w-1/4 border-r  border-gray-200 bg-white flex flex-col">
              {/* Header de la columna */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-[#45923a] to-[#34722c]">
                <h1 className="text-2xl font-bold text-white mb-2">Clientes con Deudas</h1>
                <p className="text-sm text-white/90">Selecciona un cliente para gestionar sus pagos</p>
              </div>

              {/* Buscador */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#45923a]/20 focus:border-[#45923a] bg-white"
                  />
                </div>
              </div>

              {/* Lista de clientes */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </div>
                ) : clientesFiltrados.length === 0 ? (
                  <div className="bg-gray-50 p-8 rounded-xl text-center border border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-2">
                      {searchTerm ? 'No se encontraron resultados' : 'No hay deudas pendientes'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? 'Intenta con otro término de búsqueda' : 'Todos los clientes están al día'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientesFiltrados.map((cliente) => (
                      <div
                        key={cliente.id}
                        onClick={() => handleClienteClick(cliente.id)}
                        className={`p-4 rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer ${
                          clienteId === cliente.id
                            ? 'bg-green-50 border-[#45923a] shadow-md ring-2 ring-[#45923a]/20'
                            : 'bg-white border-gray-200 hover:shadow-md hover:border-[#45923a]/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#45923a] to-[#3d8033] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {cliente.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 mb-2 truncate">
                              {cliente.nombre}
                            </h3>
                            <div className="space-y-1.5">
                              {cliente.deudaTotal > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                                  <span className="text-xs font-semibold text-red-700">
                                    Deuda: S/ {cliente.deudaTotal.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {cliente.totalRetornables > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Milk className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-semibold text-blue-700">
                                    {cliente.totalRetornables} {cliente.totalRetornables === 1 ? 'botella' : 'botellas'} pendiente{cliente.totalRetornables === 1 ? '' : 's'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer con contador */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-[#45923a]">{clientesFiltrados.length}</span>
                    {' '}cliente{clientesFiltrados.length !== 1 ? 's' : ''} con deudas o retornables
                  </p>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA - Gestión de Deudas */}
            <div className="flex-1 bg-gray-50 flex flex-col">
              {!clienteSeleccionado ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-12 w-12 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">
                      Selecciona un cliente
                    </h2>
                    <p className="text-sm text-gray-500">
                      Elige un cliente de la lista para gestionar sus pagos
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header del cliente seleccionado */}
                  <div className="p-6 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{clienteSeleccionado.nombre}</h2>
                        <p className="text-sm text-gray-500 mt-1">{clienteSeleccionado.correo}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">Deuda Total</p>
                          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDeuda)}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/deudas/${clienteId}`)}
                          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
                          title="Ver historial completo"
                        >
                          <History className="h-5 w-5" />
                          <span>Historial</span>
                        </button>
                        <button
                          onClick={() => setMostrarModalImprimir(true)}
                          disabled={loadingPago || ventas.length === 0}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 ${
                            loadingPago || ventas.length === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                          }`}
                          title="Imprimir todas las ventas pendientes"
                        >
                          <Printer className="h-5 w-5" />
                          <span>Imprimir</span>
                        </button>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setActiveTab('deudas')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                          activeTab === 'deudas'
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Deudas</span>
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveTab('botellas')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                          activeTab === 'botellas'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Milk className="h-4 w-4" />
                          <span>Botellas Pendientes</span>
                        </div>
                      </button>
                    </div>

                    {/* Botones de cambio de vista - Solo visible en tab de deudas */}
                    {activeTab === 'deudas' && (
                      <div className="flex gap-2">
                        <div className="flex gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-1">
                          <button
                            onClick={() => setVistaMode('cuaderno')}
                            className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                              vistaMode === 'cuaderno'
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              <span>Vista Cuaderno</span>
                            </div>
                          </button>
                          <button
                            onClick={() => setVistaMode('ventas')}
                            className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                              vistaMode === 'ventas'
                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Grid3x3 className="h-4 w-4" />
                              <span>Vista por Ventas</span>
                            </div>
                          </button>
                        </div>
                        {vistaMode === 'cuaderno' && (
                          <div className="form-control">
                            <label className="label cursor-pointer gap-2">
                              <span className="label-text text-xs font-medium">Resumido</span>
                              <input
                                type="checkbox"
                                className="checkbox checkbox-success checkbox-sm"
                                checked={resumido}
                                onChange={(e) => handleResumidoChange(e.target.checked)}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contenido según tab activo */}
                  {activeTab === 'deudas' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Área de contenido scrollable */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Error alert */}
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex justify-between items-start">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                              <span className="flex-1">{error}</span>
                            </div>
                            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {loadingPago ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, index) => (
                              <div key={index} className="bg-white p-4 rounded-xl shadow-sm animate-pulse border border-gray-200">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
                                  <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                                    <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : ventas.length === 0 ? (
                          <div className="bg-white p-12 rounded-xl text-center border border-gray-200">
                            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <CreditCard className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin deudas pendientes</h3>
                            <p className="text-base text-gray-500">Este cliente está al día con sus pagos</p>
                          </div>
                        ) : (
                          <>
                            {/* VISTA TIPO CUADERNO */}
                            {vistaMode === 'cuaderno' && (
                              <>
                                {/* Opciones de pago en grid */}
                                <div className="grid grid-cols-2 gap-4">
                              {/* Modo abono */}
                              <div className={`bg-white rounded-2xl shadow-md border-2 transition-all hover:shadow-lg ${
                                modoAbono ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                              }`}>
                                <label className="flex flex-col p-5 cursor-pointer h-full">
                                  <div className="flex items-center gap-3 mb-3">
                                    <input
                                      type="checkbox"
                                      checked={modoAbono}
                                      onChange={() => {
                                        setModoAbono(!modoAbono);
                                        setSelectedVentas([]);
                                        setPagarTodo(false);
                                      }}
                                      className="checkbox checkbox-warning checkbox-lg"
                                    />
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-6 w-6 text-orange-600" />
                                      <span className="text-lg font-bold text-gray-800">Abono</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">Pago parcial flexible</p>
                                  {modoAbono && (
                                    <div className="mt-auto">
                                      <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                        <Wallet className="h-3.5 w-3.5" />
                                        Monto del abono
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={montoAbono}
                                          onChange={(e) => setMontoAbono(e.target.value)}
                                          placeholder="0.00"
                                          step="0.01"
                                          min="0"
                                          className="w-full pl-9 pr-3 py-2.5 text-lg font-bold border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                        />
                                        <span className="absolute left-3 top-2.5 text-base font-semibold text-gray-600">S/</span>
                                      </div>
                                    </div>
                                  )}
                                </label>
                              </div>

                              {/* Pagar todo */}
                              <div className={`rounded-2xl shadow-md border-2 transition-all hover:shadow-lg ${
                                pagarTodo ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-200'
                              } ${modoAbono ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={!modoAbono ? handlePagarTodo : undefined}>
                                <label className="flex flex-col p-5 cursor-pointer h-full">
                                  <div className="flex items-center gap-3 mb-3">
                                    <input 
                                      type="checkbox" 
                                      checked={pagarTodo} 
                                      onChange={handlePagarTodo} 
                                      disabled={modoAbono} 
                                      className="checkbox checkbox-success checkbox-lg"
                                    />
                                    <div className="flex items-center gap-2">
                                      <CreditCard className="h-6 w-6 text-green-600" />
                                      <span className="text-lg font-bold text-gray-800">Pagar Todo</span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">Liquidar todas las deudas</p>
                                  <div className="mt-auto">
                                    <p className="text-xs text-gray-500 mb-1">Monto total</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(calcularMontoTotal())}</p>
                                  </div>
                                </label>
                                </div>
                                </div>

                                {/* Vista tipo cuaderno - Lista de productos */}
                                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
                                  {/* Header estilo cuaderno */}
                                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200 p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                      <BookOpen className="h-6 w-6 text-amber-700" />
                                      <h3 className="text-lg font-bold text-amber-900">Productos Pendientes de Pago</h3>
                                    </div>
                                    <p className="text-sm text-amber-700">Lista completa de productos que debe el cliente</p>
                                  </div>

                                  {/* Tabla estilo cuaderno */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                                            #
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Fecha
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            Producto
                                          </th>
                                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                                            Cant.
                                          </th>
                                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                                            Precio Unit.
                                          </th>
                                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                                            Subtotal
                                          </th>
                                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                                            Ver
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {(() => {
                                          if (!resumido) {
                                            return ventas.map((venta, ventaIndex) => {
                                              // Verificar si es una venta parcial (monto_pendiente < total)
                                              const esParcial = venta.monto_pendiente < venta.total;
                                          
                                          if (esParcial) {
                                            // Para ventas parciales, mostrar una sola fila con todos los productos
                                            const nombresProductos = venta.productos.map(p => p.nombre).join(', ');
                                            const montoPagado = venta.total - venta.monto_pendiente;
                                            return (
                                              <tr 
                                                key={venta.id}
                                                className={`hover:bg-amber-50/50 transition-colors ${
                                                  (selectedVentas.includes(venta.id) || pagarTodo) && !modoAbono
                                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                                    : ''
                                                }`}
                                              >
                                                <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                                                  {ventaIndex + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                      {formatDateTime(venta.fecha_creacion).date}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                      {formatDateTime(venta.fecha_creacion).time}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-orange-700">
                                                      PARCIAL
                                                    </span>
                                                    <span className="text-xs text-gray-600 italic">
                                                      {nombresProductos}
                                                    </span>
                                                    <div className="bg-gray-50 rounded-lg p-2 mt-2">
                                                      <div className="text-xs flex items-center justify-between">
                                                        <span className="text-gray-600">Total: <span className="font-semibold text-gray-800">{formatCurrency(venta.total)}</span></span>
                                                        <span className="text-green-600">Pagado: <span className="font-semibold text-green-600">{formatCurrency(montoPagado)}</span></span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  <span className="text-xs text-gray-500">-</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <span className="text-xs text-gray-500">-</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <div className="flex flex-col items-end">
                                                    <span className="text-xs text-gray-500 mb-1">Pendiente:</span>
                                                    <span className="text-base font-bold text-orange-600">
                                                      {formatCurrency(venta.monto_pendiente)}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  <button 
                                                    onClick={() => navigate(`/ventas/${venta.id}`)}
                                                    className="p-2 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all inline-flex items-center justify-center"
                                                    title="Ver nota de venta"
                                                  >
                                                    <Eye className="h-4 w-4 text-green-700" />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          } else {
                                            // Para ventas completas, mostrar cada producto
                                            return venta.productos.map((producto, productoIndex) => (
                                              <tr 
                                                key={`${venta.id}-${productoIndex}`}
                                                className={`hover:bg-amber-50/50 transition-colors ${
                                                  (selectedVentas.includes(venta.id) || pagarTodo) && !modoAbono
                                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                                    : ''
                                                }`}
                                              >
                                                <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                                                  {ventaIndex + 1}.{productoIndex + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                      {formatDateTime(venta.fecha_creacion).date}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                      {formatDateTime(venta.fecha_creacion).time}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                      {producto.nombre}
                                                    </span>
                                                    {producto.retornable && producto.cantidad_retornable > 0 && (
                                                      <div className="flex items-center gap-1 mt-1">
                                                        <RefreshCw className="h-3 w-3 text-orange-600" />
                                                        <span className="text-xs font-medium text-orange-600">
                                                          {producto.cantidad_retornable} retornables
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">
                                                    {producto.cantidad}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <span className="text-sm font-medium text-gray-700">
                                                    {formatCurrency(producto.precio_unitario)}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <span className="text-base font-bold" style={{ color: colors.primary }}>
                                                    {formatCurrency(producto.subtotal)}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  {productoIndex === 0 && (
                                                    <button 
                                                      onClick={() => navigate(`/ventas/${venta.id}`)}
                                                      className="p-2 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all inline-flex items-center justify-center"
                                                      title="Ver nota de venta"
                                                    >
                                                      <Eye className="h-4 w-4 text-green-700" />
                                                    </button>
                                                  )}
                                                </td>
                                              </tr>
                                            ));
                                          }
                                        });
                                      }

                                      // Lógica resumida: buscar fecha de pago más reciente y agrupar
                                      const latestPaymentDate = getLatestPaymentDateAcrossVentas(ventas);
                                      if (!latestPaymentDate) {
                                        // Si no hay pagos, mostrar todo normal
                                        return ventas.map((venta, ventaIndex) => {
                                          const esParcial = venta.monto_pendiente < venta.total;
                                          
                                          if (esParcial) {
                                            const nombresProductos = venta.productos.map(p => p.nombre).join(', ');
                                            const montoPagado = venta.total - venta.monto_pendiente;
                                            return (
                                              <tr key={venta.id} className="hover:bg-amber-50/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600 font-medium">{ventaIndex + 1}</td>
                                                <td className="px-4 py-3">
                                                  <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{formatDateTime(venta.fecha_creacion).date}</span>
                                                    <span className="text-xs text-gray-500">{formatDateTime(venta.fecha_creacion).time}</span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-bold text-orange-700">PARCIAL</span>
                                                    <span className="text-xs text-gray-600 italic">{nombresProductos}</span>
                                                    <div className="bg-gray-50 rounded-lg p-2 mt-2 text-xs flex items-center justify-between">
                                                      <span className="text-gray-600">Total de la venta: <span className="font-semibold text-gray-800">{formatCurrency(venta.total)}</span></span>
                                                      <span className="text-green-600">Ya pagado: <span className="font-semibold text-green-600">{formatCurrency(montoPagado)}</span></span>
                                                    </div>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-center"><span className="text-xs text-gray-500">-</span></td>
                                                <td className="px-4 py-3 text-right"><span className="text-xs text-gray-500">-</span></td>
                                                <td className="px-4 py-3 text-right">
                                                  <div className="flex flex-col items-end">
                                                    <span className="text-xs text-gray-500 mb-1">Pendiente:</span>
                                                    <span className="text-base font-bold text-orange-600">
                                                      {formatCurrency(venta.monto_pendiente)}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  <button onClick={() => navigate(`/ventas/${venta.id}`)} className="p-2 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all">
                                                    <Eye className="h-4 w-4 text-green-700" />
                                                  </button>
                                                </td>
                                              </tr>
                                            );
                                          } else {
                                            return venta.productos.map((producto, productoIndex) => (
                                              <tr key={`${venta.id}-${productoIndex}`} className="hover:bg-amber-50/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600 font-medium">{ventaIndex + 1}.{productoIndex + 1}</td>
                                                <td className="px-4 py-3">
                                                  <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{formatDateTime(venta.fecha_creacion).date}</span>
                                                    <span className="text-xs text-gray-500">{formatDateTime(venta.fecha_creacion).time}</span>
                                                  </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                  <span className="text-sm font-semibold text-gray-900">{producto.nombre}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">{producto.cantidad}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <span className="text-sm font-medium text-gray-700">{formatCurrency(producto.precio_unitario)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                  <span className="text-base font-bold" style={{ color: colors.primary }}>{formatCurrency(producto.subtotal)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                  {productoIndex === 0 && (
                                                    <button onClick={() => navigate(`/ventas/${venta.id}`)} className="p-2 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all">
                                                      <Eye className="h-4 w-4 text-green-700" />
                                                    </button>
                                                  )}
                                                </td>
                                              </tr>
                                            ));
                                          }
                                        });
                                      }

                                      // Particionar ventas por fecha_creacion vs latestPaymentDate
                                      const ventasAnteriores = ventas.filter((v) => {
                                        const fc = v.fecha_creacion ? new Date(v.fecha_creacion) : null;
                                        return fc && fc < latestPaymentDate;
                                      });

                                      const ventasPosteriores = ventas.filter((v) => {
                                        const fc = v.fecha_creacion ? new Date(v.fecha_creacion) : null;
                                        return !fc || fc >= latestPaymentDate;
                                      });

                                      const sumaDeudaRestante = ventasAnteriores.reduce((acc, v) => acc + (Number(v.monto_pendiente) || 0), 0);

                                      return (
                                        <>
                                          {/* Bloque DEUDA RESTANTE */}
                                          {ventasAnteriores.length > 0 && (
                                            <tr className="bg-red-50 border-l-4 border-red-500">
                                              <td className="px-4 py-3 text-sm text-red-700 font-bold">-</td>
                                              <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-red-700">HASTA: {formatDateTime(latestPaymentDate.toISOString()).date}</span>
                                              </td>
                                              <td className="px-4 py-3">
                                                <span className="text-sm font-bold text-red-800">DEUDA RESTANTE</span>
                                                <div className="text-xs text-red-600 mt-1">Suma de deudas anteriores</div>
                                              </td>
                                              <td className="px-4 py-3 text-center"><span className="text-xs text-gray-500">-</span></td>
                                              <td className="px-4 py-3 text-right"><span className="text-xs text-gray-500">-</span></td>
                                              <td className="px-4 py-3 text-right">
                                                <span className="text-base font-bold text-red-600">{formatCurrency(sumaDeudaRestante)}</span>
                                              </td>
                                              <td className="px-4 py-3 text-center"><span className="text-xs text-gray-500">-</span></td>
                                            </tr>
                                          )}

                                          {/* Mostrar ventas posteriores normalmente */}
                                          {ventasPosteriores.map((venta, ventaIndex) => {
                                            const esParcial = venta.monto_pendiente < venta.total;
                                            
                                            if (esParcial) {
                                              const nombresProductos = venta.productos.map(p => p.nombre).join(', ');
                                              const montoPagado = venta.total - venta.monto_pendiente;
                                              return (
                                                <tr key={venta.id} className="hover:bg-amber-50/50 transition-colors">
                                                  <td className="px-4 py-3 text-sm text-gray-600 font-medium">{ventaIndex + 1}</td>
                                                  <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                      <span className="text-sm font-medium text-gray-900">{formatDateTime(venta.fecha_creacion).date}</span>
                                                      <span className="text-xs text-gray-500">{formatDateTime(venta.fecha_creacion).time}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                      <span className="text-sm font-bold text-orange-700">PARCIAL</span>
                                                      <span className="text-xs text-gray-600 italic">{nombresProductos}</span>
                                                      <div className="bg-gray-50 rounded-lg p-2 mt-2 text-xs flex items-center justify-between">
                                                        <span className="text-gray-600">Total de la venta: <span className="font-semibold text-gray-800">{formatCurrency(venta.total)}</span></span>
                                                        <span className="text-green-600">Ya pagado: <span className="font-semibold text-green-600">{formatCurrency(montoPagado)}</span></span>
                                                      </div>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-center"><span className="text-xs text-gray-500">-</span></td>
                                                  <td className="px-4 py-3 text-right"><span className="text-xs text-gray-500">-</span></td>
                                                  <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                      <span className="text-xs text-gray-500 mb-1">Pendiente:</span>
                                                      <span className="text-base font-bold text-orange-600">
                                                        {formatCurrency(venta.monto_pendiente)}
                                                      </span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                    <button onClick={() => navigate(`/ventas/${venta.id}`)} className="p-2 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all">
                                                      <Eye className="h-4 w-4 text-green-700" />
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            } else {
                                              return venta.productos.map((producto, productoIndex) => (
                                                <tr key={`${venta.id}-${productoIndex}`} className="hover:bg-amber-50/50 transition-colors">
                                                  <td className="px-4 py-3 text-sm text-gray-600 font-medium">{ventaIndex + 1}.{productoIndex + 1}</td>
                                                  <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                      <span className="text-sm font-medium text-gray-900">{formatDateTime(venta.fecha_creacion).date}</span>
                                                      <span className="text-xs text-gray-500">{formatDateTime(venta.fecha_creacion).time}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3">
                                                    <span className="text-sm font-semibold text-gray-900">{producto.nombre}</span>
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-800">{producto.cantidad}</span>
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    <span className="text-sm font-medium text-gray-700">{formatCurrency(producto.precio_unitario)}</span>
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    <span className="text-base font-bold" style={{ color: colors.primary }}>{formatCurrency(producto.subtotal)}</span>
                                                  </td>
                                                  <td className="px-4 py-3 text-center">
                                                    {productoIndex === 0 && (
                                                      <button onClick={() => navigate(`/ventas/${venta.id}`)} className="p-2 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all">
                                                        <Eye className="h-4 w-4 text-green-700" />
                                                      </button>
                                                    )}
                                                  </td>
                                                </tr>
                                              ));
                                            }
                                          })}
                                        </>
                                      );
                                    })()}
                                      </tbody>
                                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                        <tr>
                                          <td colSpan="5" className="px-4 py-4 text-right">
                                            <span className="text-base font-bold text-gray-900">TOTAL PENDIENTE:</span>
                                          </td>
                                          <td className="px-4 py-4 text-right">
                                            <span className="text-xl font-bold text-red-600">
                                              {formatCurrency(totalDeuda)}
                                            </span>
                                          </td>
                                          <td></td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>

                                  {/* Resumen de ventas */}
                                  <div className="bg-amber-50 border-t-2 border-amber-200 p-4">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <ListOrdered className="h-4 w-4 text-amber-700" />
                                        <span className="font-semibold text-amber-900">
                                          Total de ventas: {ventas.length}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-amber-700" />
                                        <span className="font-semibold text-amber-900">
                                          Total de productos: {ventas.reduce((sum, v) => sum + v.productos.length, 0)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* VISTA POR VENTAS */}
                            {vistaMode === 'ventas' && (
                              <>
                                {/* Opciones de pago en grid */}
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Modo abono */}
                                  <div className={`bg-white rounded-2xl shadow-md border-2 transition-all hover:shadow-lg ${
                                    modoAbono ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                                  }`}>
                                    <label className="flex flex-col p-5 cursor-pointer h-full">
                                      <div className="flex items-center gap-3 mb-3">
                                        <input
                                          type="checkbox"
                                          checked={modoAbono}
                                          onChange={() => {
                                            setModoAbono(!modoAbono);
                                            setSelectedVentas([]);
                                            setPagarTodo(false);
                                          }}
                                          className="checkbox checkbox-warning checkbox-lg"
                                        />
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="h-6 w-6 text-orange-600" />
                                          <span className="text-lg font-bold text-gray-800">Abono</span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-3">Pago parcial flexible</p>
                                      {modoAbono && (
                                        <div className="mt-auto">
                                          <label className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                            <Wallet className="h-3.5 w-3.5" />
                                            Monto del abono
                                          </label>
                                          <div className="relative">
                                            <input
                                              type="number"
                                              value={montoAbono}
                                              onChange={(e) => setMontoAbono(e.target.value)}
                                              placeholder="0.00"
                                              step="0.01"
                                              min="0"
                                              className="w-full pl-9 pr-3 py-2.5 text-lg font-bold border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                                            />
                                            <span className="absolute left-3 top-2.5 text-base font-semibold text-gray-600">S/</span>
                                          </div>
                                        </div>
                                      )}
                                    </label>
                                  </div>

                                  {/* Pagar todo */}
                                  <div className={`rounded-2xl shadow-md border-2 transition-all hover:shadow-lg ${
                                    pagarTodo ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-200'
                                  } ${modoAbono ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={!modoAbono ? handlePagarTodo : undefined}>
                                    <label className="flex flex-col p-5 cursor-pointer h-full">
                                      <div className="flex items-center gap-3 mb-3">
                                        <input 
                                          type="checkbox" 
                                          checked={pagarTodo} 
                                          onChange={handlePagarTodo} 
                                          disabled={modoAbono} 
                                          className="checkbox checkbox-success checkbox-lg"
                                        />
                                        <div className="flex items-center gap-2">
                                          <CreditCard className="h-6 w-6 text-green-600" />
                                          <span className="text-lg font-bold text-gray-800">Pagar Todo</span>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 mb-3">Liquidar todas las deudas</p>
                                      <div className="mt-auto">
                                        <p className="text-xs text-gray-500 mb-1">Monto total</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(calcularMontoTotal())}</p>
                                      </div>
                                    </label>
                                  </div>
                                </div>

                                {/* Lista de ventas */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-base font-bold text-gray-800">Ventas Pendientes</h3>
                                    <span className="text-xs text-gray-500">{ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    {ventas.map((venta, index) => (
                                      <div key={venta.id} className={`rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                                        selectedVentas.includes(venta.id) || pagarTodo ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                                      } ${modoAbono ? 'opacity-50' : ''}`}>
                                        <div className="p-3">
                                          <div className="flex items-start gap-3">
                                            <label className="flex items-start gap-2 cursor-pointer flex-1">
                                              <input
                                                type="checkbox"
                                                checked={selectedVentas.includes(venta.id) || pagarTodo}
                                                onChange={() => handleSelectVenta(venta.id)}
                                                disabled={modoAbono || pagarTodo}
                                                className="checkbox checkbox-primary mt-1"
                                              />
                                              <div className="flex-1 space-y-2">
                                                {/* Header */}
                                                <div className="flex items-center justify-between">
                                                  <p className="text-sm font-bold text-gray-900">Compra #{index + 1}</p>
                                                  <button 
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      navigate(`/ventas/${venta.id}`);
                                                    }} 
                                                    className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all"
                                                    title="Ver nota"
                                                  >
                                                    <Eye className="h-4 w-4 text-green-700" />
                                                  </button>
                                                </div>
                                                
                                                {/* Fecha y hora */}
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                  <Calendar className="h-3 w-3 text-blue-600" />
                                                  <span>{formatDateTime(venta.fecha_creacion).date}</span>
                                                  <Clock className="h-3 w-3 text-purple-600 ml-1" />
                                                  <span className="text-gray-500">{formatDateTime(venta.fecha_creacion).time}</span>
                                                </div>
                                                
                                                {/* Montos */}
                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                                                  <div>
                                                    <p className="text-xs text-gray-500">Total</p>
                                                    <p className="text-sm font-bold text-gray-700">{formatCurrency(venta.total)}</p>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-xs text-gray-500">Pendiente</p>
                                                    <p className="text-sm font-bold text-red-600">{formatCurrency(venta.monto_pendiente)}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </label>
                                          </div>
                                        </div>
                                      <button onClick={() => toggleExpandVenta(venta.id)} className="w-full px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50">
                                        <div className="flex items-center gap-2">
                                          <ListOrdered className="h-4 w-4 text-purple-600" />
                                          <span className="font-medium">Ver productos comprados</span>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedVentas[venta.id] ? 'rotate-180' : ''}`} />
                                      </button>
                                      {expandedVentas[venta.id] && (
                                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                                          <div className="space-y-2">
                                            {venta.productos.map((producto, pIndex) => (
                                              <div key={pIndex} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                                                <div className="flex-1">
                                                  <p className="font-semibold text-gray-800 mb-1">{producto.nombre}</p>
                                                  <p className="text-sm text-gray-500 flex items-center gap-2">
                                                    <Package className="h-3 w-3" />
                                                    {producto.cantidad} × {formatCurrency(producto.precio_unitario)}
                                                  </p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="font-bold text-base" style={{ color: colors.primary }}>{formatCurrency(producto.subtotal)}</p>
                                                  {producto.retornable && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                      <RefreshCw className="h-3 w-3" style={{ color: colors.secondary }} />
                                                      <p className="text-xs font-medium" style={{ color: colors.secondary }}>{producto.cantidad_retornable} retornables</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* Footer con botones */}
                      {ventas.length > 0 && (
                        <div className="bg-white border-t-2 border-gray-200 p-8 shadow-lg">
                          <div className="flex items-center gap-6">
                            {/* Total a pagar y deuda restante */}
                            <div className="flex-1 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                              <div className="grid grid-cols-2 gap-6">
                                {/* Total a pagar */}
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="h-6 w-6 text-gray-600" />
                                    <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                                      {formatCurrency(modoAbono ? parseFloat(montoAbono) || 0 : calcularMontoTotal())}
                                    </span>
                                  </div>
                                  {modoAbono && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold mt-2">
                                      <DollarSign className="h-3 w-3" />
                                      Abono Parcial
                                    </span>
                                  )}
                                  {pagarTodo && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mt-2">
                                      <CreditCard className="h-3 w-3" />
                                      Pago Total
                                    </span>
                                  )}
                                </div>

                                {/* Deuda restante */}
                                <div className="border-l-2 border-gray-300 pl-6">
                                  <p className="text-sm text-gray-600 mb-1">Quedaría debiendo</p>
                                  <div className="flex items-center gap-3">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                    <span className="text-3xl font-bold text-red-600">
                                      {formatCurrency(
                                        modoAbono 
                                          ? Math.max(0, totalDeuda - (parseFloat(montoAbono) || 0))
                                          : pagarTodo 
                                            ? 0 
                                            : totalDeuda - calcularMontoTotal()
                                      )}
                                    </span>
                                  </div>
                                  {(modoAbono || (!pagarTodo && selectedVentas.length > 0)) && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      Deuda actual: {formatCurrency(totalDeuda)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botón confirmar pago */}
                            <button
                              onClick={handleConfirmarPago}
                              disabled={loadingPago || (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : !pagarTodo && selectedVentas.length === 0)}
                              className={`px-12 py-6 rounded-2xl flex items-center justify-center gap-3 text-xl font-bold shadow-lg transition-all ${
                                loadingPago || (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : !pagarTodo && selectedVentas.length === 0)
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'text-white hover:shadow-2xl hover:scale-105 active:scale-100'
                              }`}
                              style={{ background: loadingPago || (modoAbono ? !montoAbono || parseFloat(montoAbono) <= 0 : !pagarTodo && selectedVentas.length === 0) ? undefined : `linear-gradient(135deg, ${colors.secondary} 0%, #e69500 100%)` }}
                            >
                              {loadingPago ? (
                                <>
                                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Procesando...</span>
                                </>
                              ) : (
                                <>
                                  <DollarSign size={28} />
                                  <span>{modoAbono ? 'Registrar Abono' : 'Confirmar Pago'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab de Botellas Pendientes */}
                  {activeTab === 'botellas' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Área de contenido scrollable */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Error alert */}
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex justify-between items-start">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                              <span className="flex-1">{error}</span>
                            </div>
                            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {loadingBotellas ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, index) => (
                              <div key={index} className="bg-white p-4 rounded-xl shadow-sm animate-pulse border border-gray-200">
                                <div className="flex items-center gap-4">
                                  <div className="w-6 h-6 bg-gray-200 rounded-lg"></div>
                                  <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                                    <div className="h-3 bg-gray-200 rounded-lg w-1/2"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : ventasConRetornables.length === 0 ? (
                          <div className="bg-white p-12 rounded-xl text-center border border-gray-200">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <Milk className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin retornables pendientes</h3>
                            <p className="text-base text-gray-500">Este cliente no tiene botellas para devolver</p>
                          </div>
                        ) : (
                          <>
                            {/* Lista de ventas con retornables */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-base font-bold text-gray-800">Ventas con Retornables</h3>
                                <span className="text-xs text-gray-500">{ventasConRetornables.length} {ventasConRetornables.length === 1 ? 'venta' : 'ventas'}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {ventasConRetornables.map((venta) => (
                                  <div key={venta.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-md transition-all">
                                    <div className="p-4">
                                      {/* Header */}
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Milk className="h-4 w-4 text-blue-600" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-gray-900">Venta #{venta.id.slice(0, 8)}</p>
                                            <p className="text-xs text-gray-500">{formatDate(venta.fecha_creacion)}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                            {venta.total_retornables} {venta.total_retornables === 1 ? 'botella' : 'botellas'}
                                          </p>
                                          <button 
                                            onClick={() => navigate(`/ventas/${venta.id}`)} 
                                            className="p-1.5 rounded-lg bg-green-100 hover:bg-green-200 border border-green-200 transition-all"
                                            title="Ver nota de venta"
                                          >
                                            <Eye className="h-4 w-4 text-green-700" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Productos retornables */}
                                      <div className="space-y-2 mb-3">
                                        {venta.productos
                                          .filter(p => p.retornable && p.cantidad_retornable > 0)
                                          .map((producto) => {
                                            const { nombre, imagen } = productDetailsCache[producto.producto_ref] || { nombre: 'Cargando...', imagen: null };
                                            return (
                                              <div key={producto.producto_ref} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                                {imagen ? (
                                                  <img src={imagen} alt={nombre} className="w-10 h-10 rounded-lg object-cover border border-gray-100" onError={(e) => { e.target.style.display = 'none'; }} />
                                                ) : (
                                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 border border-gray-100">
                                                    <Package className="h-5 w-5 text-gray-400" />
                                                  </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-semibold text-gray-800 truncate">{nombre}</p>
                                                  <p className="text-xs text-gray-500">{producto.cantidad_retornable} disponibles</p>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>

                                      {/* Selector de cantidad */}
                                      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-semibold text-gray-700">Botellas a devolver</span>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => adjustCantidadBotella(venta.id, false)}
                                              disabled={(cantidadesBotellas[venta.id] || 0) === 0}
                                              className="w-8 h-8 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95 transition-all"
                                            >
                                              <Minus className="h-4 w-4 text-gray-600" />
                                            </button>
                                            <div className="w-12 text-center">
                                              <span className="text-lg font-bold text-gray-800">{cantidadesBotellas[venta.id] || 0}</span>
                                            </div>
                                            <button
                                              onClick={() => adjustCantidadBotella(venta.id, true)}
                                              disabled={(cantidadesBotellas[venta.id] || 0) >= venta.total_retornables}
                                              className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 active:scale-95 transition-all"
                                            >
                                              <Plus className="h-4 w-4 text-white" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer con botón */}
                      {ventasConRetornables.length > 0 && (
                        <div className="bg-white border-t-2 border-gray-200 p-8 shadow-lg">
                          <div className="flex items-center gap-6">
                            {/* Total a devolver */}
                            <div className="flex-1 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Total a devolver</p>
                                  <div className="flex items-center gap-3">
                                    <Milk className="h-6 w-6 text-blue-600" />
                                    <span className="text-3xl font-bold text-blue-700">
                                      {calcularTotalBotellas()}
                                    </span>
                                    <span className="text-lg text-gray-600">
                                      {calcularTotalBotellas() === 1 ? 'botella' : 'botellas'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Botón confirmar devolución */}
                            <button
                              onClick={handleConfirmarDevolucion}
                              disabled={loadingBotellas || calcularTotalBotellas() === 0}
                              className={`px-12 py-6 rounded-2xl flex items-center justify-center gap-3 text-xl font-bold shadow-lg transition-all ${
                                loadingBotellas || calcularTotalBotellas() === 0
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-2xl hover:scale-105 active:scale-100'
                              }`}
                            >
                              {loadingBotellas ? (
                                <>
                                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Procesando...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={28} />
                                  <span>Confirmar Devolución</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmación de impresión */}
      {mostrarModalImprimir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Printer className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirmar Impresión</h3>
                  <p className="text-sm text-blue-100">Estado de cuenta del cliente</p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 text-base mb-4">
                  ¿Está seguro que desea imprimir el estado de cuenta de <span className="font-bold text-gray-900">{clienteSeleccionado?.nombre}</span>?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-semibold mb-1">
                        Se imprimirán {ventas.length} {ventas.length === 1 ? 'venta' : 'ventas'} pendiente{ventas.length === 1 ? '' : 's'}
                      </p>
                      <p className="text-sm text-blue-700">
                        Deuda total: <span className="font-bold">{formatCurrency(totalDeuda)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModalImprimir(false)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setMostrarModalImprimir(false);
                    handleImprimirEstadoCuenta();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Printer className="h-5 w-5" />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeudasDestock;
