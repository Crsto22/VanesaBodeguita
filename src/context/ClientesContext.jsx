import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ClientesContext = createContext();

export const useClientes = () => useContext(ClientesContext);

export const ClientesProvider = ({ children }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Referencia a la colección de clientes
  const clientesCollection = collection(db, 'clientes');

  // Obtener clientes en tiempo real
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(clientesCollection, (snapshot) => {
      const clientesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClientes(clientesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Crear un nuevo cliente
  const crearCliente = async (clienteData) => {
    try {
      const nuevoCliente = {
        ...clienteData,
        fecha_creacion: new Date(),
        creado_por: currentUser.uid
      };
      await addDoc(clientesCollection, nuevoCliente);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      throw error;
    }
  };

  // Actualizar un cliente
  const actualizarCliente = async (id, clienteData) => {
    try {
      const clienteRef = doc(db, 'clientes', id);
      await updateDoc(clienteRef, clienteData);
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      throw error;
    }
  };

  // Eliminar un cliente
  const eliminarCliente = async (id) => {
    try {
      const clienteRef = doc(db, 'clientes', id);
      await deleteDoc(clienteRef);
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      throw error;
    }
  };

  // Obtener cliente por ID
  const obtenerClientePorId = (id) => {
    return clientes.find(cliente => cliente.id === id);
  };

  const value = {
    clientes,
    loading,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerClientePorId
  };

  return (
    <ClientesContext.Provider value={value}>
      {children}
    </ClientesContext.Provider>
  );
};