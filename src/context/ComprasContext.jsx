
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
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
  const { currentUser } = useAuth();
  const { obtenerProductoPorIdDirecto, actualizarProducto } = useProducts();
  const { obtenerProveedorPorId } = useProveedores();

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

  const value = {
    compras,
    loading,
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
