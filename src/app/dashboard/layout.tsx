'use client';

import { AuthProvider } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/dashboard';

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        
        {/* Header Global */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-50 flex justify-between items-center h-16">
          <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
            ERP <span className="text-blue-600">HomeMart</span>
          </h1>
          
          {/* Botón Home: Solo aparece si NO estás en el inicio */}
          {!isHome && (
            <Link 
              href="/dashboard" 
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl shadow-sm hover:bg-blue-100 active:scale-95 transition"
              title="Volver al Menú"
            >
              🏠
            </Link>
          )}
        </header>

        {/* Contenido Principal (Sin padding extra abajo porque ya no hay menú) */}
        <main>
          {children}
        </main>

        {/* YA NO HAY NAV ABAJO */}
      </div>
    </AuthProvider>
  );
}

