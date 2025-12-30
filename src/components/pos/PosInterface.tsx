'use client';

export default function PosInterface({ session }: { session: any }) {
  return (
    <div className="h-full flex flex-col">
      {/* HEADER DEL POS */}
      <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-xl shadow-sm mb-4">
        <div>
          <h2 className="font-bold text-gray-800">Punto de Venta</h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-xs text-green-600 font-bold uppercase">
              Caja Abierta • Turno #{session.id.slice(0, 5)}
            </p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-xs text-gray-400 uppercase">Fondo Inicial</p>
           <p className="font-bold text-gray-800">C$ {session.initialCash}</p>
        </div>
      </div>

      {/* ÁREA DE TRABAJO (AQUÍ IRÁ EL CARRITO Y PRODUCTOS) */}
      <div className="flex-1 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 flex-col gap-2">
        <span className="text-4xl">🛒</span>
        <p className="font-bold">Módulo de Ventas listo para construirse</p>
        <p className="text-xs max-w-xs text-center">
          En el siguiente paso integraremos el buscador de productos y el carrito de compras.
        </p>
      </div>
    </div>
  );
}
