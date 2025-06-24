import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import IconoNewEditProveedor from '../../assets/Proveedores/IconoProveedores.svg';

const DrawerEditarAñadir = ({ isOpen, onClose, isEditMode, initialData, onSubmit, colors }) => {
    const [formData, setFormData] = useState({
        razon_social: initialData?.razon_social || '',
        ruc: initialData?.ruc || '',
        telefono: initialData?.telefono || '',
        contacto_nombre: initialData?.contacto_nombre || '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ razon_social: '', ruc: '' });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                razon_social: initialData?.razon_social || '',
                ruc: initialData?.ruc || '',
                telefono: initialData?.telefono || '',
                contacto_nombre: initialData?.contacto_nombre || '',
            });
            setErrors({ razon_social: '', ruc: '' });
            setLoading(false);
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (name === 'razon_social' || name === 'ruc') {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateRUC = (ruc) => {
        if (!ruc) return 'RUC es obligatorio';
        if (!/^\d{11}$/.test(ruc)) return 'RUC debe tener 11 dígitos numéricos';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedRazonSocial = formData.razon_social.trim();
        const trimmedRuc = formData.ruc.trim();
        let newErrors = { razon_social: '', ruc: '' };

        if (!trimmedRazonSocial) {
            newErrors.razon_social = 'Razón social es obligatoria';
        }
        newErrors.ruc = validateRUC(trimmedRuc);

        if (newErrors.razon_social || newErrors.ruc) {
            setErrors(newErrors);
            return;
        }

        setErrors({ razon_social: '', ruc: '' });
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                razon_social: trimmedRazonSocial,
                ruc: trimmedRuc,
                // Añadir activo: true solo en modo creación
                ...(isEditMode ? {} : { activo: true }),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 bg-opacity-50 z-50"
                    onClick={onClose}
                />
            )}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                }`}
                style={{ height: '75vh' }}
            >
                <div className="flex flex-col h-full p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">
                            {isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h2>
                        <button onClick={onClose} disabled={loading}>
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
                        <div>
                            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                                Razón Social
                            </label>
                            <input
                                type="text"
                                name="razon_social"
                                value={formData.razon_social}
                                onChange={handleChange}
                                className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-gray-700 outline-none ${
                                    errors.razon_social ? 'border-red-500' : 'border-gray-200'
                                }`}
                                disabled={loading}
                                aria-describedby={errors.razon_social ? 'razon_social-error' : undefined}
                            />
                            {errors.razon_social && (
                                <p id="razon_social-error" className="mt-1 text-sm text-red-500">
                                    {errors.razon_social}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium" style={{ color: colors.primary }}>
                                RUC
                            </label>
                            <input
                                type="text"
                                name="ruc"
                                value={formData.ruc}
                                onChange={handleChange}
                                className={`w-full rounded-lg border bg-gray-50 px-4 py-2.5 text-gray-700 outline-none ${
                                    errors.ruc ? 'border-red-500' : 'border-gray-200'
                                }`}
                                disabled={loading}
                                aria-describedby={errors.ruc ? 'ruc-error' : undefined}
                            />
                            {errors.ruc && (
                                <p id="ruc-error" className="mt-1 text-sm text-red-500">
                                    {errors.ruc}
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
                                Nombre de Contacto (opcional)
                            </label>
                            <input
                                type="text"
                                name="contacto_nombre"
                                value={formData.contacto_nombre}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 outline-none"
                                disabled={loading}
                            />
                        </div>
                        <div className="flex justify-center">
                            <img
                                src={IconoNewEditProveedor}
                                alt="Nuevo o editar proveedor"
                                className="h-40 md:h-16 md:mt-0 mt-8"
                                style={{ color: colors.primary }}
                            />
                        </div>
                        <div className="flex gap-2 mt-auto">
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
                                ) : isEditMode ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default DrawerEditarAñadir;