import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateStockAction } from '@/app/actions/inventory';
import Link from 'next/link';

export default async function AdjustStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const docRef = doc(db, 'skus', id);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return <div>Error: Producto no encontrado</div>;
  
  const product = { id: snap.id, ...snap.data() } as any;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Ajustar Stock</h1>
        <p className="text-sm text-gray-500 mb-6">{product.name}</p>

        <form action={updateStockAction} className="space-y-6">
          <input type="hidden" name="id" value={id} />

          <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
            <span className="text-xs font-bold text-blue-500 uppercase">Stock Actual</span>
            <div className="text-3xl font-black text-blue-700">{product.stock}</div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Nuevo Inventario Total</label>
            <input 
              name="newStock" 
              type="number" 
              defaultValue={product.stock} 
              required 
              min="0"
              className="w-full p-4 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Link href={`/dashboard/inventory/${id}`} className="flex items-center justify-center py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">
              Cancelar
            </Link>
            <button type="submit" className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
