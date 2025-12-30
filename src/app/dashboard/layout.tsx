'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/dashboard';
  
  // Hooks de Auth
  const { user, userData, loading, logout } = useAuth();
  const router = useRouter();

  // PROTECCIÓN DE RUTA: Si no hay usuario, mandar al login
  useEffect(() => {
    if (!loading && !user) {
      router.push('/'); 
    }
  }, [user, loading, router]);

  // Mientras carga o redirige, mostramos pantalla vacía o loading
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-sm font-bold">Cargando sistema...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER SUPERIOR FIJO */}
      <header className="bg-white shadow-sm px-4 h-16 sticky top-0 z-50 flex justify-between items-center">
        <div>
           {/* Logo / Título */}
           <h1 className="text-lg font-extrabold text-gray-800 tracking-tight leading-none">
             ERP <span className="text-blue-600">HomeMart</span>
           </h1>
           {/* Rol y Nombre del Usuario */}
           <div className="flex items-center gap-1.5 mt-0.5">
             <span className={`w-2 h-2 rounded-full ${userData?.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></span>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate max-w-[150px]">
               {userData?.role || 'Personal'} • {userData?.name?.split(' ')[0]}
             </p>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Botón Home (Solo si NO estás en el dashboard principal) */}
           {!isHome && (
             <Link 
               href="/dashboard" 
               className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl shadow-sm hover:bg-blue-50 transition active:scale-90 border border-gray-200"
               title="Menú Principal"
             >
               🏠
             </Link>
           )}
           
           {/* Botón Logout */}
           <button 
             onClick={logout}
             className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-lg shadow-sm hover:bg-red-100 transition active:scale-90 border border-red-100"
             title="Cerrar Sesión"
           >
             🚪
           </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}

