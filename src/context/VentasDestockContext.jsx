import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, query, where, orderBy, limit, startAfter, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from './AuthContext';
import { useClientes } from './ClientesContext';

const VentasDestockContext = createContext();

export const useVentasDestock = () => {
  const context = useContext(VentasDestockContext);
  if (!context) {
    throw new Error('useVentasDestock debe ser usado dentro de VentasDestockProvider');
  }
  return context;
};

export const VentasDestockProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [categoriaActual, setCategoriaActual] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Hooks de dependencias
  const { currentUser } = useAuth();
  const { obtenerClientePorId } = useClientes();
  
  const PRODUCTOS_POR_PAGINA = 8;

  // Función simplificada para obtener productos
  const obtenerProductosPaginados = async (categoria = 'all', busqueda = '', resetear = true) => {
    console.log('🔍 Cargando productos:', { categoria, busqueda, resetear });
    setLoading(true);
    
    try {
      const productosRef = collection(db, 'productos');
      let q;
      
      if (resetear) {
        setProductos([]);
        setLastDoc(null);
        setCurrentPage(1);
      }

      // Consulta simplificada - sin múltiples where para evitar problemas de índices
      if (categoria === 'all') {
        q = query(
          productosRef,
          orderBy('nombre'),
          limit(PRODUCTOS_POR_PAGINA + 1)
        );
        
        if (!resetear && lastDoc) {
          q = query(
            productosRef,
            orderBy('nombre'),
            startAfter(lastDoc),
            limit(PRODUCTOS_POR_PAGINA + 1)
          );
        }
      } else {
        // Solo filtrar por categoría, el estado lo verificamos en cliente
        q = query(
          productosRef,
          where('categoria_ref', '==', categoria),
          orderBy('nombre'),
          limit(PRODUCTOS_POR_PAGINA + 1)
        );
        
        if (!resetear && lastDoc) {
          q = query(
            productosRef,
            where('categoria_ref', '==', categoria),
            orderBy('nombre'),
            startAfter(lastDoc),
            limit(PRODUCTOS_POR_PAGINA + 1)
          );
        }
      }

      console.log('📊 Ejecutando consulta Firebase...');
      const snapshot = await getDocs(q);
      console.log('📄 Documentos recibidos:', snapshot.docs.length);
      
      let docs = snapshot.docs;
      const nuevosProductos = [];

      // Verificar si hay más páginas
      if (docs.length > PRODUCTOS_POR_PAGINA) {
        setHasNextPage(true);
        docs = docs.slice(0, PRODUCTOS_POR_PAGINA);
      } else {
        setHasNextPage(false);
      }

      // Filtrar productos en el cliente
      docs.forEach(doc => {
        const data = doc.data();
        
        // FILTRO 1: Solo productos activos
        if (data.estado !== 'activo') {
          console.log('⚠️ Producto inactivo ignorado:', data.nombre);
          return;
        }

        // FILTRO 2: Si hay búsqueda, filtrar por término
        if (busqueda.trim()) {
          const termino = busqueda.toLowerCase();
          const cumpleBusqueda = 
            data.nombre?.toLowerCase().includes(termino) ||
            data.codigo_barras?.includes(termino) ||
            data.marca?.toLowerCase().includes(termino);
            
          if (!cumpleBusqueda) {
            return;
          }
        }

        // Producto válido, agregarlo
        nuevosProductos.push({
          id: doc.id,
          ...data
        });
      });

      // Actualizar estado
      if (resetear) {
        setProductos(nuevosProductos);
      } else {
        setProductos(prev => [...prev, ...nuevosProductos]);
      }

      // Guardar último documento
      if (docs.length > 0) {
        setLastDoc(docs[docs.length - 1]);
      }

      setCategoriaActual(categoria);
      setSearchTerm(busqueda);

      console.log('✅ Productos procesados:', {
        total: nuevosProductos.length,
        categoria,
        busqueda,
        hayMasPaginas: docs.length > PRODUCTOS_POR_PAGINA
      });

    } catch (error) {
      console.error('❌ ERROR en consulta:', error);
      setProductos([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar más productos
  const cargarMasProductos = async () => {
    if (!hasNextPage || loading) return;
    
    setCurrentPage(prev => prev + 1);
    await obtenerProductosPaginados(categoriaActual, searchTerm, false);
  };

  // Función para cambiar categoría
  const cambiarCategoria = async (categoria) => {
    console.log('🔄 Cambiando categoría:', categoriaActual, '=>', categoria);
    
    if (categoria !== categoriaActual) {
      setCurrentPage(1);
      await obtenerProductosPaginados(categoria, searchTerm, true);
    }
  };

  // Función para buscar productos
  const buscarProductos = async (termino) => {
    console.log('🔍 Buscando:', termino);
    setCurrentPage(1);
    await obtenerProductosPaginados(categoriaActual, termino, true);
  };

  // Función para resetear búsqueda
  const resetearBusqueda = async () => {
    setSearchTerm('');
    setCurrentPage(1);
    await obtenerProductosPaginados(categoriaActual, '', true);
  };

  // Función para formatear números a 2 decimales
  const formatToTwoDecimals = (num) => {
    return parseFloat(num.toFixed(2));
  };

  // Función para crear una venta
  const crearVenta = async (ventaData) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');
      
      // Validar cliente si se especifica
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
      
      const productosProcesados = ventaData.productos.map((item) => {
        if (item.cantidad <= 0) throw new Error(`Cantidad inválida para ${item.nombre}`);
        if (item.cantidad_retornable > item.cantidad) throw new Error(`Cantidad retornable inválida para ${item.nombre}`);
        if (item.precio_unitario <= 0) throw new Error(`Precio unitario inválido para ${item.nombre}`);
        
        const subtotalCalculado = formatToTwoDecimals(item.cantidad * item.precio_unitario);
        if (Math.abs(item.subtotal - subtotalCalculado) > 0.01) {
          throw new Error(`Subtotal inválido para ${item.nombre}`);
        }

        const cantidadRetornable = item.retornable ? item.cantidad_retornable || 0 : 0;
        total += subtotalCalculado;
        
        // Solo contar retornables para productos que SÍ son retornables
        if (item.retornable) {
          totalRetornables += (item.cantidad - cantidadRetornable);
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
      });

      total = formatToTwoDecimals(total);

      // Validar montos
      const montoPagado = ventaData.monto_pagado ? formatToTwoDecimals(Number(ventaData.monto_pagado)) : 0;
      const montoPendiente = ventaData.monto_pendiente ? formatToTwoDecimals(Number(ventaData.monto_pendiente)) : 0;

      if (Math.abs(total - (montoPagado + montoPendiente)) > 0.01) {
        throw new Error('La suma de monto_pagado y monto_pendiente no coincide con el total');
      }

      // Validar estados de pago
      if (ventaData.estado === 'pendiente') {
        if (montoPagado !== 0) throw new Error('Monto pagado debe ser 0 para estado pendiente');
        if (montoPendiente !== total) throw new Error('Monto pendiente debe igualar el total para estado pendiente');
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
        notas: ventaData.notas || ''
      };

      const ventasCollection = collection(db, 'ventas');
      const docRef = await addDoc(ventasCollection, nuevaVenta);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear venta en VentasDestock:', error);
      throw error;
    }
  };

  // Cargar productos iniciales
  useEffect(() => {
    console.log('🚀 Inicializando VentasDestockContext');
    obtenerProductosPaginados();
  }, []);

  const value = {
    // Estado
    productos,
    loading,
    currentPage,
    hasNextPage,
    categoriaActual,
    searchTerm,
    
    // Funciones
    obtenerProductosPaginados,
    cargarMasProductos,
    cambiarCategoria,
    buscarProductos,
    resetearBusqueda,
    crearVenta,
    
    // Constantes
    PRODUCTOS_POR_PAGINA
  };

  return (
    <VentasDestockContext.Provider value={value}>
      {children}
    </VentasDestockContext.Provider>
  );
};

export default VentasDestockContext;
