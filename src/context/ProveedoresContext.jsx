import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ProveedoresContext = createContext();

export const useProveedores = () => useContext(ProveedoresContext);

export const ProveedoresProvider = ({ children }) => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    const proveedoresCollection = collection(db, 'proveedores');

    useEffect(() => {
        if (!currentUser) {
            setProveedores([]);
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(proveedoresCollection, (snapshot) => {
            const proveedoresData = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter(proveedor => proveedor.razon_social && typeof proveedor.razon_social === 'string');
            setProveedores(proveedoresData);
            setLoading(false);
        }, (error) => {
            console.error('Error al obtener proveedores:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const crearProveedor = async (proveedorData) => {
        try {
            if (!proveedorData.razon_social || typeof proveedorData.razon_social !== 'string') {
                throw new Error('Razón social es obligatoria');
            }
            if (!proveedorData.ruc || typeof proveedorData.ruc !== 'string') {
                throw new Error('RUC es obligatorio');
            }
            const nuevoProveedor = {
                ...proveedorData,
                fecha_creacion: new Date(),
                creado_por: currentUser.uid,
                activo: true, // Siempre activo al crear
            };
            await addDoc(proveedoresCollection, nuevoProveedor);
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            throw error;
        }
    };

    const actualizarProveedor = async (id, proveedorData) => {
        try {
            if (!proveedorData.razon_social || typeof proveedorData.razon_social !== 'string') {
                throw new Error('Razón social es obligatoria');
            }
            if (!proveedorData.ruc || typeof proveedorData.ruc !== 'string') {
                throw new Error('RUC es obligatorio');
            }
            const proveedorRef = doc(db, 'proveedores', id);
            // No sobrescribimos 'activo' a menos que se pase explícitamente
            await updateDoc(proveedorRef, {
                ...proveedorData,
                fecha_actualizacion: new Date(),
            });
        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
            throw error;
        }
    };

    const desactivarProveedor = async (id) => {
        try {
            const proveedorRef = doc(db, 'proveedores', id);
            await updateDoc(proveedorRef, {
                activo: false,
                fecha_actualizacion: new Date(),
            });
        } catch (error) {
            console.error('Error al desactivar proveedor:', error);
            throw error;
        }
    };

    const obtenerProveedorPorId = (id) => {
        return proveedores.find(proveedor => proveedor.id === id);
    };

    const value = {
        proveedores,
        loading,
        crearProveedor,
        actualizarProveedor,
        desactivarProveedor,
        obtenerProveedorPorId,
    };

    return (
        <ProveedoresContext.Provider value={value}>
            {children}
        </ProveedoresContext.Provider>
    );
};

export default ProveedoresProvider;