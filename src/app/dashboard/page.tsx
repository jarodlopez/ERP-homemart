export default function DashboardHome() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold">Resumen del Día</h2>
        <p className="opacity-90">Bienvenido al sistema.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <p className="text-gray-500 text-sm">Ventas Hoy</p>
          <p className="text-2xl font-bold text-gray-800">$0.00</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
          <p className="text-gray-500 text-sm">Pedidos</p>
          <p className="text-2xl font-bold text-gray-800">0</p>
        </div>
      </div>
    </div>
  );
}
