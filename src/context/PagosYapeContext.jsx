import React, { createContext, useContext, useState, useEffect } from 'react';
import { yapeDb } from '../firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

const PagosYapeContext = createContext();

export const usePagosYape = () => {
  const context = useContext(PagosYapeContext);
  if (!context) {
    throw new Error('usePagosYape debe ser usado dentro de PagosYapeProvider');
  }
  return context;
};

export const PagosYapeProvider = ({ children }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hayNuevosNoLeidos, setHayNuevosNoLeidos] = useState(false);
  const [nuevoPago, setNuevoPago] = useState(null);
  const ultimoPagoIdRef = React.useRef(localStorage.getItem('ultimoPagoIdYape'));

  // Escuchar cambios en tiempo real de la colección pagos
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const pagosRef = collection(yapeDb, 'pagos');
      const q = query(pagosRef, orderBy('timestamp', 'desc'), limit(100));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const pagosData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          const ultimoPagoIdActual = ultimoPagoIdRef.current;
          
          // Detectar nuevo pago
          if (pagosData.length > 0) {
            const pagoMasReciente = pagosData[0];
            
            if (!ultimoPagoIdActual) {
              // Primera carga: guardar referencia sin mostrar toast
              ultimoPagoIdRef.current = pagoMasReciente.id;
              localStorage.setItem('ultimoPagoIdYape', pagoMasReciente.id);
            } else if (pagoMasReciente.id !== ultimoPagoIdActual) {
              // Nuevo pago detectado - mostrar toast
              setNuevoPago(pagoMasReciente);
              
              // Actualizar referencia
              ultimoPagoIdRef.current = pagoMasReciente.id;
              localStorage.setItem('ultimoPagoIdYape', pagoMasReciente.id);
              
              // Limpiar después de 5 segundos
              setTimeout(() => {
                setNuevoPago(null);
              }, 5000);
            }
          }
          
          setPagos(pagosData);
          setLoading(false);
          
          // Verificar si hay pagos nuevos después del último leído
          const ultimoLeido = localStorage.getItem('ultimoYapeLeido');
          if (ultimoLeido && pagosData.length > 0) {
            const hayNuevos = pagosData.some(pago => pago.timestamp > parseInt(ultimoLeido));
            setHayNuevosNoLeidos(hayNuevos);
          } else if (!ultimoLeido && pagosData.length > 0) {
            // Si nunca se han leído, marcar que hay nuevos
            setHayNuevosNoLeidos(true);
          }
        },
        (err) => {
          console.error('Error al escuchar pagos:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      // Cleanup: desuscribirse cuando el componente se desmonte
      return () => unsubscribe();
    } catch (err) {
      console.error('Error al configurar listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Función para formatear fecha desde timestamp (milliseconds)
  const formatDate = (timestamp, fechaString) => {
    // Si existe el campo fecha (string), usarlo directamente
    if (fechaString) {
      return fechaString;
    }
    
    // Si no, convertir timestamp (milliseconds) a fecha
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return `S/ ${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Función para filtrar pagos
  const filtrarPagos = (searchTerm) => {
    if (!searchTerm) return pagos;
    
    const searchLower = searchTerm.toLowerCase();
    return pagos.filter(pago => 
      pago.nombre?.toLowerCase().includes(searchLower) ||
      pago.monto?.toString().includes(searchLower) ||
      pago.codigo?.toLowerCase().includes(searchLower) ||
      pago.mensaje?.toLowerCase().includes(searchLower) ||
      pago.fecha?.toLowerCase().includes(searchLower)
    );
  };

  // Función para obtener estadísticas
  const obtenerEstadisticas = () => {
    const totalPagos = pagos.length;
    const montoTotal = pagos.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0);
    const promedioMonto = totalPagos > 0 ? montoTotal / totalPagos : 0;

    return {
      totalPagos,
      montoTotal,
      promedioMonto
    };
  };

  // Función para obtener últimos 5 pagos
  const obtenerUltimosCincoPagos = () => {
    return pagos.slice(0, 5);
  };

  // Función para marcar todos como leídos
  const marcarComoLeido = () => {
    if (pagos.length > 0) {
      const nuevoTimestamp = pagos[0].timestamp || Date.now();
      localStorage.setItem('ultimoYapeLeido', nuevoTimestamp.toString());
      setHayNuevosNoLeidos(false);
    }
  };

  const value = {
    pagos,
    loading,
    error,
    formatDate,
    formatCurrency,
    filtrarPagos,
    obtenerEstadisticas,
    obtenerUltimosCincoPagos,
    hayNuevosNoLeidos,
    marcarComoLeido,
    nuevoPago
  };

  return (
    <PagosYapeContext.Provider value={value}>
      {children}
    </PagosYapeContext.Provider>
  );
};

export default PagosYapeContext;
