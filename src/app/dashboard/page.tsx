import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div className="p-4 space-y-6">
      
      {/* Tarjeta de Bienvenida / Resumen Rápido */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-lg shadow-blue-200">
        <h2 className="text-2xl font-bold mb-1">Hola, Admin 👋</h2>
        <p className="opacity-80 text-sm mb-6">Resumen de actividad hoy:</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
            <p className="text-xs opacity-70 mb-1">Ventas</p>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
            <p className="text-xs opacity-70 mb-1">Pedidos</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>
      </div>
      
      {/* GRILLA DE MENÚ (Aquí agregaremos más módulos en el futuro) */}
      <h3 className="font-bold text-gray-800 text-lg px-1">Módulos</h3>
      
      <div className="grid grid-cols-2 gap-4">
        
        {/* BOTÓN 1: INVENTARIO */}
        <Link href="/dashboard/inventory" className="block group">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition active:scale-95 flex flex-col items-center text-center h-full justify-center space-y-3">
            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mb-1 group-hover:scale-110 transition">
              📦
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Inventario</h4>
              <p className="text-[10px] text-gray-400 font-medium">Productos y Stock</p>
            </div>
          </div>
        </Link>

        {/* BOTÓN 2: VENTAS (POS) */}
        <Link href="/dashboard/sales" className="block group">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition active:scale-95 flex flex-col items-center text-center h-full justify-center space-y-3">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-1 group-hover:scale-110 transition">
              💰
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Ventas</h4>
              <p className="text-[10px] text-gray-400 font-medium">Nueva Venta</p>
            </div>
          </div>
        </Link>

        {/* BOTÓN 3: REPORTES (Futuro) */}
        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 opacity-60 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center text-3xl mb-1">
              📈
            </div>
            <div>
              <h4 className="font-bold text-gray-400">Reportes</h4>
              <p className="text-[10px] text-gray-400 font-medium">Próximamente</p>
            </div>
        </div>

        {/* BOTÓN 4: PERFIL / USUARIOS */}
        <Link href="/dashboard/profile" className="block group">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:border-gray-300 hover:shadow-md transition active:scale-95 flex flex-col items-center text-center h-full justify-center space-y-3">
            <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-3xl mb-1 group-hover:scale-110 transition">
              👤
            </div>
            <div>
              <h4 className="font-bold text-gray-800">Perfil</h4>
              <p className="text-[10px] text-gray-400 font-medium">Mi Cuenta</p>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}

