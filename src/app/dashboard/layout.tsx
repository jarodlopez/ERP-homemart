'use client';

import { AuthProvider } from '@/context/AuthContext';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="pb-20"> {/* Padding bottom para que el contenido no quede tapado por el menú */}
        {/* Header Simple */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-800">ERP Sistema</h1>
        </header>

        {/* Contenido Principal */}
        <main className="p-4">
          {children}
        </main>

        {/* Menú de Navegación Inferior (Mobile First) */}
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 z-50 safe-area-pb">
          <Link href="/dashboard" className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600">
            <span className="text-xl">🏠</span>
            <span>Inicio</span>
          </Link>
          <Link href="/dashboard/inventory" className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600">
            <span className="text-xl">📦</span>
            <span>Inventario</span>
          </Link>
          <Link href="/dashboard/sales" className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600">
            <span className="text-xl">💰</span>
            <span>Ventas</span>
          </Link>
          <Link href="/dashboard/profile" className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600">
            <span className="text-xl">👤</span>
            <span>Perfil</span>
          </Link>
        </nav>
      </div>
    </AuthProvider>
  );
}
