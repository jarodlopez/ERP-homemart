'use client';

import { createProductAction, getCategoriesAction } from '@/app/actions/inventory';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BarcodeScanner from '@/components/BarcodeScanner';
import CategoryModal from '@/components/CategoryModal';

export default function NewProductPage() {
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Estados Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState('');

  // Estados Categoría
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => {
    const loadCats = async () => {
      const data = await getCategoriesAction();
      setCategories(data);
    };
    loadCats();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Solo mostramos preview local, el archivo real viaja en el form
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      
      {/* MODALES */}
      {showScanner && (
        <BarcodeScanner 
          onScanSuccess={(code) => { setScannedCode(code); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showCatModal && (
        <CategoryModal 
          onClose={() => setShowCatModal(false)}
          onSuccess={(newName) => {
            getCategoriesAction().then(data => setCategories(data));
            setSelectedCat(newName);
          }}
        />
      )}

      {/* HEADER */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Nuevo Producto</h1>
        <Link href="/dashboard/inventory" className="text-sm text-red-500 font-medium">Cancelar</Link>
      </div>

      <form action={createProductAction} onSubmit={() => setLoading(true)} className="p-4 space-y-6">
        
        {/* SECCIÓN FOTOS (Vital para ImgBB) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Imágenes</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4 text-center relative min-h-[120px] flex justify-center items-center group hover:bg-gray-100 transition">
             {previews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 w-full">
                  {previews.map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="Preview" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                  ))}
                  <div className="flex items-center justify-center bg-gray-200 rounded-lg text-xs font-bold text-gray-500 h-20">+</div>
                </div>
              ) : (
                <div className="flex flex-col items-center pointer-events-none">
                  <span className="text-3xl opacity-40 mb-2">📷</span>
                  <p className="text-[10px] font-bold text-gray-400">Toca aquí para subir fotos</p>
                </div>
              )}
              {/* Este input es el que recoge los Files para ImgBB */}
              <input name="images" type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* DATOS GENERALES */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Datos Principales</h2>
          
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombre Producto</label>
            <input name="name" type="text" required placeholder="Ej: Termo Owala 24oz" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition outline-none focus:ring-2 focus:ring-blue-100 font-medium" />
          </div>

          <div>
             <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Descripción</label>
             <textarea name="description" rows={3} placeholder="Para ecommerce..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition outline-none resize-none text-sm"></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Marca</label>
              <input name="brand" type="text" placeholder="Ej: Owala" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" />
            </div>
            
            {/* SELECTOR DE CATEGORÍA */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Categoría</label>
              <div className="flex gap-2">
                <select 
                  name="category" 
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm appearance-none truncate"
                >
                    <option value="">General</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
                <button 
                    type="button"
                    onClick={() => setShowCatModal(true)}
                    className="bg-blue-600 text-white px-3 rounded-xl text-lg font-bold shadow-sm active:scale-95 transition"
                >
                    +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DATOS DE VARIANTE (SKU) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
             <h2 className="text-xs font-bold uppercase text-blue-600">Variante / SKU</h2>
             <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">Venta</span>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Código de Barras</label>
            <div className="relative flex items-center">
              <input name="barcode" type="text" value={scannedCode} onChange={(e) => setScannedCode(e.target.value)} placeholder="Escanea o escribe..." className="w-full pl-3 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition font-mono" />
              <button type="button" onClick={() => setShowScanner(true)} className="absolute right-1 top-1 bottom-1 w-10 bg-gray-800 text-white rounded-lg flex items-center justify-center shadow-sm active:scale-95 transition">📷</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">SKU (Código)</label>
              <input name="sku" type="text" required placeholder="Generar" className="w-full p-3 border-2 border-gray-200 rounded-xl uppercase font-bold text-sm outline-none focus:border-blue-400" />
            </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Variante</label>
               <input name="variantDetail" type="text" placeholder="Ej: Rojo, XL..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Stock Inicial</label>
            <input name="initialStock" type="number" required min="0" defaultValue="1" className="w-full p-3 bg-blue-50 border border-blue-100 text-blue-800 font-bold rounded-xl text-lg outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Precio Venta (C$)</label>
              <div className="relative">
                 <span className="absolute left-3 top-3.5 text-green-700 font-bold text-sm">C$</span>
                 <input name="price" type="number" step="0.01" required className="w-full pl-9 p-3 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl text-lg outline-none" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Costo Compra</label>
              <input name="cost" type="number" step="0.01" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="0.00" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition active:scale-95 text-lg">
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}

