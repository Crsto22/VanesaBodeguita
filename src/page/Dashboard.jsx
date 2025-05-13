import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  CreditCard,
  Users,
  Truck,
  Package,
  Bell,
  Menu,
  X,
  Search,
  ArrowRight
} from 'lucide-react';
import Logo from '../assets/Logo.svg';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import IconoInicio from "../assets/IconoInicio.svg"
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [appear, setAppear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);

  // Opciones del menú principal - Accesos rápidos
  const quickAccessOptions = [
    { 
      id: 'ventas', 
      title: 'Ventas', 
      icon: <ShoppingCart className="h-6 w-6" />, 
      color: 'bg-emerald-500', 
      description: 'Registrar ventas y ver historial',
      path: '/ventas'
    },
    { 
      id: 'deudas', 
      title: 'Pagar Deudas', 
      icon: <CreditCard className="h-6 w-6" />, 
      color: 'bg-amber-500', 
      description: 'Gestionar pagos pendientes',
      path: '/deudas'
    },
    { 
      id: 'clientes', 
      title: 'Clientes', 
      icon: <Users className="h-6 w-6" />, 
      color: 'bg-blue-500', 
      description: 'Administrar base de clientes',
      path: '/clientes'
    },
    { 
      id: 'proveedores', 
      title: 'Proveedores', 
      icon: <Truck className="h-6 w-6" />, 
      color: 'bg-violet-500', 
      description: 'Contactos y pedidos',
      path: '/proveedores'
    },
    { 
      id: 'productos', 
      title: 'Productos', 
      icon: <Package className="h-6 w-6" />, 
      color: 'bg-rose-500', 
      description: 'Inventario y catálogo',
      path: '/productos'
    },
  ];

  useEffect(() => {
    setAppear(true);
  }, []);

  const handleOptionClick = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header component */}
      <Header
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        notifications={notifications}
      />

      {/* Sidebar component */}
      <Sidebar
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        quickAccessOptions={quickAccessOptions}
        onOptionClick={handleOptionClick}
        logo={Logo}
      />

      {/* Contenido principal */}
      <main className="px-3 pb-12 pt-4">
        {/* Hero section con saludo y buscador */}
<div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45923a] to-[#3d8033] p-6 text-white shadow-lg">
  {/* Background Image */}
  <img
    src={IconoInicio}
    alt="Background Icon"
    className="absolute right-0 top-1/2 -translate-y-1/2  w-32 h-32 object-contain z-0"
  />

  {/* Text Content */}
  <div className="relative z-10">
    <h1 className="mb-1 text-xl font-bold">¡Hola, {userData?.nombre || currentUser?.email}!</h1>
    <p className="mb-4 text-white/80">¿Qué te gustaría hacer hoy?</p>
  </div>
</div>
        {/* Accesos rápidos destacados */}
        <div className="px-1">
          <h2 className="mb-5 flex items-center text-xl font-bold text-gray-800">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#45923a]"></span>
            Accesos Rápidos
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickAccessOptions.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.path)}
                className={`group relative flex flex-col items-center overflow-hidden rounded-2xl bg-white p-4 text-center shadow-md transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#45923a]/50 ${
                  index === 0 ? 'col-span-2 sm:col-span-1' : ''
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                {index === 0 && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#45923a] text-xs font-bold text-white">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                )}

                <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl text-white ${option.color}`}>
                  {option.icon}
                </div>
                <h3 className="mb-1 font-medium text-gray-800">{option.title}</h3>
                <p className="text-xs text-gray-500">{option.description}</p>

                <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#45923a] transition-all duration-300 group-hover:w-full"></div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;