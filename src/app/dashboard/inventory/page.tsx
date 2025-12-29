import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import Link from 'next/link';

// Obligamos a que la página se regenere en cada visita para ver datos frescos
export const dynamic = 'force-dynamic';

async function getInventory() {
  try {
    const q = query(collection(db, 'skus'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Sin Nombre',
        sku: data.sku || '---',
        price: data.price || 0,
        stock: data.stock || 0,
        imageUrl: data.imageUrl || '', // Importante para la miniatura
        attributes: data.attributes || {}
      };
    });
  } catch (error) {
    console.error("Error cargando inventario:", error);
    return [];
  }
}

export default async function InventoryPage() {
  const skus: any[] = await getInventory();

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header Fijo */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inventario</h1>
          <p className="text-xs text-gray-500">{skus.length} productos registrados</p>
        </div>
        
        <Link href="/dashboard/inventory/new" className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition active:scale-90">
          <span className="text-2xl font-bold mb-1">+</span>
        </Link>
      </div>

      {/* Lista de Productos */}
      <div className="p-4 space-y-3">
        {skus.length === 0 ? (
          /* Estado Vacío */
          <div className="flex flex-col items-center justify-center pt-20 text-center opacity-60">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-900 font-medium">No hay productos aún.</p>
            <p className="text-sm text-gray-500">Toca el botón + para empezar.</p>
          </div>
        ) : (
          /* Lista de Tarjetas Clickeables */
          skus.map((item) => (
            <Link key={item.id} href={`/dashboard/inventory/${item.id}`} className="block">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center active:bg-gray-50 transition">
                
                {/* Miniatura de Imagen */}
                <div className="w-12 h-12 bg-gray-100 rounded-lg mr-3 overflow-hidden flex-shrink-0 border border-gray-200">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                     src={item.imageUrl || 'https://placehold.co/100?text=No+Img'} 
                     alt={item.name} 
                     className="w-full h-full object-cover" 
                   />
                </div>

                {/* Info Central */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 rounded uppercase tracking-wider">
                      {item.sku}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 truncate text-sm mt-0.5">{item.name}</h3>
                </div>

                {/* Precio y Stock Derecha */}
                <div className="text-right pl-2 ml-2 border-l border-gray-50">
                  <div className="text-blue-600 font-bold text-sm whitespace-nowrap">C$ {Number(item.price).toFixed(2)}</div>
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

