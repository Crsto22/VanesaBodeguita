import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, runTransaction, getDocs, getDoc, deleteDoc, orderBy, limit, startAfter, endBefore, limitToLast } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useClientes } from './ClientesContext';
import { useProducts } from './ProductContext';

const VentasContext = createContext();

export const useVentas = () => useContext(VentasContext);

export const VentasProvider = ({ children }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para paginación del historial
  const [ventasHistorial, setVentasHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [ultimoDocumento, setUltimoDocumento] = useState(null);
  const [primerDocumento, setPrimerDocumento] = useState(null);
  const [hayMasPaginas, setHayMasPaginas] = useState(true);
  const [historialPaginacion, setHistorialPaginacion] = useState([]);
  
  const { currentUser } = useAuth();
  const { clientes, obtenerClientePorId } = useClientes();
  const productsContext = useProducts();
  const { obtenerProductoPorIdDirecto } = productsContext || {};

  // Configuración de paginación
  const VENTAS_POR_PAGINA = 5;

  // Referencia a la colección de ventas
  const ventasCollection = collection(db, 'ventas');

  // Función para formatear números a 2 decimales
  const formatToTwoDecimals = (num) => {
    return parseFloat(num.toFixed(2));
  };

  // Obtener ventas en tiempo real (solo pendientes o parciales)
  useEffect(() => {
    if (!currentUser) {
      setVentas([]);
      setLoading(false);
      return;
    }

    const ventasQuery = query(ventasCollection, where('estado', 'in', ['pendiente', 'parcial']));
    const unsubscribe = onSnapshot(ventasQuery, (snapshot) => {
      const ventasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVentas(ventasData);
      setLoading(false);
    }, (error) => {
      console.error('Error al obtener ventas:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Obtener todas las ventas (sin filtro de estado)
  const obtenerTodasVentas = async () => {
    try {
      const snapshot = await getDocs(ventasCollection);
      const ventasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return ventasData;
    } catch (error) {
      console.error('Error al obtener todas las ventas:', error);
      throw error;
    }
  };

  // Crear una nueva venta
  const crearVenta = async (ventaData) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');
      if (ventaData.cliente_ref && !obtenerClientePorId(ventaData.cliente_ref)) {
        throw new Error('Cliente no encontrado');
      }

      // Validar estado
      const validEstados = ['pendiente', 'parcial', 'pagado'];
      if (!validEstados.includes(ventaData.estado)) {
        throw new Error(`Estado inválido: ${ventaData.estado}`);
      }

      // Validar y procesar productos
      let total = 0;
      let totalRetornables = 0;
      const productosProcesados = await Promise.all(ventaData.productos.map(async (item) => {
        let producto = null;
        if (item.producto_ref && obtenerProductoPorIdDirecto) {
          producto = await obtenerProductoPorIdDirecto(item.producto_ref);
          if (!producto) throw new Error(`Producto ${item.producto_ref} no encontrado`);
        }
        if (item.cantidad <= 0) throw new Error(`Cantidad inválida para ${item.nombre}`);
        if (item.cantidad_retornable > item.cantidad) throw new Error(`Cantidad retornable inválida para ${item.nombre}`);
        if (item.precio_unitario <= 0) throw new Error(`Precio unitario inválido para ${item.nombre}`);
        
        const subtotalCalculado = formatToTwoDecimals(item.cantidad * item.precio_unitario);
        if (Math.abs(item.subtotal - subtotalCalculado) > 0.01) {
          throw new Error(`Subtotal inválido para ${item.nombre}`);
        }

        const cantidadRetornable = item.retornable ? item.cantidad_retornable || 0 : 0;
        total += subtotalCalculado;
        
        // Sumar directamente cantidad_retornable (que ahora representa botellas que debe)
        if (item.retornable) {
          totalRetornables += cantidadRetornable;
        }

        return {
          producto_ref: item.producto_ref || null,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: formatToTwoDecimals(item.precio_unitario),
          subtotal: formatToTwoDecimals(subtotalCalculado),
          retornable: item.retornable || false,
          cantidad_retornable: cantidadRetornable,
        };
      }));

      total = formatToTwoDecimals(total);
      totalRetornables = formatToTwoDecimals(totalRetornables);

      // Validar montos y historial de pagos
      const montoPagado = ventaData.monto_pagado ? formatToTwoDecimals(Number(ventaData.monto_pagado)) : 0;
      const montoPendiente = ventaData.monto_pendiente ? formatToTwoDecimals(Number(ventaData.monto_pendiente)) : 0;
      const historialPagos = Array.isArray(ventaData.historial_pagos) ? ventaData.historial_pagos : [];

      if (Math.abs(total - (montoPagado + montoPendiente)) > 0.01) {
        throw new Error('La suma de monto_pagado y monto_pendiente no coincide con el total');
      }

      if (ventaData.estado === 'pendiente') {
        if (montoPagado !== 0) throw new Error('Monto pagado debe ser 0 para estado pendiente');
        if (montoPendiente !== total) throw new Error('Monto pendiente debe igualar el total para estado pendiente');
        if (historialPagos.length > 0) throw new Error('Historial de pagos debe estar vacío para estado pendiente');
      } else if (ventaData.estado === 'pagado') {
        if (montoPagado !== total) throw new Error('Monto pagado debe igualar el total para estado pagado');
        if (montoPendiente !== 0) throw new Error('Monto pendiente debe ser 0 para estado pagado');
      } else if (ventaData.estado === 'parcial') {
        if (montoPagado <= 0 || montoPagado >= total) {
          throw new Error('Monto pagado debe ser mayor a 0 y menor al total para estado parcial');
        }
      }

      const nuevaVenta = {
        cliente_ref: ventaData.cliente_ref || null,
        nombre_cliente: ventaData.cliente_ref ? obtenerClientePorId(ventaData.cliente_ref).nombre : (ventaData.nombre_cliente || 'Cliente Genérico'),
        cajero_ref: currentUser.uid,
        fecha_creacion: new Date().toISOString(),
        estado: ventaData.estado,
        productos: productosProcesados,
        total: total,
        monto_pagado: montoPagado,
        monto_pendiente: montoPendiente,
        total_retornables: totalRetornables,
        notas: ventaData.notas || '',
        historial_pagos: historialPagos.map(pago => ({
          ...pago,
          monto: formatToTwoDecimals(Number(pago.monto)),
        })),
        historial_retornables: [],
      };

      const docRef = await addDoc(ventasCollection, nuevaVenta);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear venta:', error);
      throw error;
    }
  };

  // Pagar una venta completa
  const pagarVenta = async (ventaId) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');

      const ventaRef = doc(db, 'ventas', ventaId);
      const ventaDoc = await getDoc(ventaRef);

      if (!ventaDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      const ventaData = ventaDoc.data();
      const montoPendiente = formatToTwoDecimals(ventaData.monto_pendiente);
      const montoPagado = formatToTwoDecimals(ventaData.monto_pagado + montoPendiente);

      const pago = {
        monto: montoPendiente,
        fecha: new Date().toISOString(),
        cajero_ref: currentUser.uid,
        notas: '',
      };

      await updateDoc(ventaRef, {
        estado: 'pagado',
        monto_pagado: montoPagado,
        monto_pendiente: 0,
        historial_pagos: [...(ventaData.historial_pagos || []), pago],
      });

      return { ventaId, montoPagado };
    } catch (error) {
      console.error('Error al pagar venta:', error);
      throw error;
    }
  };

  // Registrar un abono
  const registrarAbono = async (clienteId, montoAbono, notas) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');
      const montoAbonoFormatted = formatToTwoDecimals(Number(montoAbono));
      if (montoAbonoFormatted <= 0) throw new Error('El monto del abono debe ser mayor a 0');
      if (!obtenerClientePorId(clienteId)) throw new Error('Cliente no encontrado');

      const ventasQuery = query(
        ventasCollection,
        where('cliente_ref', '==', clienteId),
        where('estado', 'in', ['pendiente', 'parcial'])
      );
      const snapshot = await getDocs(ventasQuery);
      if (snapshot.empty) throw new Error('No hay ventas pendientes para este cliente');

      let montoRestante = montoAbonoFormatted;
      let deudaTotal = 0;
      snapshot.forEach(doc => deudaTotal += formatToTwoDecimals(doc.data().monto_pendiente));
      
      if (montoAbonoFormatted > deudaTotal) {
        throw new Error(`El abono de ${montoAbonoFormatted} soles excede la deuda total de ${deudaTotal} soles`);
      }

      const updates = [];
      snapshot.docs
        .sort((a, b) => a.data().fecha_creacion.localeCompare(b.data().fecha_creacion))
        .forEach(doc => {
          if (montoRestante <= 0) return;

          const ventaData = doc.data();
          const montoPendiente = formatToTwoDecimals(ventaData.monto_pendiente);
          const montoAPagar = formatToTwoDecimals(Math.min(montoPendiente, montoRestante));
          const nuevoMontoPagado = formatToTwoDecimals((ventaData.monto_pagado || 0) + montoAPagar);
          const nuevoMontoPendiente = formatToTwoDecimals(ventaData.total - nuevoMontoPagado);
          const nuevoEstado = nuevoMontoPagado >= ventaData.total ? 'pagado' : 'parcial';

          const abono = {
            monto: montoAPagar,
            fecha: new Date().toISOString(),
            cajero_ref: currentUser.uid,
            notas: notas || '',
          };

          updates.push({
            ventaRef: doc.ref,
            data: {
              monto_pagado: nuevoMontoPagado,
              monto_pendiente: nuevoMontoPendiente,
              estado: nuevoEstado,
              historial_pagos: [...(ventaData.historial_pagos || []), abono],
            },
          });

          montoRestante = formatToTwoDecimals(montoRestante - montoAPagar);
        });

      await runTransaction(db, async (transaction) => {
        updates.forEach(({ ventaRef, data }) => {
          transaction.update(ventaRef, data);
        });
      });

      return updates;
    } catch (error) {
      console.error('Error al registrar abono:', error);
      throw error;
    }
  };

  // Registrar devolución de retornables
  const registrarDevolucionRetornables = async (ventaId, cantidadDevuelta, notas) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');
      if (cantidadDevuelta <= 0) throw new Error('La cantidad devuelta debe ser mayor a 0');

      const ventaRef = doc(db, 'ventas', ventaId);
      const ventaDoc = await getDoc(ventaRef);
      if (!ventaDoc.exists()) throw new Error('Venta no encontrada');

      const venta = ventaDoc.data();
      if (cantidadDevuelta > venta.total_retornables) {
        throw new Error(`No se pueden devolver ${cantidadDevuelta} retornables, solo adeuda ${venta.total_retornables}`);
      }

      const devolucion = {
        cantidad: cantidadDevuelta,
        fecha: new Date().toISOString(),
        cajero_ref: currentUser.uid,
        notas: notas || '',
      };

      await runTransaction(db, async (transaction) => {
        transaction.update(ventaRef, {
          total_retornables: formatToTwoDecimals(venta.total_retornables - cantidadDevuelta),
          historial_retornables: [...(venta.historial_retornables || []), devolucion],
        });
      });

      return devolucion;
    } catch (error) {
      console.error('Error al registrar devolución de retornables:', error);
      throw error;
    }
  };

  // Obtener ventas por cliente
  const obtenerVentasPorCliente = async (clienteId, includePagado = false) => {
    try {
      const estados = includePagado ? ['pendiente', 'parcial', 'pagado'] : ['pendiente', 'parcial'];
      const ventasQuery = query(
        ventasCollection,
        where('cliente_ref', '==', clienteId),
        where('estado', 'in', estados)
      );
      const snapshot = await getDocs(ventasQuery);
      const ventasData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          monto_pagado: formatToTwoDecimals(doc.data().monto_pagado || 0),
          monto_pendiente: formatToTwoDecimals(doc.data().monto_pendiente || 0),
          total: formatToTwoDecimals(doc.data().total || 0),
        }))
        .filter(venta => includePagado ? (venta.monto_pendiente > 0 || venta.total_retornables > 0) : venta.monto_pendiente > 0);
      return ventasData;
    } catch (error) {
      console.error('Error al obtener ventas por cliente:', error);
      throw error;
    }
  };

  // Obtener deuda total por cliente
  const obtenerDeudaTotalPorCliente = (clienteId) => {
    try {
      const ventasCliente = ventas.filter(v => v.cliente_ref === clienteId);
      const deudaTotal = ventasCliente.reduce((sum, venta) => sum + (venta.monto_pendiente || 0), 0);
      return formatToTwoDecimals(deudaTotal);
    } catch (error) {
      console.error('Error al calcular deuda total por cliente:', error);
      return 0;
    }
  };

  // Obtener venta por ID
  const obtenerVentaPorId = async (id) => {
    try {
      const ventaRef = doc(db, 'ventas', id);
      const ventaDoc = await getDoc(ventaRef);
      if (!ventaDoc.exists()) return null;
      
      const ventaData = ventaDoc.data();
      return {
        id: ventaDoc.id,
        ...ventaData,
        monto_pagado: formatToTwoDecimals(ventaData.monto_pagado || 0),
        monto_pendiente: formatToTwoDecimals(ventaData.monto_pendiente || 0),
        total: formatToTwoDecimals(ventaData.total || 0),
      };
    } catch (error) {
      console.error('Error al obtener venta por ID:', error);
      return null;
    }
  };

  // Obtener todos los datos de una venta por ID, incluyendo el nombre del cajero
  const obtenerVentaCompletaPorId = async (ventaId) => {
    try {
      const ventaRef = doc(db, 'ventas', ventaId);
      const ventaDoc = await getDoc(ventaRef);

      if (!ventaDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      const ventaData = ventaDoc.data();

      let nombreCajero = 'Desconocido';
      if (ventaData.cajero_ref) {
        const cajeroRef = doc(db, 'usuarios', ventaData.cajero_ref);
        const cajeroDoc = await getDoc(cajeroRef);
        if (cajeroDoc.exists()) {
          const cajeroData = cajeroDoc.data();
          nombreCajero = cajeroData.nombre || 'Cajero sin nombre';
        }
      }

      return {
        id: ventaDoc.id,
        ...ventaData,
        monto_pagado: formatToTwoDecimals(ventaData.monto_pagado || 0),
        monto_pendiente: formatToTwoDecimals(ventaData.monto_pendiente || 0),
        total: formatToTwoDecimals(ventaData.total || 0),
        nombre_cajero: nombreCajero,
      };
    } catch (error) {
      console.error('Error al obtener venta completa:', error);
      throw error;
    }
  };

  // Eliminar una venta por ID
  const eliminarVenta = async (ventaId) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');

      const ventaRef = doc(db, 'ventas', ventaId);
      const ventaDoc = await getDoc(ventaRef);

      if (!ventaDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      await deleteDoc(ventaRef);
      return true;
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      throw error;
    }
  };

  // ============= FUNCIONES DE PAGINACIÓN PARA HISTORIAL =============

  // Cargar primera página del historial
  const cargarPrimerasPaginaHistorial = async (filtros = {}) => {
    try {
      setLoadingHistorial(true);
      
      let ventasQuery = query(
        ventasCollection,
        orderBy('fecha_creacion', 'desc'),
        limit(VENTAS_POR_PAGINA)
      );

      // Aplicar filtros si existen
      if (filtros.fechaInicio && filtros.fechaFin) {
        ventasQuery = query(
          ventasCollection,
          where('fecha_creacion', '>=', filtros.fechaInicio),
          where('fecha_creacion', '<=', filtros.fechaFin),
          orderBy('fecha_creacion', 'desc'),
          limit(VENTAS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(ventasQuery);
      const ventasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        monto_pagado: formatToTwoDecimals(doc.data().monto_pagado || 0),
        monto_pendiente: formatToTwoDecimals(doc.data().monto_pendiente || 0),
        total: formatToTwoDecimals(doc.data().total || 0),
      }));

      setVentasHistorial(ventasData);
      setPaginaActual(1);
      setHistorialPaginacion([]);
      
      if (snapshot.docs.length > 0) {
        setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
        setPrimerDocumento(snapshot.docs[0]);
        setHayMasPaginas(snapshot.docs.length === VENTAS_POR_PAGINA);
      } else {
        setUltimoDocumento(null);
        setPrimerDocumento(null);
        setHayMasPaginas(false);
      }

      return ventasData;
    } catch (error) {
      console.error('Error al cargar primera página del historial:', error);
      throw error;
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Cargar siguiente página
  const cargarSiguientePaginaHistorial = async (filtros = {}) => {
    try {
      if (!ultimoDocumento || !hayMasPaginas) return;

      setLoadingHistorial(true);

      let ventasQuery = query(
        ventasCollection,
        orderBy('fecha_creacion', 'desc'),
        startAfter(ultimoDocumento),
        limit(VENTAS_POR_PAGINA)
      );

      // Aplicar filtros si existen
      if (filtros.fechaInicio && filtros.fechaFin) {
        ventasQuery = query(
          ventasCollection,
          where('fecha_creacion', '>=', filtros.fechaInicio),
          where('fecha_creacion', '<=', filtros.fechaFin),
          orderBy('fecha_creacion', 'desc'),
          startAfter(ultimoDocumento),
          limit(VENTAS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(ventasQuery);
      const ventasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        monto_pagado: formatToTwoDecimals(doc.data().monto_pagado || 0),
        monto_pendiente: formatToTwoDecimals(doc.data().monto_pendiente || 0),
        total: formatToTwoDecimals(doc.data().total || 0),
      }));

      if (snapshot.docs.length > 0) {
        // Guardar referencia de la página anterior
        setHistorialPaginacion(prev => [...prev, { primerDoc: primerDocumento, ultimoDoc: ultimoDocumento }]);
        
        setVentasHistorial(ventasData);
        setPaginaActual(prev => prev + 1);
        setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
        setPrimerDocumento(snapshot.docs[0]);
        setHayMasPaginas(snapshot.docs.length === VENTAS_POR_PAGINA);
      }

      return ventasData;
    } catch (error) {
      console.error('Error al cargar siguiente página:', error);
      throw error;
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Cargar página anterior
  const cargarPaginaAnteriorHistorial = async (filtros = {}) => {
    try {
      if (paginaActual <= 1 || historialPaginacion.length === 0) return;

      setLoadingHistorial(true);

      const paginaAnterior = historialPaginacion[historialPaginacion.length - 1];

      let ventasQuery = query(
        ventasCollection,
        orderBy('fecha_creacion', 'desc'),
        endBefore(paginaAnterior.ultimoDoc),
        limitToLast(VENTAS_POR_PAGINA)
      );

      // Aplicar filtros si existen
      if (filtros.fechaInicio && filtros.fechaFin) {
        ventasQuery = query(
          ventasCollection,
          where('fecha_creacion', '>=', filtros.fechaInicio),
          where('fecha_creacion', '<=', filtros.fechaFin),
          orderBy('fecha_creacion', 'desc'),
          endBefore(paginaAnterior.ultimoDoc),
          limitToLast(VENTAS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(ventasQuery);
      const ventasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        monto_pagado: formatToTwoDecimals(doc.data().monto_pagado || 0),
        monto_pendiente: formatToTwoDecimals(doc.data().monto_pendiente || 0),
        total: formatToTwoDecimals(doc.data().total || 0),
      }));

      setVentasHistorial(ventasData);
      setPaginaActual(prev => prev - 1);
      setHistorialPaginacion(prev => prev.slice(0, -1));
      
      if (snapshot.docs.length > 0) {
        setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
        setPrimerDocumento(snapshot.docs[0]);
        setHayMasPaginas(true);
      }

      return ventasData;
    } catch (error) {
      console.error('Error al cargar página anterior:', error);
      throw error;
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Reiniciar paginación
  const reiniciarPaginacionHistorial = async (filtros = {}) => {
    setPaginaActual(1);
    setUltimoDocumento(null);
    setPrimerDocumento(null);
    setHayMasPaginas(true);
    setHistorialPaginacion([]);
    await cargarPrimerasPaginaHistorial(filtros);
  };

  const value = {
    ventas,
    loading,
    // Estados del historial con paginación
    ventasHistorial,
    loadingHistorial,
    paginaActual,
    hayMasPaginas,
    VENTAS_POR_PAGINA,
    // Funciones del historial con paginación
    cargarPrimerasPaginaHistorial,
    cargarSiguientePaginaHistorial,
    cargarPaginaAnteriorHistorial,
    reiniciarPaginacionHistorial,
    // Funciones existentes
    crearVenta,
    pagarVenta,
    registrarAbono,
    registrarDevolucionRetornables,
    obtenerVentasPorCliente,
    obtenerVentaPorId,
    obtenerVentaCompletaPorId,
    obtenerDeudaTotalPorCliente,
    obtenerTodasVentas,
    eliminarVenta,
  };

  return (
    <VentasContext.Provider value={value}>
      {children}
    </VentasContext.Provider>
  );
};

export default VentasProvider;