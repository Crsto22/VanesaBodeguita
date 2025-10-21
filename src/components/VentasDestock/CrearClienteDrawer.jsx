import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import IconoNewEditCliente from '../../assets/Clientes/IconoNewEditCliente.svg';
import { useClientes } from '../../context/ClientesContext';

const CrearClienteDrawer = ({ isOpen, onClose, onClienteCreado }) => {
    const { crearCliente } = useClientes();
    const colors = { primary: '#45923a' }; // Color verde de VentasDestock
    
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        telefono2: '',
        correo: '',
        descripcion: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ nombre: '' });

    // Reset form data and errors when drawer opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                nombre: '',
                telefono: '',
                telefono2: '',
                correo: '',
                descripcion: ''
            });
            setErrors({ nombre: '' });
            setLoading(false);
        }
    }, [isOpen]);

    // Handle form input changes and clear errors
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'nombre' ? value.toUpperCase() : value 
        }));
        if (name === 'nombre') {
            setErrors(prev => ({ ...prev, nombre: '' }));
        }
    };

    // Handle form submission with validation
    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedNombre = formData.nombre.trim();
        if (!trimmedNombre) {
            setErrors({ nombre: 'Nombre es obligatorio' });
            return;
        }
        setErrors({ nombre: '' });
        setLoading(true);
        try {
            const nuevoClienteId = await crearCliente({
                ...formData,
                nombre: trimmedNombre
            });

            // Callback para notificar que se creó el cliente
            if (onClienteCreado && nuevoClienteId) {
                onClienteCreado(nuevoClienteId);
            }

            // Cerrar el drawer
            onClose();
        } catch (error) {
            console.error('Error al crear cliente:', error);
            setErrors({ nombre: 'Error al crear el cliente. Inténtalo de nuevo.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop dentro del contenedor */}
            {isOpen && (
                <div
                    className="absolute inset-0 bg-black/50 z-10"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`absolute inset-0 bg-white z-20 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                <div className="flex flex-col h-full overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                        <h2 className="text-lg font-semibold">
                            Nuevo Cliente
                        </h2>
                        <button 
                            onClick={onClose} 
                            disabled={loading}
                            className="p-1 rounded-full hover:bg-gray-100"
                            aria-label="Cerrar formulario"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 p-6">
                        <div>
                            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                                Nombre
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-gray-700 outline-none ${
                                    errors.nombre ? 'border-red-500' : 'border-gray-200'
                                }`}
                                disabled={loading}
                                aria-describedby={errors.nombre ? 'nombre-error' : undefined}
                            />
                            {errors.nombre && (
                                <p id="nombre-error" className="mt-1 text-sm text-red-500">
                                    {errors.nombre}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                                Teléfono (opcional)
                            </label>
                            <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                                Teléfono 2 (opcional)
                            </label>
                            <input
                                type="text"
                                name="telefono2"
                                value={formData.telefono2}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                                Correo (opcional)
                            </label>
                            <input
                                type="email"
                                name="correo"
                                value={formData.correo}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                                Descripción (opcional)
                            </label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                                disabled={loading}
                                rows="4"
                            />
                        </div>
                        {/* Icon below inputs */}
                        <div className="flex justify-center py-4">
                            <img
                                src={IconoNewEditCliente}
                                alt="Nuevo cliente"
                                className="h-40 md:h-16"
                                style={{ color: colors.primary }}
                            />
                        </div>
                        <div className="flex gap-2 mt-auto shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white flex items-center justify-center"
                                style={{ backgroundColor: colors.primary }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                ) : (
                                    'Crear'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CrearClienteDrawer;
