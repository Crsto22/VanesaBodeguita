import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';

const ReportesContext = createContext();

export const useReportes = () => {
    return useContext(ReportesContext);
};

export const ReportesProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para obtener reporte de botellas retornables pendientes por cliente
    // Filtramos por fecha si se proporciona rango (opcional)
    const obtenerReporteRetornables = async (fechaInicio = null, fechaFin = null) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Obtener todas las ventas con estado 'pagado' o 'pendiente' (ya que pueden tener botellas pendientes)
            // Optimizamos: traer solo las que tengan historial_retornables o productos retornables si fuera posible,
            // pero Firestore no permite filtrar por campos dentro de arrays de objetos fácilmente.
            // Traeremos ventas y filtraremos en cliente.

            // Construir query base
            let ventasQuery = query(collection(db, 'ventas'), orderBy('fecha_creacion', 'desc'));

            // Aplicar filtros de fecha si existen
            if (fechaInicio && fechaFin) {
                // Convertir fechas a strings ISO o Timestamps según guardado.
                // Asumiendo string ISO como en el ejemplo: "2026-01-01T06:46:10.758Z"
                ventasQuery = query(
                    collection(db, 'ventas'),
                    where('fecha_creacion', '>=', fechaInicio.toISOString()),
                    where('fecha_creacion', '<=', fechaFin.toISOString()),
                    orderBy('fecha_creacion', 'desc')
                );
            }

            const querySnapshot = await getDocs(ventasQuery);
            const ventas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Procesar ventas para encontrar retornables pendientes
            const clientesMap = {};

            ventas.forEach(venta => {
                // Filtrar productos retornables
                const productosRetornables = venta.productos?.filter(p => p.retornable) || [];

                if (productosRetornables.length > 0) {
                    const clienteId = venta.cliente_ref;
                    const clienteNombre = venta.nombre_cliente || 'Cliente Desconocido';

                    // Calcular pendientes: cantidad - devueltos (si historial_retornables existe)
                    // OJO: La lógica de DeudasDestock usa un campo 'total_retornables' en la venta o calcula dinámicamente.
                    // En el ejemplo del usuario, vemos 'total_retornables: 1' en el producto o venta.
                    // Asumiremos que debemos sumar lo prestado y restar lo devuelto si existe logica de devolucion.
                    // Basado en DeudasDestock: venta.total_retornables suele ser el saldo pendiente de esa venta.

                    // Si la venta tiene un campo explicito de deuda de retornables, lo usamos.
                    // Si no, calculamos: (sum(p.cantidad_retornable) - sum(devoluciones))

                    // Revisando DeudasDestock: v.total_retornables parece ser el campo clave.
                    const saldoRetornablesVenta = venta.total_retornables || 0;

                    if (saldoRetornablesVenta > 0) {
                        if (!clientesMap[clienteId]) {
                            clientesMap[clienteId] = {
                                clienteId,
                                nombre: clienteNombre,
                                totalBotellas: 0,
                                ventas: []
                            };
                        }

                        // Detalles de los productos retornables de esta venta
                        const detallesProductos = productosRetornables.map(p => ({
                            nombre: p.nombre,
                            cantidad: p.cantidad_retornable || p.cantidad, // Asumiendo cantidad_retornable es lo que se prestó
                        }));

                        clientesMap[clienteId].ventas.push({
                            ventaId: venta.id,
                            fecha: venta.fecha_creacion,
                            productos: detallesProductos,
                            pendientes: saldoRetornablesVenta
                        });

                        clientesMap[clienteId].totalBotellas += saldoRetornablesVenta;
                    }
                }
            });

            // Convertir mapa a array
            const reporte = Object.values(clientesMap).sort((a, b) => b.totalBotellas - a.totalBotellas);

            setLoading(false);
            return reporte;

        } catch (err) {
            console.error("Error obteniendo reporte de retornables:", err);
            setError("Error al generar el reporte de retornables.");
            setLoading(false);
            return [];
        }
    };

    const value = {
        obtenerReporteRetornables,
        loading,
        error
    };

    return (
        <ReportesContext.Provider value={value}>
            {children}
        </ReportesContext.Provider>
    );
};
