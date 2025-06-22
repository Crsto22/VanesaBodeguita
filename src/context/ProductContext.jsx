import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, storage } from '../firebase/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs,
  getDoc // Nueva importación para obtener documento por ID
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from './AuthContext';
import debounce from 'lodash.debounce';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productosLoading, setProductosLoading] = useState(false);
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [ultimoDocumento, setUltimoDocumento] = useState(null);
  const [primerDocumento, setPrimerDocumento] = useState(null);
  const [hayMasPaginas, setHayMasPaginas] = useState(true);
  const [historialPaginacion, setHistorialPaginacion] = useState([]);
  
  // Estado para búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  const { currentUser } = useAuth();
  const PRODUCTOS_POR_PAGINA = 5;

  // Referencias a colecciones
  const categoriasCollection = collection(db, 'categorias');
  const productosCollection = collection(db, 'productos');

  // Obtener categorías en tiempo real
  useEffect(() => {
    if (!currentUser) {
      setCategorias([]);
      setLoading(false);
      return;
    }

    const categoriasQuery = query(categoriasCollection, where('estado', '==', 'activo'));
    const unsubscribeCategorias = onSnapshot(categoriasQuery, (snapshot) => {
      const categoriasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(categoriasData);
      setLoading(false);
    }, (error) => {
      console.error('Error al obtener categorías:', error);
      setLoading(false);
    });

    return () => unsubscribeCategorias();
  }, [currentUser]);

  // Cargar primera página de productos
  const cargarPrimerasPagina = async (search = '') => {
    if (!currentUser) return;
    
    setProductosLoading(true);
    try {
      let productosQuery;
      if (search) {
        productosQuery = query(
          productosCollection,
          where('estado', '==', 'activo'),
          where('nombre', '>=', search.toUpperCase()),
          where('nombre', '<=', search.toUpperCase() + '\uf8ff'),
          orderBy('nombre'),
          limit(PRODUCTOS_POR_PAGINA)
        );
      } else {
        productosQuery = query(
          productosCollection,
          where('estado', '==', 'activo'),
          orderBy('nombre'),
          limit(PRODUCTOS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(productosQuery);
      
      if (snapshot.empty) {
        setProductos([]);
        setHayMasPaginas(false);
        setPaginaActual(1);
        setUltimoDocumento(null);
        setPrimerDocumento(null);
        setHistorialPaginacion([]);
        setProductosLoading(false);
        return;
      }

      const productosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProductos(productosData);
      setPaginaActual(1);
      setPrimerDocumento(snapshot.docs[0]);
      setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
      setHayMasPaginas(snapshot.docs.length === PRODUCTOS_POR_PAGINA);
      setHistorialPaginacion([snapshot.docs[0]]);

    } catch (error) {
      console.error('Error al cargar primera página:', error);
    } finally {
      setProductosLoading(false);
    }
  };

  // Cargar siguiente página
  const cargarSiguientePagina = async () => {
    if (!ultimoDocumento || !hayMasPaginas || productosLoading) return;

    setProductosLoading(true);
    try {
      let productosQuery;
      if (searchQuery) {
        productosQuery = query(
          productosCollection,
          where('estado', '==', 'activo'),
          where('nombre', '>=', searchQuery.toUpperCase()),
          where('nombre', '<=', searchQuery.toUpperCase() + '\uf8ff'),
          orderBy('nombre'),
          startAfter(ultimoDocumento),
          limit(PRODUCTOS_POR_PAGINA)
        );
      } else {
        productosQuery = query(
          productosCollection,
          where('estado', '==', 'activo'),
          orderBy('nombre'),
          startAfter(ultimoDocumento),
          limit(PRODUCTOS_POR_PAGINA)
        );
      }

      const snapshot = await getDocs(productosQuery);

      if (snapshot.empty) {
        setHayMasPaginas(false);
        setProductosLoading(false);
        return;
      }

      const productosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProductos(productosData);
      setPaginaActual(prev => prev + 1);
      setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
      setPrimerDocumento(snapshot.docs[0]);
      setHayMasPaginas(snapshot.docs.length === PRODUCTOS_POR_PAGINA);
      
      setHistorialPaginacion(prev => [...prev, snapshot.docs[0]]);

    } catch (error) {
      console.error('Error al cargar siguiente página:', error);
    } finally {
      setProductosLoading(false);
    }
  };

  // Cargar página anterior
  const cargarPaginaAnterior = async () => {
    if (paginaActual <= 1 || productosLoading) return;

    setProductosLoading(true);
    try {
      const nuevaPagina = paginaActual - 1;
      const documentoInicio = historialPaginacion[nuevaPagina - 1];
      
      let productosQuery;
      if (nuevaPagina === 1) {
        if (searchQuery) {
          productosQuery = query(
            productosCollection,
            where('estado', '==', 'activo'),
            where('nombre', '>=', searchQuery.toUpperCase()),
            where('nombre', '<=', searchQuery.toUpperCase() + '\uf8ff'),
            orderBy('nombre'),
            limit(PRODUCTOS_POR_PAGINA)
          );
        } else {
          productosQuery = query(
            productosCollection,
            where('estado', '==', 'activo'),
            orderBy('nombre'),
            limit(PRODUCTOS_POR_PAGINA)
          );
        }
      } else {
        if (searchQuery) {
          productosQuery = query(
            productosCollection,
            where('estado', '==', 'activo'),
            where('nombre', '>=', searchQuery.toUpperCase()),
            where('nombre', '<=', searchQuery.toUpperCase() + '\uf8ff'),
            orderBy('nombre'),
            startAfter(documentoInicio),
            limit(PRODUCTOS_POR_PAGINA)
          );
        } else {
          productosQuery = query(
            productosCollection,
            where('estado', '==', 'activo'),
            orderBy('nombre'),
            startAfter(documentoInicio),
            limit(PRODUCTOS_POR_PAGINA)
          );
        }
      }

      const snapshot = await getDocs(productosQuery);

      if (!snapshot.empty) {
        const productosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProductos(productosData);
        setPaginaActual(nuevaPagina);
        setPrimerDocumento(snapshot.docs[0]);
        setUltimoDocumento(snapshot.docs[snapshot.docs.length - 1]);
        setHayMasPaginas(true);
        
        setHistorialPaginacion(prev => prev.slice(0, nuevaPagina));
      }

    } catch (error) {
      console.error('Error al cargar página anterior:', error);
    } finally {
      setProductosLoading(false);
    }
  };

  // Recargar productos
  const recargarProductos = async () => {
    setPaginaActual(1);
    setUltimoDocumento(null);
    setPrimerDocumento(null);
    setHayMasPaginas(true);
    setHistorialPaginacion([]);
    await cargarPrimerasPagina(searchQuery);
  };

  // Función de búsqueda debounced
  const buscarProductos = debounce(async (query) => {
    setSearchQuery(query);
    setPaginaActual(1);
    setUltimoDocumento(null);
    setPrimerDocumento(null);
    setHayMasPaginas(true);
    setHistorialPaginacion([]);
    await cargarPrimerasPagina(query);
  }, 1000);

  // Cargar productos al montar el componente o cambiar usuario
  useEffect(() => {
    if (currentUser) {
      cargarPrimerasPagina();
    }
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
      await updateDoc(categoriaRef, { estado: 'inactivo' });
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
      const sanitizedProductName = productoData.nombre
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');

      if (imagenFile) {
        const sanitizedFileName = imagenFile.name
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/\s+/g, '_');
        const imagenName = `${Date.now()}_${sanitizedFileName}`;
        const imagenRef = ref(storage, `productos/${sanitizedProductName}/${imagenName}`);
        await uploadBytes(imagenRef, imagenFile);
        imagenUrl = await getDownloadURL(imagenRef);
      }

      const nuevoProducto = {
        ...productoData,
        categoria_ref: productoData.categoria_ref,
        nombre: productoData.nombre.toUpperCase(),
        imagen: imagenUrl,
        estado: 'activo',
        fecha_creacion: new Date().toISOString(),
      };
      
      const docRef = await addDoc(productosCollection, nuevoProducto);
      await recargarProductos();
      return docRef.id;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  };

  // Actualizar un producto
  const actualizarProducto = async (id, productoData, imagenFile) => {
    try {
      let imagenUrl = productoData.imagen || '';
      const sanitizedProductName = productoData.nombre
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');

      if (imagenFile) {
        if (productoData.imagen) {
          try {
            const oldImagenRef = ref(storage, productoData.imagen);
            await deleteObject(oldImagenRef);
          } catch (error) {
            console.warn('No se pudo eliminar la imagen anterior:', error);
          }
        }
        
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
        nombre: productoData.nombre.toUpperCase(),
        imagen: imagenUrl,
      });

      await recargarProductos();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  };

  // Eliminar un producto
  const eliminarProducto = async (id, imagenUrl) => {
    try {
      if (imagenUrl) {
        try {
          const imagenRef = ref(storage, imagenUrl);
          await deleteObject(imagenRef);
        } catch (error) {
          console.warn('No se pudo eliminar la imagen:', error);
        }
      }
      
      const productoRef = doc(db, 'productos', id);
      await updateDoc(productoRef, { estado: 'inactivo' });
      await recargarProductos();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  };

  // Obtener producto por ID (desde el estado local)
  const obtenerProductoPorId = (id) => {
    return productos.find(producto => producto.id === id);
  };

  // Nueva función: Obtener producto por ID directamente desde Firestore
  const obtenerProductoPorIdDirecto = async (id) => {
    try {
      const productoRef = doc(db, 'productos', id);
      const productoDoc = await getDoc(productoRef);
      if (!productoDoc.exists()) {
        return null;
      }
      return {
        id: productoDoc.id,
        ...productoDoc.data(),
      };
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      return null;
    }
  };

  const value = {
    categorias,
    productos,
    loading,
    productosLoading,
    paginaActual,
    hayMasPaginas,
    PRODUCTOS_POR_PAGINA,
    searchQuery,
    setSearchQuery,
    buscarProductos,
    cargarSiguientePagina,
    cargarPaginaAnterior,
    recargarProductos,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    obtenerCategoriaPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerProductoPorId,
    obtenerProductoPorIdDirecto, // Exportar la nueva función
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductProvider;