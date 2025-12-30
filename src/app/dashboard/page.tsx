'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardHome() {
  const { userData } = useAuth();
  
  // Si no ha cargado el rol aún
  if (!userData) return <div className="text-center text-gray-400 mt-10">Cargando perfil...</div>;

  const role = userData.role; // 'admin', 'vendedor', 'bodeguero'

  return (
    <div className="space-y-6 pb-10">
      
      {/* Tarjeta de Bienvenida */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-3xl shadow-xl shadow-gray-200 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        
        <div className="relative z-10">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Bienvenido de nuevo</p>
          <h2 className="text-2xl font-bold mb-6">{userData.name} 👋</h2>
          
          {/* Métricas rápidas (Solo Admin y Vendedor) */}
          {(role === 'admin' || role === 'vendedor') && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-300 uppercase mb-1">Ventas Hoy</p>
                <p className="text-xl font-bold text-green-400">$0.00</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-gray-300 uppercase mb-1">Pedidos</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección de Módulos */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-4 px-1">Tus Aplicaciones</h3>
        
        <div className="grid grid-cols-2 gap-4">
          
          {/* BOTÓN 1: INVENTARIO (Visible para Admin y Bodeguero) */}
          {(role === 'admin' || role === 'bodeguero') && (
            <Link href="/dashboard/inventory" className="block group">
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition active:scale-95 flex flex-col items-center text-center h-40 justify-center gap-3">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition duration-300">
                  📦
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Inventario</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Stock y Productos</p>
                </div>
              </div>
            </Link>
          )}

          {/* BOTÓN 2: VENTAS / POS (Visible para Admin y Vendedor) */}
          {(role === 'admin' || role === 'vendedor') && (
            <Link href="/dashboard/sales" className="block group">
              <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition active:scale-95 flex flex-col items-center text-center h-40 justify-center gap-3">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition duration-300">
                  💰
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Punto de Venta</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Facturación</p>
                </div>
              </div>
            </Link>
          )}

          {/* BOTÓN 3: REPORTES (Solo Admin) */}
          {role === 'admin' && (
            <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 opacity-60 flex flex-col items-center text-center h-40 justify-center gap-3 grayscale cursor-not-allowed">
                <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center text-3xl">
                  📈
                </div>
                <div>
                  <h4 className="font-bold text-gray-400 text-sm">Reportes</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Próximamente</p>
                </div>
            </div>
          )}

          {/* BOTÓN 4: PERFIL (Todos los roles) */}
          <Link href="/dashboard/profile" className="block group">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 hover:border-gray-300 hover:shadow-md transition active:scale-95 flex flex-col items-center text-center h-40 justify-center gap-3">
              <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition duration-300">
                👤
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Mi Perfil</h4>
                <p className="text-[10px] text-gray-400 font-medium">Cuenta y Ajustes</p>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}

