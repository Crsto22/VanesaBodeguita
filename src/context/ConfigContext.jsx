import React, { createContext, useContext, useState, useEffect } from 'react';
import { configDatabase } from '../firebase/firebaseConfig';
import { ref, onValue, set } from 'firebase/database';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe ser usado dentro de ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [configuracion, setConfiguracion] = useState({
    hacer_pedidos: false,
    tienda_abierta: false
  });
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar configuración desde Firebase Realtime Database
  useEffect(() => {
    const configRef = ref(configDatabase, 'configuracion');
    
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        setConfiguracion({
          hacer_pedidos: data.hacer_pedidos || false,
          tienda_abierta: data.tienda_abierta || false
        });
      } else {
        // Si no existe, crear con valores por defecto
        set(configRef, {
          hacer_pedidos: false,
          tienda_abierta: false
        });
      }
      setConfigLoaded(true);
    }, (error) => {
      console.error('Error al cargar configuración:', error);
      setConfigLoaded(true);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Función para actualizar un campo de configuración
  const updateConfig = async (campo, valor) => {
    try {
      setSaving(true);
      const configRef = ref(configDatabase, 'configuracion');
      
      let nuevaConfig = {
        ...configuracion,
        [campo]: valor
      };
      
      // Si se cierra la tienda, también deshabilitar hacer_pedidos
      if (campo === 'tienda_abierta' && valor === false) {
        nuevaConfig.hacer_pedidos = false;
      }
      
      // Si se abre la tienda, también habilitar hacer_pedidos
      if (campo === 'tienda_abierta' && valor === true) {
        nuevaConfig.hacer_pedidos = true;
      }
      
      await set(configRef, nuevaConfig);
      
      return { success: true };
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  };

  // Función para hacer toggle de un campo booleano
  const toggleConfig = async (campo) => {
    const nuevoValor = !configuracion[campo];
    return await updateConfig(campo, nuevoValor);
  };

  // Función para habilitar la tienda rápidamente
  const enableTienda = async () => {
    return await updateConfig('tienda_abierta', true);
  };

  // Función para deshabilitar la tienda rápidamente
  const disableTienda = async () => {
    return await updateConfig('tienda_abierta', false);
  };

  const value = {
    configuracion,
    configLoaded,
    saving,
    updateConfig,
    toggleConfig,
    enableTienda,
    disableTienda
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext;
