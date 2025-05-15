// ProductContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../firebase/firebase'; // Asegúrate de que la ruta sea correcta
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from './AuthContext';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Referencias a colecciones
  const categoriasCollection = collection(db, 'categorias');
  const productosCollection = collection(db, 'productos');

  // Obtener categorías y productos en tiempo real
  useEffect(() => {
    if (!currentUser) {
      setCategorias([]);
      setProductos([]);
      setLoading(false);
      return;
    }

    // Suscripción a categorías
    const categoriasQuery = query(categoriasCollection, where('estado', '==', 'activo'));
    const unsubscribeCategorias = onSnapshot(categoriasQuery, (snapshot) => {
      const categoriasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(categoriasData);
    }, (error) => {
      console.error('Error al obtener categorías:', error);
    });

    // Suscripción a productos
    const productosQuery = query(productosCollection, where('estado', '==', 'activo'));
    const unsubscribeProductos = onSnapshot(productosQuery, (snapshot) => {
      const productosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(productosData);
      setLoading(false);
    }, (error) => {
      console.error('Error al obtener productos:', error);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubscribeCategorias();
      unsubscribeProductos();
    };
  }, [currentUser]);

  // Crear una nueva categoría
  const crearCategoria = async (categoriaData) => {
    try {
      const nuevaCategoria = {
        ...categoriaData,
        fecha_creacion: new Date().toISOString(),
        estado: 'activo',
      };
      const docRef = await addDoc(categoriasCollection, nuevaCategoria);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  };

  // Actualizar una categoría
  const actualizarCategoria = async (id, categoriaData) => {
    try {
      const categoriaRef = doc(db, 'categorias', id);
      await updateDoc(categoriaRef, categoriaData);
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    }
  };

  // Eliminar una categoría
  const eliminarCategoria = async (id) => {
    try {
      const categoriaRef = doc(db, 'categorias', id);
      await updateDoc(categoriaRef, { estado: 'inactivo' }); // Soft delete
      // Si prefieres eliminar permanentemente, usa:
      // await deleteDoc(categoriaRef);
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  };

  // Obtener categoría por ID
  const obtenerCategoriaPorId = (id) => {
    return categorias.find(categoria => categoria.id === id);
  };

  // Crear un nuevo producto con imagen
  const crearProducto = async (productoData, imagenFile) => {
    try {
      let imagenUrl = '';
      // Sanitizar el nombre del producto
      const sanitizedProductName = productoData.nombre
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');

      if (imagenFile) {
        // Sanitizar el nombre del archivo
        const sanitizedFileName = imagenFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/\s+/g, '_');
        const imagenName = `${Date.now()}_${sanitizedFileName}`;
        const imagenRef = ref(storage, `productos/${sanitizedProductName}/${imagenName}`);
        console.log('Subiendo imagen a:', imagenRef.fullPath);
        await uploadBytes(imagenRef, imagenFile);
        imagenUrl = await getDownloadURL(imagenRef);
        console.log('Imagen subida, URL:', imagenUrl);
      }

      const nuevoProducto = {
        ...productoData,
        categoria_ref: productoData.categoria_ref,
        nombre: productoData.nombre, // Mantener el nombre original
        imagen: imagenUrl,
        estado: 'activo',
        fecha_creacion: new Date().toISOString(),
      };
      const docRef = await addDoc(productosCollection, nuevoProducto);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear producto:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);
      throw error;
    }
  };

  // Actualizar un producto
  const actualizarProducto = async (id, productoData, imagenFile) => {
    try {
      let imagenUrl = productoData.imagen || '';
      // Sanitizar el nombre del producto
      const sanitizedProductName = productoData.nombre
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');

      if (imagenFile) {
        // Eliminar imagen anterior si existe
        if (productoData.imagen) {
          try {
            const oldImagenRef = ref(storage, productoData.imagen);
            await deleteObject(oldImagenRef);
          } catch (error) {
            console.warn('No se pudo eliminar la imagen anterior:', error);
          }
        }
        // Subir nueva imagen
        const sanitizedFileName = imagenFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/\s+/g, '_');
        const imagenName = `${Date.now()}_${sanitizedFileName}`;
        const imagenRef = ref(storage, `productos/${sanitizedProductName}/${imagenName}`);
        await uploadBytes(imagenRef, imagenFile);
        imagenUrl = await getDownloadURL(imagenRef);
      }

      const productoRef = doc(db, 'productos', id);
      await updateDoc(productoRef, {
        ...productoData,
        categoria_ref: productoData.categoria_ref,
        nombre: productoData.nombre,
        imagen: imagenUrl,
      });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  };

  // Eliminar un producto
  const eliminarProducto = async (id, imagenUrl) => {
    try {
      // Eliminar imagen de Storage si existe
      if (imagenUrl) {
        try {
          const imagenRef = ref(storage, imagenUrl);
          await deleteObject(imagenRef);
        } catch (error) {
          console.warn('No se pudo eliminar la imagen:', error);
        }
      }
      const productoRef = doc(db, 'productos', id);
      await updateDoc(productoRef, { estado: 'inactivo' }); // Soft delete
      // Si prefieres eliminar permanentemente, usa:
      // await deleteDoc(productoRef);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  };

  // Obtener producto por ID
  const obtenerProductoPorId = (id) => {
    return productos.find(producto => producto.id === id);
  };

  const value = {
    categorias,
    productos,
    loading,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    obtenerCategoriaPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerProductoPorId,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductProvider;