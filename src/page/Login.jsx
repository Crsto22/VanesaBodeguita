import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
// Asegúrate de que este archivo existe en tu proyecto
import Logo from '../assets/logo.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appear, setAppear] = useState(false);

  // Animación de aparición al cargar
  useEffect(() => {
    setAppear(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulación de envío (reemplazar con lógica real)
    setTimeout(() => {
      console.log('Login attempt with:', { email, password });
      setIsLoading(false);
      // Aquí deberías agregar la lógica de autenticación real
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-12">
      {/* Contenedor principal con animación */}
      <div 
        className={`w-full max-w-md transform rounded-2xl bg-white p-8 transition-all duration-700 ease-out ${
          appear ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Logo con animación de pulso */}
        <div className="mb-8 flex justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white p-2">
            <img 
              src={Logo} 
              alt="Logo" 
              className="h-24 w-24" 
            />
          </div>
        </div>

        {/* Form con animación secuencial */}
        <form 
          className="space-y-6" 
          onSubmit={handleSubmit}
        >
          {/* Email Input con animación de deslizamiento */}
          <div 
            className={`transform transition-all duration-700 delay-100 ease-out ${
              appear ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
          >
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#45923a]">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-[#45923a]" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border-0 bg-gray-50 py-4 pl-10 pr-3 text-gray-900 placeholder-gray-400 shadow-inner transition-all duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:ring-opacity-50"
                placeholder="Ingresa tu correo"
              />
            </div>
          </div>

          {/* Password Input con animación de deslizamiento */}
          <div 
            className={`transform transition-all duration-700 delay-200 ease-out ${
              appear ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
          >
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#45923a]">
              Contraseña
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-[#45923a]" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-0 bg-gray-50 py-4 pl-10 pr-10 text-gray-900 placeholder-gray-400 shadow-inner transition-all duration-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#45923a] focus:ring-opacity-50"
                placeholder="Ingresa tu contraseña"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 transition-transform duration-200 hover:scale-110"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button con animación */}
          <div 
            className={`pt-4 transform transition-all duration-700 delay-300 ease-out ${
              appear ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
          >
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative flex w-full items-center justify-center rounded-full border-0 bg-[#45923a] py-4 px-6 text-base font-medium text-white shadow-lg transition-all duration-300 hover:bg-[#ffa40c] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#ffa40c] focus:ring-offset-2 ${
                isLoading ? 'cursor-not-allowed opacity-80' : ''
              }`}
            >
              {isLoading ? (
                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Cargando">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ChevronRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
      
      {/* Fondo decorativo animado */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#45923a] opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#ffa40c] opacity-10 blur-3xl"></div>
      </div>
    </div>
  );
};

export default Login;