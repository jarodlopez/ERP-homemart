'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Tipos
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

  // 1. Cargar datos en el cliente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Traemos SKUS
        const qSkus = query(collection(db, 'skus'));
        const snapSkus = await getDocs(qSkus);
        
        // Traemos Productos (para saber la categoría)
        const qProds = query(collection(db, 'products'));
        const snapProds = await getDocs(qProds);
        const productsMap: any = {};
        snapProds.forEach(doc => { productsMap[doc.id] = doc.data(); });

        // Unimos datos
        const loadedItems: InventoryItem[] = snapSkus.docs.map(doc => {
          const data = doc.data();
          const parent = productsMap[data.productId] || {};
          return {
            id: doc.id,
            name: data.name || 'Sin nombre',
            sku: data.sku || '---',
            price: Number(data.price) || 0,
            stock: Number(data.stock) || 0,
            imageUrl: data.imageUrl || '',
            attributes: data.attributes || {},
            category: parent.category || 'General' 
          };
        });

        setItems(loadedItems);

        // Extraer categorías únicas
        const uniqueCats = Array.from(new Set(loadedItems.map(i => i.category))).filter(Boolean);
        setCategories(['Todas', ...uniqueCats]);
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Lógica de Filtrado
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
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b border-gray-100 space-y-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Inventario</h1>
          <Link href="/dashboard/inventory/new" className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
            <span className="text-xl font-bold mb-0.5">+</span>
          </Link>
        </div>

        {/* Buscador */}
        <input 
          type="text" 
          placeholder="🔍 Buscar por nombre, SKU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-100 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* Filtro Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Resultados */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center pt-20 text-gray-400">Cargando productos...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 text-center opacity-60">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-900 font-medium">No se encontraron resultados.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Link key={item.id} href={`/dashboard/inventory/${item.id}`} className="block">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center active:bg-gray-50 transition">
                
                <div className="w-12 h-12 bg-gray-100 rounded-lg mr-3 overflow-hidden flex-shrink-0 border border-gray-200">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                     src={item.imageUrl || 'https://placehold.co/100?text=No+Img'} 
                     alt={item.name} 
                     className="w-full h-full object-cover" 
                   />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded uppercase tracking-wider">
                      {item.sku}
                    </span>
                    <span className="text-[9px] font-bold text-blue-400 border border-blue-100 px-1 rounded uppercase">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 truncate text-sm mt-0.5">{item.name}</h3>
                </div>

                <div className="text-right pl-2 ml-2 border-l border-gray-50">
                  <div className="text-blue-600 font-bold text-sm whitespace-nowrap">C$ {item.price.toFixed(2)}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${item.stock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {item.stock === 0 ? 'AGOTADO' : `${item.stock} unds`}
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

