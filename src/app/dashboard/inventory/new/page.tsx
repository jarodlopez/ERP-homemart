'use client';

import { createProductAction } from '@/app/actions/inventory';
import { useState } from 'react';
import Link from 'next/link';

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]); // Estado para ver las fotos antes de subir

  // Función mágica para ver la foto apenas la seleccionas
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
        
        {/* Ficha Técnica con Carga de Imágenes */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Datos Generales</h2>
          
          {/* ÁREA DE FOTOS CON PREVIEW */}
          <div className="space-y-3">
             <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 text-center hover:bg-gray-100 transition relative">
              {previews.length > 0 ? (
                // Si hay fotos seleccionadas, las mostramos
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="Preview" className="w-full h-20 object-cover rounded-lg shadow-sm" />
                  ))}
                  <div className="flex items-center justify-center text-xs text-gray-400 bg-white rounded-lg border">
                    + Cambiar
                  </div>
                </div>
              ) : (
                // Si no hay fotos, mostramos el ícono de cámara
                <>
                  <span className="text-3xl">📷</span>
                  <p className="text-xs font-bold text-gray-500 mt-2">Toca para subir fotos</p>
                </>
              )}
              
              {/* El input real (invisible pero funcional) */}
              <input 
                name="images" 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageChange} // <--- Esto activa la preview
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
            {previews.length === 0 && <p className="text-[10px] text-red-400 text-center">* Se recomienda subir al menos 1 foto</p>}
          </div>

          <input name="name" type="text" required placeholder="Nombre del Producto" className="w-full p-3 bg-gray-50 border rounded-xl" />
          
          <div className="grid grid-cols-2 gap-3">
            <input name="brand" type="text" placeholder="Marca" className="w-full p-3 bg-gray-50 border rounded-xl" />
            <input name="category" type="text" placeholder="Categoría" className="w-full p-3 bg-gray-50 border rounded-xl" />
          </div>
        </div>

        {/* Datos SKU e Inventario */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border-l-4 border-blue-500">
          <h2 className="text-xs font-bold uppercase text-blue-600">Venta e Inventario</h2>
          
          <input name="sku" type="text" required placeholder="CÓDIGO SKU" className="w-full p-3 border-2 border-gray-200 rounded-xl uppercase text-center tracking-widest font-bold" />
          <input name="variantDetail" type="text" placeholder="Variante (ej: Rojo XL)" className="w-full p-3 bg-gray-50 border rounded-xl" />
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Stock Inicial</label>
            <input name="initialStock" type="number" required min="0" placeholder="0" className="w-full p-3 bg-blue-50 border border-blue-100 text-blue-800 font-bold rounded-xl text-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 ml-1">Precio Venta (C$)</label>
              <input name="price" type="number" step="0.01" required className="w-full p-3 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl text-lg" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-gray-500 ml-1">Costo</label>
              <input name="cost" type="number" step="0.01" className="w-full p-3 bg-gray-50 border rounded-xl" placeholder="0.00" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center">
          {loading ? 'Subiendo y Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}

