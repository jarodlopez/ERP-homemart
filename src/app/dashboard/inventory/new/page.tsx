'use client';

import { createProductAction } from '@/app/actions/inventory';
import { useState } from 'react';
import Link from 'next/link';

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      {/* Header Fijo */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Nuevo Producto</h1>
        <Link href="/dashboard/inventory" className="text-sm font-medium text-red-500 hover:bg-red-50 px-3 py-1 rounded-md transition">
          Cancelar
        </Link>
      </div>

      <form action={createProductAction} onSubmit={() => setLoading(true)} className="p-4 space-y-6">
        
        {/* Tarjeta 1: Info General */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Ficha Técnica</h2>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Producto</label>
            <input name="name" type="text" required placeholder="Ej: Jabón Líquido" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Marca</label>
              <input name="brand" type="text" placeholder="Ej: Dove" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
              <input name="category" type="text" placeholder="Hogar" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Imagen (URL)</label>
            <input name="imageUrl" type="url" placeholder="https://..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs" />
          </div>
        </div>

        {/* Tarjeta 2: Datos de Venta (SKU) */}
        <div className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-blue-500 space-y-5">
          <div className="flex justify-between items-center">
             <h2 className="text-xs font-bold uppercase text-blue-600 tracking-wider">Datos de Venta (SKU)</h2>
             <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded-full font-bold">Moneda: NIO</span>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">SKU (Código Manual)</label>
            <input name="sku" type="text" required placeholder="JAB-DOV-1L" className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl uppercase font-mono text-center tracking-widest focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Variante (Talla/Color)</label>
            <input name="variantDetail" type="text" placeholder="Ej: Aroma Lavanda - 1 Litro" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Venta</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">C$</span>
                <input name="price" type="number" step="0.01" required className="w-full pl-10 p-3 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl outline-none text-lg" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Costo</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">C$</span>
                <input name="cost" type="number" step="0.01" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Código de Barras</label>
            <input name="barcode" type="text" placeholder="Escanea aquí..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          </div>
        </div>

        {/* Botón Flotante de Acción */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent">
          <button type="submit" disabled={loading} className="w-full max-w-md mx-auto bg-blue-600 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-blue-700 active:scale-95 transition flex justify-center items-center text-lg">
            {loading ? (
              <span className="flex items-center gap-2">
                {/* SVG CORREGIDO: className en lugar de class, strokeWidth en lugar de stroke-width */}
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : 'Guardar Producto'}
          </button>
        </div>

      </form>
    </div>
  );
}

