import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getInventory() {
  try {
    const q = query(collection(db, 'skus'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    return [];
  }
}

export default async function InventoryPage() {
  const skus: any = await getInventory();

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inventario</h1>
          <p className="text-xs text-gray-500">Moneda: Córdobas (NIO)</p>
        </div>
        <Link href="/dashboard/inventory/new" className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
          <span className="text-2xl font-bold mb-1">+</span>
        </Link>
      </div>

      {/* Lista */}
      <div className="p-4 space-y-3">
        {skus.length === 0 ? (
          <div className="text-center pt-20 opacity-40 italic">No hay productos registrados</div>
        ) : (
          skus.map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.sku}</p>
                <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
              </div>
              <div className="text-right ml-4">
                <div className="text-blue-600 font-bold">C$ {Number(item.price).toLocaleString()}</div>
                <div className="text-[10px] font-bold text-green-600">{item.stock} UNIDADES</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
