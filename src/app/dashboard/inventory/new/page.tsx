'use client';

import { createProductAction } from '@/app/actions/inventory';
import { useState } from 'react';
import Link from 'next/link';
import BarcodeScanner from '@/components/BarcodeScanner';

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Estados para el Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      
      {/* --- MODAL DEL SCANNER --- */}
      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={(code) => {
            setScannedCode(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Nuevo Producto</h1>
        <Link href="/dashboard/inventory" className="text-sm text-red-500 font-medium">Cancelar</Link>
      </div>

      <form action={createProductAction} onSubmit={() => setLoading(true)} className="p-4 space-y-6">
        
        {/* FOTOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Imágenes</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4 text-center relative min-h-[100px] flex justify-center items-center group hover:bg-gray-100 transition">
             {previews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 w-full">
                  {previews.map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="Preview" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                  ))}
                  <div className="flex items-center justify-center bg-gray-200 rounded-lg text-xs font-bold text-gray-500">
                    + Agregar
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-2xl opacity-50">📷</span>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">Toca para subir fotos</p>
                </div>
              )}
              <input name="images" type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* DATOS GENERALES */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Información Básica</h2>
          <input name="name" type="text" required placeholder="Nombre del Producto" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition outline-none focus:ring-2 focus:ring-blue-100" />
          
          <div className="grid grid-cols-2 gap-3">
            <input name="brand" type="text" placeholder="Marca" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            <input name="category" type="text" placeholder="Categoría" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          </div>
        </div>

        {/* DETALLES DE VENTA (Con Scanner) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-5 border-l-4 border-blue-500">
          <h2 className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
            <span>Datos de Venta</span>
            <div className="h-px bg-blue-100 flex-1"></div>
          </h2>
          
          {/* CÓDIGO DE BARRAS CON BOTÓN INTEGRADO */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Código de Barras</label>
            <div className="relative flex items-center">
              <input 
                name="barcode" 
                type="text" 
                value={scannedCode} 
                onChange={(e) => setScannedCode(e.target.value)} 
                placeholder="Escanea o escribe..." 
                className="w-full pl-3 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition" 
              />
              <button 
                type="button" 
                onClick={() => setShowScanner(true)}
                className="absolute right-1 top-1 bottom-1 w-10 bg-gray-800 text-white rounded-lg flex items-center justify-center shadow-sm active:scale-95 transition"
                title="Abrir cámara"
              >
                {/* Icono de código de barras */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">SKU</label>
              <input name="sku" type="text" required placeholder="Generar" className="w-full p-3 border-2 border-gray-200 rounded-xl uppercase font-bold text-sm outline-none focus:border-blue-400" />
            </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Variante</label>
               <input name="variantDetail" type="text" placeholder="Ej: Rojo" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Stock Inicial</label>
            <input name="initialStock" type="number" required min="0" defaultValue="1" className="w-full p-3 bg-blue-50 border border-blue-100 text-blue-800 font-bold rounded-xl text-lg outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Precio (C$)</label>
              <div className="relative">
                 <span className="absolute left-3 top-3.5 text-green-700 font-bold text-sm">C$</span>
                 <input name="price" type="number" step="0.01" required className="w-full pl-9 p-3 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl text-lg outline-none" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Costo</label>
              <input name="cost" type="number" step="0.01" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="0.00" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition active:scale-95">
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}
 
