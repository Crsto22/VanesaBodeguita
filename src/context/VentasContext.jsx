
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where, runTransaction, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useClientes } from './ClientesContext';
import { useProducts } from './ProductContext';

const VentasContext = createContext();

export const useVentas = () => useContext(VentasContext);

export const VentasProvider = ({ children }) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { clientes, obtenerClientePorId } = useClientes();
  const { productos, obtenerProductoPorId } = useProducts();

  // Referencia a la colección de ventas
  const ventasCollection = collection(db, 'ventas');

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
      const productosProcesados = ventaData.productos.map(item => {
        const producto = obtenerProductoPorId(item.producto_ref);
        if (!producto) throw new Error(`Producto ${item.producto_ref} no encontrado`);
        if (item.cantidad <= 0) throw new Error(`Cantidad inválida para ${producto.nombre}`);
        if (item.precio_unitario <= 0) throw new Error(`Precio unitario inválido para ${producto.nombre}`);
        if (Math.abs(item.subtotal - item.cantidad * item.precio_unitario) > 0.01) {
          throw new Error(`Subtotal inválido para ${producto.nombre}`);
        }

        const cantidadRetornable = producto.retornable ? item.cantidad_retornable || 0 : 0;
        total += item.subtotal;
        totalRetornables += cantidadRetornable;

        return {
          producto_ref: item.producto_ref,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
          retornable: producto.retornable,
          cantidad_retornable: cantidadRetornable,
        };
      });

      // Validar montos y historial de pagos
      const montoPagado = Number(ventaData.monto_pagado) || 0;
      const montoPendiente = Number(ventaData.monto_pendiente) || 0;
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
        if (historialPagos.length > 0) throw new Error('Historial de pagos debe estar vacío para estado pagado');
      } else if (ventaData.estado === 'parcial') {
        if (montoPagado <= 0 || montoPagado >= total) {
          throw new Error('Monto pagado debe ser mayor a 0 y menor al total para estado parcial');
        }
        if (historialPagos.length !== 1) throw new Error('Historial de pagos debe tener exactamente un registro para estado parcial');
        const pago = historialPagos[0];
        if (Math.abs(pago.monto - montoPagado) > 0.01 || pago.cajero_ref !== currentUser.uid) {
          throw new Error('El registro de pago no coincide con monto_pagado o cajero_ref');
        }
      }

      const nuevaVenta = {
        cliente_ref: ventaData.cliente_ref || null,
        nombre_cliente: ventaData.nombre_cliente || 'Cliente Genérico',
        cajero_ref: currentUser.uid,
        fecha_creacion: new Date().toISOString(),
        estado: ventaData.estado,
        productos: productosProcesados,
        total: total,
        monto_pagado: montoPagado,
        monto_pendiente: montoPendiente,
        total_retornables: totalRetornables,
        notas: ventaData.notas || '',
        historial_pagos: historialPagos,
        historial_retornables: [],
      };

      console.log('Venta Data recibida:', ventaData);
      console.log('Nueva Venta a guardar:', nuevaVenta);

      const docRef = await addDoc(ventasCollection, nuevaVenta);

      return docRef.id;
    } catch (error) {
      console.error('Error al crear venta:', error);
      throw error;
    }
  };

  // Registrar un abono
  const registrarAbono = async (clienteId, montoAbono, notas) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');
      if (montoAbono <= 0) throw new Error('El monto del abono debe ser mayor a 0');
      if (!obtenerClientePorId(clienteId)) throw new Error('Cliente no encontrado');

      const ventasQuery = query(
        ventasCollection,
        where('cliente_ref', '==', clienteId),
        where('estado', 'in', ['pendiente', 'parcial'])
      );
      const snapshot = await getDocs(ventasQuery);
      if (snapshot.empty) throw new Error('No hay ventas pendientes para este cliente');

      let montoRestante = montoAbono;
      let deudaTotal = 0;
      snapshot.forEach(doc => deudaTotal += doc.data().monto_pendiente);
      if (montoAbono > deudaTotal) {
        throw new Error(`El abono de ${montoAbono} soles excede la deuda total de ${deudaTotal} soles`);
      }

      const updates = [];
      snapshot.docs
        .sort((a, b) => a.data().fecha_creacion.localeCompare(b.data().fecha_creacion))
        .forEach(doc => {
          if (montoRestante <= 0) return;

          const ventaData = doc.data();
          const montoPendiente = ventaData.monto_pendiente;
          const montoAPagar = Math.min(montoPendiente, montoRestante);
          const nuevoMontoPagado = (ventaData.monto_pagado || 0) + montoAPagar;
          const nuevoMontoPendiente = ventaData.total - nuevoMontoPagado;
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

          montoRestante -= montoAPagar;
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
      const venta = ventas.find(v => v.id === ventaId);
      if (!venta) throw new Error('Venta no encontrada');
      if (cantidadDevuelta > venta.total_retornables) {
        throw new Error(`No se pueden devolver ${cantidadDevuelta} retornables, solo adeuda ${venta.total_retornables}`);
      }

      const devolucion = {
        cantidad_devuelta: cantidadDevuelta,
        fecha: new Date().toISOString(),
        cajero_ref: currentUser.uid,
        notas: notas || '',
      };

      await runTransaction(db, async (transaction) => {
        transaction.update(ventaRef, {
          total_retornables: venta.total_retornables - cantidadDevuelta,
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
  const obtenerVentasPorCliente = async (clienteId) => {
    try {
      const ventasQuery = query(
        ventasCollection,
        where('cliente_ref', '==', clienteId),
        where('estado', 'in', ['pendiente', 'parcial'])
      );
      const snapshot = await getDocs(ventasQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
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
      return Number(deudaTotal.toFixed(2)); // Redondear a 2 decimales
    } catch (error) {
      console.error('Error al calcular deuda total por cliente:', error);
      return 0;
    }
  };

  // Obtener venta por ID
  const obtenerVentaPorId = (id) => {
    return ventas.find(venta => venta.id === id);
  };

  // Obtener todos los datos de una venta por ID, incluyendo el nombre del cajero
  const obtenerVentaCompletaPorId = async (ventaId) => {
    try {
      const ventaRef = doc(db, 'ventas', ventaId);
      const ventaDoc = await getDoc(ventaRef);

      if (!ventaDoc.exists()) {
        throw new Error('Venta no encontrada');
      }

      const ventaData = {
        id: ventaDoc.id,
        ...ventaDoc.data(),
      };

      // Obtener el nombre del cajero
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
        ...ventaData,
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
      return true; // Indica éxito
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      throw error;
    }
  };

  const value = {
    ventas,
    loading,
    crearVenta,
    registrarAbono,
    registrarDevolucionRetornables,
    obtenerVentasPorCliente,
    obtenerVentaPorId,
    obtenerVentaCompletaPorId,
    obtenerDeudaTotalPorCliente,
    obtenerTodasVentas,
    eliminarVenta, // Nueva función añadida al contexto
  };

  return (
    <VentasContext.Provider value={value}>
      {children}
    </VentasContext.Provider>
  );
};

export default VentasProvider;
