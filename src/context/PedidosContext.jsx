import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { configFirestore } from '../firebase/firebaseConfig';

const PedidosContext = createContext();

export const usePedidos = () => {
    return useContext(PedidosContext);
};

export const PedidosProvider = ({ children }) => {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Referencia a la colección 'pedidos' en el firestore de configuración
        const pedidosRef = collection(configFirestore, 'pedidos');

        // Query para obtener los pedidos, ordenados por fecha de creación (más recientes primero)
        // Asumimos que existe el campo fecha_creacion basado en la estructura proporcionada
        const q = query(pedidosRef, orderBy('fecha_creacion', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pedidosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log("Pedidos actualizados en tiempo real:", pedidosData.length);
            setPedidos(pedidosData);
            setLoading(false);
        }, (error) => {
            console.error("Error escuchando pedidos:", error);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const actualizarEstadoPedido = async (pedidoId, nuevoEstado) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const pedidoRef = doc(configFirestore, 'pedidos', pedidoId);
            await updateDoc(pedidoRef, {
                estado: nuevoEstado
            });
            console.log(`Pedido ${pedidoId} actualizado a ${nuevoEstado}`);
        } catch (error) {
            console.error("Error al actualizar estado del pedido:", error);
            throw error;
        }
    };

    const actualizarPedidoCompleto = async (pedidoId, data) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const pedidoRef = doc(configFirestore, 'pedidos', pedidoId);
            await updateDoc(pedidoRef, data);
            console.log(`Pedido ${pedidoId} actualizado completamente`, data);
        } catch (error) {
            console.error("Error al actualizar pedido completo:", error);
            throw error;
        }
    };

    const eliminarPedido = async (pedidoId) => {
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const pedidoRef = doc(configFirestore, 'pedidos', pedidoId);
            await deleteDoc(pedidoRef);
            console.log(`Pedido ${pedidoId} eliminado`);
        } catch (error) {
            console.error("Error al eliminar pedido:", error);
            throw error;
        }
    };

    const value = {
        pedidos,
        loading,
        actualizarEstadoPedido,
        actualizarPedidoCompleto,
        eliminarPedido
    };

    return (
        <PedidosContext.Provider value={value}>
            {children}
        </PedidosContext.Provider>
    );
};
