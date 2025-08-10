import React from 'react';

const ProductCardSkeleton = () => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse">
            {/* Header con precios */}
            <div className="flex justify-start items-start p-4 pb-2 gap-2">
                {/* Precio principal - Simulando el recuadro verde */}
                <div className="bg-gray-300 rounded-full h-8 w-20"></div>
                {/* Precio alternativo ocasional */}
                {Math.random() > 0.7 && (
                    <div className="bg-gray-200 rounded-full h-8 w-20"></div>
                )}
            </div>

            {/* Imagen del producto */}
            <div className="relative h-40 bg-gray-200 mx-4 mb-4 rounded-lg"></div>

            {/* Nombre del producto */}
            <div className="px-4 mb-3">
                <div className="h-4 bg-gray-300 rounded mx-auto w-3/4"></div>
            </div>

            {/* Categoría y Stock - Simulando los badges */}
            <div className="px-4 pb-4">
                <div className="flex justify-center items-center gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                </div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
