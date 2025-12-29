'use client';

import { createProductAction } from '@/app/actions/inventory';
import { useState } from 'react';
import Link from 'next/link';

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Nuevo Producto</h1>
        <Link href="/dashboard/inventory" className="text-sm text-red-500">Cancelar</Link>
      </div>

      <form action={createProductAction} onSubmit={() => setLoading(true)} className="p-4 space-y-6">
        
        {/* FOTOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Fotos del Producto</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4 text-center relative min-h-[120px] flex flex-col justify-center items-center">
             {previews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 w-full">
                  {previews.map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="Preview" className="w-full h-20 object-cover rounded-lg shadow-sm" />
                  ))}
                </div>
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <p className="text-xs font-bold text-gray-500 mt-2">Toca para agregar fotos</p>
                </>
              )}
              <input name="images" type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* DATOS DEL PADRE (Generales) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Información General</h2>
          <input name="name" type="text" required placeholder="Nombre del Producto" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
          <textarea name="description" rows={2} placeholder="Descripción breve" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"></textarea>
          
          <div className="grid grid-cols-2 gap-3">
            <input name="brand" type="text" placeholder="Marca (Ej: Samsung)" className="w-full p-3 bg-gray-50 border rounded-xl" />
            <input name="category" type="text" placeholder="Categoría" className="w-full p-3 bg-gray-50 border rounded-xl" />
          </div>
        </div>

        {/* DATOS DEL SKU (Variante Específica) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border-l-4 border-blue-500">
          <h2 className="text-xs font-bold uppercase text-blue-600">Detalles de Venta (SKU)</h2>
          
          {/* AQUI ESTÁN LOS CAMPOS QUE FALTABAN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold">Código SKU</label>
              <input name="sku" type="text" required placeholder="Ej: SAM-S23-NEGRO" className="w-full p-3 border-2 border-gray-200 rounded-xl uppercase font-bold text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold">Código de Barras</label>
              <input name="barcode" type="text" placeholder="Escanea aquí..." className="w-full p-3 bg-gray-50 border rounded-xl text-sm" />
            </div>
          </div>

          <div>
             <label className="text-[10px] text-gray-500 uppercase font-bold">Variante / Atributos</label>
             <input name="variantDetail" type="text" placeholder="Ej: Color Negro, 256GB" className="w-full p-3 bg-gray-50 border rounded-xl" />
          </div>
          
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-bold">Stock Inicial</label>
            <input name="initialStock" type="number" required min="0" defaultValue="1" className="w-full p-3 bg-blue-50 border border-blue-100 text-blue-800 font-bold rounded-xl text-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold">Precio Venta (C$)</label>
              <input name="price" type="number" step="0.01" required className="w-full p-3 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl text-lg" placeholder="0.00" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold">Costo</label>
              <input name="cost" type="number" step="0.01" className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="0.00" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}
 
