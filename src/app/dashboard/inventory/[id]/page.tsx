import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Función para obtener un solo producto
async function getSkuDetail(id: string) {
  const docRef = doc(db, 'skus', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as any;
  }
  return null;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const sku = await getSkuDetail(params.id);

  if (!sku) return <div className="p-10 text-center">Producto no encontrado</div>;

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Imagen Grande */}
      <div className="h-64 bg-gray-100 relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sku.imageUrl} alt={sku.name} className="w-full h-full object-cover" />
        <Link href="/dashboard/inventory" className="absolute top-4 left-4 bg-white/80 p-2 rounded-full shadow backdrop-blur-sm">
          ⬅
        </Link>
      </div>

      <div className="p-5 -mt-6 bg-white rounded-t-3xl relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-1 rounded font-bold uppercase">{sku.sku}</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{sku.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Precio</p>
            <p className="text-2xl font-bold text-green-600">C${sku.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 py-6 border-t border-b border-gray-100">
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase">Stock Actual</p>
            <p className="text-xl font-bold text-gray-800">{sku.stock}</p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-gray-400 text-xs uppercase">Costo Unitario</p>
            <p className="text-xl font-bold text-gray-800">C${sku.cost}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-bold text-gray-800 mb-2">Detalles</h3>
          <p className="text-gray-600 text-sm">Código de Barras: {sku.barcode || 'N/A'}</p>
          <p className="text-gray-600 text-sm">Variante: {sku.attributes?.variant}</p>
        </div>

        {/* Botón placeholder para futuro módulo de stock */}
        <div className="mt-8">
          <button className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed">
            Ajustar Inventario (Próximamente)
          </button>
        </div>
      </div>
    </div>
  );
}
