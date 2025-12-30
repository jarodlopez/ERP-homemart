'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const router = useRouter();
  
  // Obtenemos estado global para redireccionar si ya está logueado
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // La redirección la maneja el useEffect automáticamente
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas o acceso denegado.');
      setLoggingIn(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            ERP <span className="text-blue-600">HomeMart</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Acceso exclusivo para personal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl mb-6 text-center border border-red-100 flex items-center justify-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
              placeholder="usuario@homemart.com"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loggingIn}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {loggingIn ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-[10px] text-gray-400">
            ¿No tienes cuenta? Solicítala a Administración.<br/>
            Sistema privado v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
