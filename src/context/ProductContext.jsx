import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
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
  getDoc,
} from 'firebase/firestore';
import { upload } from '@imagekit/react';
import CryptoJS from 'crypto-js';
import { useAuth } from './AuthContext';
import debounce from 'lodash.debounce';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [todosLosProductos, setTodosLosProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productosLoading, setProductosLoading] = useState(false);
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [ultimoDocumento, setUltimoDocumento] = useState(null);
  const [primerDocumento, setPrimerDocumento] = useState(null);
  const [hayMasPaginas, setHayMasPaginas] = useState(true);
  const [historialPaginacion, setHistorialPaginacion] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [modoFiltrado, setModoFiltrado] = useState(false);

  const { currentUser } = useAuth();
  const PRODUCTOS_POR_PAGINA = 10;

  const categoriasCollection = collection(db, 'categorias');
  const productosCollection = collection(db, 'productos');

  // ImageKit Authenticator (INSECURE for frontend, use server-side in production)
  const authenticator = () => {
    const privateKey = 'private_pSNg9URbLW/oSPfPxVuTSWLgLPQ=';
    const publicKey = 'public_tYwmzcByvWvOQ21qtLqTdoHJneQ=';
    const token = Math.random().toString(36).substring(2);
    const expire = Math.floor(Date.now() / 1000) + 600;
    const signature = CryptoJS.HmacSHA1(`${token}${expire}`, privateKey).toString(CryptoJS.enc.Hex);

    return { signature, expire: expire.toString(), token, publicKey };
  };

  // Upload image to ImageKit
  const uploadImageToImageKit = async (imagenFile, productName) => {
    if (!imagenFile) return null;

    try {
      const { signature, expire, token, publicKey } = authenticator();
      const sanitizedProductName = productName
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');
      const sanitizedFileName = imagenFile.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\s+/g, '_');
      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file: imagenFile,
        fileName: `producto_${Date.now()}_${sanitizedFileName}`,
        folder: `/Productos/${sanitizedProductName}`,
        tags: ['producto'],
        useUniqueFileName: true,
        urlEndpoint: 'https://ik.imagekit.io/vanesabodeguita',
      });
      return uploadResponse.url;
    } catch (error) {
      console.error('Error uploading image to ImageKit:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setCategorias([]);
      setLoading(false);
      return;
    }

    const categoriasQuery = query(categoriasCollection, where('estado', '==', 'activo'));
    const unsubscribeCategorias = onSnapshot(categoriasQuery, (snapshot) => {
      const categoriaData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategorias(categoriaData);
      setLoading(false);
    }, (error) => {
      console.error('Error al obtener categorías:', error);
      setLoading(false);
    });

    return () => unsubscribeCategorias();
  }, [currentUser]);

  const cargarTodosLosProductos = async () => {
    if (!currentUser) return;

    try {
      const productosQuery = query(
        productosCollection,
        where('estado', '==', 'activo'),
        orderBy('nombre')
      );

      const snapshot = await getDocs(productosQuery);
      const todosProductosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTodosLosProductos(todosProductosData);
    } catch (error) {
      console.error('Error al cargar todos los productos:', error);
    }
  };

  const filtrarProductosLocal = (query) => {
    if (!query.trim()) {
      return todosLosProductos;
    }

    const queryNormalizado = query.toLowerCase().trim();
    return todosLosProductos.filter(producto => 
      producto.nombre.toLowerCase().includes(queryNormalizado) ||
      producto.codigo_barras?.includes(query) ||
      producto.marca?.toLowerCase().includes(queryNormalizado)
    );
  };  const paginarProductos = (productosArray, pagina) => {
    const inicio = (pagina - 1) * PRODUCTOS_POR_PAGINA;
    const fin = inicio + PRODUCTOS_POR_PAGINA;
    return productosArray.slice(inicio, fin);
  };

  const cargarPrimerasPagina = async () => {
    if (!currentUser) return;
    
    setProductosLoading(true);
    try {
      const productosQuery = query(
        productosCollection,
        where('estado', '==', 'activo'),
        orderBy('nombre'),
        limit(PRODUCTOS_POR_PAGINA)
      );

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

  const cargarSiguientePagina = async () => {
    if (modoFiltrado) {
      const productosFiltrados = filtrarProductosLocal(searchQuery);
      const siguientePagina = paginaActual + 1;
      const productosParaMostrar = paginarProductos(productosFiltrados, siguientePagina);
      
      if (productosParaMostrar.length > 0) {
        setProductos(productosParaMostrar);
        setPaginaActual(siguientePagina);
        const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
        setHayMasPaginas(siguientePagina < totalPaginas);
      }
      return;
    }

    if (!ultimoDocumento || !hayMasPaginas || productosLoading) return;

    setProductosLoading(true);
    try {
      const productosQuery = query(
        productosCollection,
        where('estado', '==', 'activo'),
        orderBy('nombre'),
        startAfter(ultimoDocumento),
        limit(PRODUCTOS_POR_PAGINA)
      );

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

  const cargarPaginaAnterior = async () => {
    if (paginaActual <= 1 || productosLoading) return;

    if (modoFiltrado) {
      const productosFiltrados = filtrarProductosLocal(searchQuery);
      const paginaAnterior = paginaActual - 1;
      const productosParaMostrar = paginarProductos(productosFiltrados, paginaAnterior);
      
      setProductos(productosParaMostrar);
      setPaginaActual(paginaAnterior);
      setHayMasPaginas(true);
      return;
    }

    setProductosLoading(true);
    try {
      const nuevaPagina = paginaActual - 1;
      const documentoInicio = historialPaginacion[nuevaPagina - 1];
      
      let productosQuery;
      if (nuevaPagina === 1) {
        productosQuery = query(
          productosCollection,
          where('estado', '==', 'activo'),
          orderBy('nombre'),
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

  const recargarProductos = async () => {
    setPaginaActual(1);
    setUltimoDocumento(null);
    setPrimerDocumento(null);
    setHayMasPaginas(true);
    setHistorialPaginacion([]);
    setModoFiltrado(false);
    setSearchQuery('');
    await cargarPrimerasPagina();
    await cargarTodosLosProductos();
  };

  const buscarProductos = debounce(async (query) => {
    setProductosLoading(true);
    setSearchQuery(query);
    
    if (!query.trim()) {
      setModoFiltrado(false);
      setPaginaActual(1);
      setUltimoDocumento(null);
      setPrimerDocumento(null);
      setHayMasPaginas(true);
      setHistorialPaginacion([]);
      await cargarPrimerasPagina();
      setProductosLoading(false);
      return;
    }

    try {
      setModoFiltrado(true);
      
      if (todosLosProductos.length === 0) {
        await cargarTodosLosProductos();
      }
      
      const productosFiltrados = filtrarProductosLocal(query);
      
      const productosParaMostrar = paginarProductos(productosFiltrados, 1);
      
      setProductos(productosParaMostrar);
      setPaginaActual(1);
      const totalPaginas = Math.ceil(productosFiltrados.length / PRODUCTOS_POR_PAGINA);
      setHayMasPaginas(totalPaginas > 1);
      
      setUltimoDocumento(null);
      setPrimerDocumento(null);
      setHistorialPaginacion([]);

    } catch (error) {
      console.error('Error al buscar productos:', error);
    } finally {
      setProductosLoading(false);
    }
  }, 500);

  const limpiarBusqueda = async () => {
    setSearchQuery('');
    setModoFiltrado(false);
    await recargarProductos();
  };

  useEffect(() => {
    if (currentUser) {
      cargarPrimerasPagina();
      cargarTodosLosProductos();
    }
  }, [currentUser]);

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

  const actualizarCategoria = async (id, categoriaData) => {
    try {
      const categoriaRef = doc(db, 'categorias', id);
      await updateDoc(categoriaRef, categoriaData);
    } catch (error) {
      console.error('Error al actualizar categoría:', error);
      throw error;
    }
  };

  const eliminarCategoria = async (id) => {
    try {
      const categoriaRef = doc(db, 'categorias', id);
      await updateDoc(categoriaRef, { estado: 'inactivo' });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      throw error;
    }
  };

  const obtenerCategoriaPorId = (id) => {
    return categorias.find(categoria => categoria.id === id);
  };

  const crearProducto = async (productoData, imagenFile) => {
    try {
      let imagenUrl = '';
      if (imagenFile) {
        imagenUrl = await uploadImageToImageKit(imagenFile, productoData.nombre);
      }

      const nuevoProducto = {
        categoria_ref: productoData.categoria_ref,
        nombre: productoData.nombre.toUpperCase(),
        codigo_barras: productoData.codigo_barras || null,
        imagen: imagenUrl || null,
        estado: 'activo',
        fecha_creacion: new Date().toISOString(),
        precio: parseFloat(productoData.precio_venta || productoData.precio || 0),
        stock: parseFloat(productoData.stock || 0),
        tipo_unidad: productoData.tipo_unidad || 'unidad',
        marca: productoData.marca || null,
        fecha_vencimiento: productoData.fecha_vencimiento || null,
        retornable: productoData.retornable || false,
        has_precio_alternativo: !!productoData.has_precio_alternativo,
        precio_alternativo: productoData.has_precio_alternativo && productoData.precio_alternativo ? parseFloat(productoData.precio_alternativo) : null,
        motivo_precio_alternativo: productoData.has_precio_alternativo ? productoData.motivo_precio_alternativo || null : null,
        mostrar_precio_web: !!productoData.mostrar_precio_web,
        publicado: !!productoData.publicado,
        tipo_producto_kg: productoData.tipo_unidad === 'kilogramo' ? productoData.tipo_producto_kg || 'ninguno' : 'ninguno',
      };
      
      const docRef = await addDoc(productosCollection, nuevoProducto);
      await recargarProductos();
      return docRef.id;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  };  const actualizarProducto = async (id, productoData, imagenFile) => {
    try {
      let imagenUrl = productoData.imagen || '';
      if (imagenFile) {
        // Note: ImageKit doesn't provide a direct delete API in the JS SDK; deletion should be handled server-side if needed
        imagenUrl = await uploadImageToImageKit(imagenFile, productoData.nombre);
      }

      const productoRef = doc(db, 'productos', id);
      const updatedProducto = {
        categoria_ref: productoData.categoria_ref,
        nombre: productoData.nombre.toUpperCase(),
        codigo_barras: productoData.codigo_barras || null,
        imagen: imagenUrl || null,
        precio: parseFloat(productoData.precio),
        stock: parseFloat(productoData.stock),
        tipo_unidad: productoData.tipo_unidad || 'unidad',
        marca: productoData.marca || null,
        fecha_vencimiento: productoData.fecha_vencimiento || null,
        retornable: productoData.retornable || false,
        has_precio_alternativo: !!productoData.has_precio_alternativo,
        precio_alternativo: productoData.has_precio_alternativo && productoData.precio_alternativo ? parseFloat(productoData.precio_alternativo) : null,
        motivo_precio_alternativo: productoData.has_precio_alternativo ? productoData.motivo_precio_alternativo || null : null,
        mostrar_precio_web: !!productoData.mostrar_precio_web,
        publicado: !!productoData.publicado,
        tipo_producto_kg: productoData.tipo_unidad === 'kilogramo' ? productoData.tipo_producto_kg || 'ninguno' : 'ninguno',
      };      await updateDoc(productoRef, updatedProducto);
      await recargarProductos();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  };

  const eliminarProducto = async (id, imagenUrl) => {
    try {
      // Note: ImageKit image deletion requires server-side API calls; not implemented here
      const productoRef = doc(db, 'productos', id);
      await updateDoc(productoRef, { estado: 'inactivo' });
      await recargarProductos();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  };

  const obtenerProductoPorId = (id) => {
    return productos.find(producto => producto.id === id) || 
           todosLosProductos.find(producto => producto.id === id);
  };

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

  const obtenerProductoPorCodigoBarrasDirecto = async (codigoBarras) => {
    try {
      const productosQuery = query(
        productosCollection,
        where('codigo_barras', '==', codigoBarras),
        where('estado', '==', 'activo'),
        limit(1)
      );
      const snapshot = await getDocs(productosQuery);
      if (snapshot.empty) {
        return null;
      }
      const productoDoc = snapshot.docs[0];
      return {
        id: productoDoc.id,
        ...productoDoc.data(),
      };
    } catch (error) {
      console.error('Error al obtener producto por código de barras:', error);
      return null;
    }
  }; // MODIFICADO: Nueva función para obtener productos relacionados con lógica priorizada
 const obtenerProductosRelacionados = (productoBase) => {
    if (!productoBase || !productoBase.id || !productoBase.nombre || todosLosProductos.length === 0) {
      return [];
    }
  
    // Usamos un Map para evitar duplicados y MANTENER el orden de inserción.
    const relacionados = new Map();
    const nombreBaseLower = productoBase.nombre.toLowerCase();
    const palabras = nombreBaseLower.split(' ').filter(p => p); // Filtra strings vacíos
  
    // 1. Buscar por las dos primeras palabras (si existen)
    if (palabras.length >= 2) {
      const dosPrimerasPalabras = `${palabras[0]} ${palabras[1]}`;
      todosLosProductos
        .filter(p => 
          p.id !== productoBase.id &&
          p.nombre.toLowerCase().startsWith(dosPrimerasPalabras)
        )
        .forEach(p => relacionados.set(p.id, p));
    }
  
    // 2. Si no llegamos a 10, buscar por la primera palabra
    if (relacionados.size < 10 && palabras.length >= 1) {
      const primeraPalabra = palabras[0];
      todosLosProductos
        .filter(p => 
          p.id !== productoBase.id && 
          p.nombre.toLowerCase().startsWith(primeraPalabra)
        )
        .forEach(p => relacionados.set(p.id, p)); // set ignora duplicados
    }
  
    // 3. Si todavía no llegamos a 10, buscar por categoría
    if (relacionados.size < 10 && productoBase.categoria_ref) {
      todosLosProductos
        .filter(p => 
          p.categoria_ref === productoBase.categoria_ref && 
          p.id !== productoBase.id
        )
        .forEach(p => relacionados.set(p.id, p));
    }
  
    // 4. Convertir el Map a un array y tomar los primeros 10
    // El orden se preserva: primero los de 2 palabras, luego 1 palabra, luego categoría.
    return Array.from(relacionados.values()).slice(0, 10);
  };

  const value = {
    categorias,
    productos,
    todosLosProductos,
    loading,
    productosLoading,
    paginaActual,
    hayMasPaginas,
    modoFiltrado,
    PRODUCTOS_POR_PAGINA,
    searchQuery,
    setSearchQuery,
    buscarProductos,
    limpiarBusqueda,
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
    obtenerProductoPorIdDirecto,
    obtenerProductoPorCodigoBarrasDirecto,
    obtenerProductosRelacionados, // Añadimos la nueva función al contexto
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductProvider;