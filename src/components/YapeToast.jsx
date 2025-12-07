import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePagosYape } from '../context/PagosYapeContext';
import YapeLogo from '../assets/yape-logo.png';

const YapeToast = () => {
  const { nuevoPago } = usePagosYape();

  return (
    <AnimatePresence>
      {nuevoPago && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-md pointer-events-none"
            style={{ transform: 'translate(-50%, 0)' }}
          >
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-200 overflow-hidden pointer-events-auto">
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-4">
                <div className="flex items-center gap-3">
                  <img src={YapeLogo} alt="Yape" className="h-10 w-10 flex-shrink-0 rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                      {nuevoPago.mensaje || 'Nuevo pago recibido'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

  );
};

export default YapeToast;
