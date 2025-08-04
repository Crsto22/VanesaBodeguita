
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, updateDoc, deleteDoc, getDoc, orderBy, limit, startAfter, endBefore, limitToLast } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductContext';
import { useProveedores } from './ProveedoresContext';

const ComprasContext = createContext();

export const useCompras = () => {
  const context = useContext(ComprasContext);
  if (!context) {
    throw new Error('useCompras must be used within a ComprasProvider');
  }
  return context;
};

export const ComprasProvider = ({ children }) => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para paginación del historial
  const [comprasHistorial, setComprasHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [ultimoDocumento, setUltimoDocumento] = useState(null);
  const [primerDocumento, setPrimerDocumento] = useState(null);
  const [hayMasPaginas, setHayMasPaginas] = useState(true);
  const [historialPaginacion, setHistorialPaginacion] = useState([]);
  
  const { currentUser } = useAuth();
  const { obtenerProductoPorIdDirecto, actualizarProducto } = useProducts();
  const { obtenerProveedorPorId } = useProveedores();

  // Configuración de paginación
  const COMPRAS_POR_PAGINA = 5;

  const comprasCollection = collection(db, 'compras');

  const formatToTwoDecimals = (num) => {
    return parseFloat(Number(num).toFixed(2));
  };

  useEffect(() => {
    if (!currentUser) {
      setCompras([]);
      setLoading(false);
      return;
    }

    // Solo escuchar cambios en tiempo real para compras pendientes o nuevas
    const comprasQuery = query(comprasCollection, where('estado', 'in', ['pendiente', 'pagado']));
    const unsubscribe = onSnapshot(comprasQuery, (snapshot) => {
      const comprasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompras(comprasData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching purchases:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const crearCompra = async (compraData) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');
      if (!compraData.proveedor_ref) throw new Error('Debes seleccionar un proveedor');
      if (!compraData.productos || compraData.productos.length === 0) throw new Error('Debes añadir al menos un producto');

      const proveedor = obtenerProveedorPorId(compraData.proveedor_ref);
      if (!proveedor) throw new Error('Proveedor no encontrado');

      let total = 0;
      const productosProcesados = await Promise.all(compraData.productos.map(async (item) => {
        const producto = await obtenerProductoPorIdDirecto(item.producto_ref);
        if (!producto) throw new Error(`Producto con ID ${item.producto_ref} no encontrado`);
        if (!producto.nombre || typeof producto.nombre !== 'string') throw new Error(`El producto con ID ${item.producto_ref} no tiene un nombre válido`);
        if (item.cantidad <= 0) throw new Error(`Cantidad inválida para ${producto.nombre}`);
        if (item.precio_unitario <= 0) throw new Error(`Precio unitario inválido para ${producto.nombre}`);

        const subtotalCalculado = formatToTwoDecimals(item.cantidad * item.precio_unitario);
        if (Math.abs(item.subtotal - subtotalCalculado) > 0.01) {
          throw new Error(`Subtotal inválido para ${producto.nombre}`);
        }

        total += subtotalCalculado;

        const productoData = {
          stock: formatToTwoDecimals(producto.stock + item.cantidad),
          precio_compra: formatToTwoDecimals(item.precio_unitario),
          precio: formatToTwoDecimals(item.precio_venta || producto.precio),
          precio_alternativo: item.has_precio_alternativo && item.precio_alternativo ? formatToTwoDecimals(item.precio_alternativo) : null,
          motivo_precio_alternativo: item.has_precio_alternativo && item.motivo_precio_alternativo ? item.motivo_precio_alternativo : null,
          has_precio_alternativo: !!item.has_precio_alternativo,
        };

        const productoRef = doc(db, 'productos', producto.id);
        await updateDoc(productoRef, productoData);

        return {
          producto_ref: item.producto_ref,
          nombre: producto.nombre,
          cantidad: formatToTwoDecimals(item.cantidad),
          precio_unitario_comp: formatToTwoDecimals(item.precio_unitario),
          subtotal: subtotalCalculado,
        };
      }));

      total = formatToTwoDecimals(total);

      const nuevaCompra = {
        cajero_ref: currentUser.uid,
        proveedor_ref: compraData.proveedor_ref,
        nombre_proveedor: proveedor.razon_social,
        estado: 'pagado',
        fecha_creacion: new Date().toISOString(),
        productos: productosProcesados,
        total,
        notas: compraData.notas || '',
      };

      const docRef = await addDoc(comprasCollection, nuevaCompra);
      return docRef.id;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  };

  const obtenerTodasCompras = async () => {
    try {
      const snapshot = await getDocs(comprasCollection);
      const comprasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return comprasData;
    } catch (error) {
      console.error('Error fetching all purchases:', error);
      throw error;
    }
  };

  const eliminarCompra = async (compraId) => {
    try {
      if (!currentUser) throw new Error('Usuario no autenticado');

      const compraRef = doc(db, 'compras', compraId);
      const compraDoc = await getDoc(compraRef);

      if (!compraDoc.exists()) {
        throw new Error('Compra no encontrada');
      }

      const compraData = compraDoc.data();
      await Promise.all(compraData.productos.map(async (item) => {
        const producto = await obtenerProductoPorIdDirecto(item.producto_ref);
        if (producto) {
          const productoRef = doc(db, 'productos', producto.id);
          await updateDoc(productoRef, {
            stock: formatToTwoDecimals(producto.stock - item.cantidad),
          });
        }
      }));

      await deleteDoc(compraRef);
      return true;
    } catch (error) {
      console.error('Error al eliminar compra:', error);
      throw error;
    }
  };

  // ============= FUNCIONES DE PAGINACIÓN PARA HISTORIAL =============

  // Cargar primera página del historial
  const cargarPrimerasPaginaHistorial = async (filtros = {}) => {
    try {
      setLoadingHistorial(true);
      
      let comprasQuery = query(
        comprasCollection,
        orderBy('fecha_creacion', 'desc'),
        limit(COMPRAS_POR_PAGINA)
      );

      // Aplicar filtros si existen
      if (filtros.fechaInicio && filtros.fechaFin) {
        comprasQuery = query(
          comprasCollection,
          where('fecha_creacion', '>=', filtros.fechaInicio),
          where('fecha_creacion', '<=', filtros.fechaFin),
          orderBy('fecha_creacion', 'desc'),
          limit(COMPRAS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(comprasQuery);
      const comprasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        total: formatToTwoDecimals(doc.data().total || 0),
      }));

      setComprasHistorial(comprasData);
      setPaginaActual(1);
      setHistorialPaginacion([]);
      
      if (snapshot.docs.length > 0) {
        setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
        setPrimerDocumento(snapshot.docs[0]);
        setHayMasPaginas(snapshot.docs.length === COMPRAS_POR_PAGINA);
      } else {
        setUltimoDocumento(null);
        setPrimerDocumento(null);
        setHayMasPaginas(false);
      }

      return comprasData;
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

      let comprasQuery = query(
        comprasCollection,
        orderBy('fecha_creacion', 'desc'),
        startAfter(ultimoDocumento),
        limit(COMPRAS_POR_PAGINA)
      );

      // Aplicar filtros si existen
      if (filtros.fechaInicio && filtros.fechaFin) {
        comprasQuery = query(
          comprasCollection,
          where('fecha_creacion', '>=', filtros.fechaInicio),
          where('fecha_creacion', '<=', filtros.fechaFin),
          orderBy('fecha_creacion', 'desc'),
          startAfter(ultimoDocumento),
          limit(COMPRAS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(comprasQuery);
      const comprasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        total: formatToTwoDecimals(doc.data().total || 0),
      }));

      if (snapshot.docs.length > 0) {
        // Guardar referencia de la página anterior
        setHistorialPaginacion(prev => [...prev, { primerDoc: primerDocumento, ultimoDoc: ultimoDocumento }]);
        
        setComprasHistorial(comprasData);
        setPaginaActual(prev => prev + 1);
        setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
        setPrimerDocumento(snapshot.docs[0]);
        setHayMasPaginas(snapshot.docs.length === COMPRAS_POR_PAGINA);
      }

      return comprasData;
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

      let comprasQuery = query(
        comprasCollection,
        orderBy('fecha_creacion', 'desc'),
        endBefore(paginaAnterior.ultimoDoc),
        limitToLast(COMPRAS_POR_PAGINA)
      );

      // Aplicar filtros si existen
      if (filtros.fechaInicio && filtros.fechaFin) {
        comprasQuery = query(
          comprasCollection,
          where('fecha_creacion', '>=', filtros.fechaInicio),
          where('fecha_creacion', '<=', filtros.fechaFin),
          orderBy('fecha_creacion', 'desc'),
          endBefore(paginaAnterior.ultimoDoc),
          limitToLast(COMPRAS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(comprasQuery);
      const comprasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        total: formatToTwoDecimals(doc.data().total || 0),
      }));

      setComprasHistorial(comprasData);
      setPaginaActual(prev => prev - 1);
      setHistorialPaginacion(prev => prev.slice(0, -1));
      
      if (snapshot.docs.length > 0) {
        setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
        setPrimerDocumento(snapshot.docs[0]);
        setHayMasPaginas(true);
      }

      return comprasData;
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
    compras,
    loading,
    // Estados del historial con paginación
    comprasHistorial,
    loadingHistorial,
    paginaActual,
    hayMasPaginas,
    COMPRAS_POR_PAGINA,
    cargarPrimerasPaginaHistorial,
    cargarSiguientePaginaHistorial,
    cargarPaginaAnteriorHistorial,
    reiniciarPaginacionHistorial,
    crearCompra,
    obtenerTodasCompras,
    eliminarCompra,
  };

  return (
    <ComprasContext.Provider value={value}>
      {children}
    </ComprasContext.Provider>
  );
};

export default ComprasProvider;
