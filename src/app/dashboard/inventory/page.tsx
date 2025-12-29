'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  attributes: any;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [categories, setCategories] = useState<string[]>(['Todas']);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qSkus = query(collection(db, 'skus'));
        const snapSkus = await getDocs(qSkus);
        
        const qProds = query(collection(db, 'products'));
        const snapProds = await getDocs(qProds);
        const productsMap: any = {};
        snapProds.forEach(doc => { productsMap[doc.id] = doc.data(); });

        const loadedItems: InventoryItem[] = snapSkus.docs.map(doc => {
          const data = doc.data();
          const parent = productsMap[data.productId] || {};
          
          const rawCategory = parent.category || 'General';
          const cleanCategory = rawCategory.trim(); 

          return {
            id: doc.id,
            name: data.name || 'Sin nombre',
            sku: data.sku || '---',
            price: Number(data.price) || 0,
            stock: Number(data.stock) || 0,
            imageUrl: data.imageUrl || '',
            attributes: data.attributes || {},
            category: cleanCategory
          };
        });

        setItems(loadedItems);

        const justCategories = loadedItems.map(i => i.category);
        const uniqueSet = new Set(justCategories);
        const uniqueArray = Array.from(uniqueSet).sort();
        setCategories(['Todas', ...uniqueArray]);
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(term) || 
      item.sku.toLowerCase().includes(term);
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header Fijo */}
      <div className="bg-white p-4 sticky top-0 z-20 shadow-sm border-b border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Inventario</h1>
          <Link href="/dashboard/inventory/new" className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
            <span className="text-xl font-bold mb-0.5">+</span>
          </Link>
        </div>

        <input 
          type="text" 
          placeholder="🔍 Buscar producto..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat 
                  ? 'bg-gray-800 text-white border-gray-800' 
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Resultados Estilizada */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center pt-20 text-gray-400">Cargando...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 text-center opacity-60">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-900 font-medium">Sin resultados.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Link key={item.id} href={`/dashboard/inventory/${item.id}`} className="block">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.99] transition">
                
                {/* Imagen Cuadrada y limpia */}
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 relative">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                     src={item.imageUrl || 'https://placehold.co/100?text=No+Img'} 
                     alt={item.name} 
                     className="w-full h-full object-cover" 
                   />
                </div>

                {/* Información Central (Se expande) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center h-16">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 rounded uppercase tracking-wider">
                      {item.sku}
                    </span>
                    <span className="text-[9px] font-bold text-blue-500 border border-blue-100 px-1.5 rounded uppercase truncate max-w-[80px]">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 truncate text-sm leading-tight">{item.name}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.attributes.variant}</p>
                </div>

                {/* Precio y Stock (Derecha fija) */}
                <div className="text-right flex flex-col justify-center h-16 min-w-[70px]">
                  <div className="text-blue-600 font-black text-sm">C$ {Math.round(item.price)}</div>
                  <div className={`text-[10px] font-bold mt-1 ${item.stock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {item.stock === 0 ? 'Agotado' : `${item.stock} unds`}
                  </div>
                </div>

              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
 
