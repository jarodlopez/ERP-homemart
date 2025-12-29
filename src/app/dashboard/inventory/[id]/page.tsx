import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getSkuDetail(id: string) {
  try {
    const docRef = doc(db, 'skus', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // BLINDAJE: Si algún dato falta, ponemos un valor seguro
      return { 
        id: docSnap.id, 
        name: data.name || 'Sin Nombre',
        sku: data.sku || '---',
        price: Number(data.price) || 0,
        cost: Number(data.cost) || 0,
        stock: Number(data.stock) || 0,
        // Si no hay imagen, usamos una de placeholder gris
        imageUrl: data.imageUrl || 'https://placehold.co/600x400?text=Sin+Foto',
        barcode: data.barcode || 'N/A',
        attributes: data.attributes || { variant: 'N/A' }
      };
    }
    return null;
  } catch (error) {
    console.error("Error al obtener detalle:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const sku = await getSkuDetail(params.id);

  if (!sku) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-4xl mb-2">😕</div>
        <p className="text-gray-600 font-bold">Producto no encontrado</p>
        <Link href="/dashboard/inventory" className="mt-4 text-blue-600 underline">Volver al inventario</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Imagen Grande con Botón de Regreso */}
      <div className="h-72 bg-gray-200 relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={sku.imageUrl} 
          alt={sku.name} 
          className="w-full h-full object-cover" 
        />
        {/* Degradado para que se vea el botón de atrás */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/50 to-transparent"></div>
        
        <Link href="/dashboard/inventory" className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full shadow-sm hover:bg-white/40 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
      </div>

      <div className="p-6 -mt-8 bg-white rounded-t-[30px] relative z-10 shadow-lg min-h-[500px]">
        {/* Cabecera del Producto */}
        <div className="flex justify-between items-start mb-4">
          <div className="max-w-[70%]">
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
              SKU: {sku.sku}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2 leading-tight">{sku.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Precio</p>
            <p className="text-2xl font-black text-blue-600">C${sku.price.toFixed(2)}</p>
          </div>
        </div>

        {/* Grid de Estadísticas */}
        <div className="grid grid-cols-2 gap-4 mt-8 py-6 border-t border-b border-gray-100">
          <div className="text-center p-2">
            <p className="text-gray-400 text-xs uppercase font-bold mb-1">Stock Disponible</p>
            <p className={`text-2xl font-bold ${sku.stock > 0 ? 'text-gray-800' : 'text-red-500'}`}>
              {sku.stock}
            </p>
          </div>
          <div className="text-center p-2 border-l border-gray-100">
            <p className="text-gray-400 text-xs uppercase font-bold mb-1">Costo Unitario</p>
            <p className="text-2xl font-bold text-gray-800">C${sku.cost.toFixed(2)}</p>
          </div>
        </div>

        {/* Detalles Adicionales */}
        <div className="mt-8 space-y-4">
          <h3 className="font-bold text-gray-900 text-lg">Información Adicional</h3>
          
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Variante</span>
              <span className="text-gray-800 font-medium text-sm">{typeof sku.attributes === 'object' ? (sku.attributes as any).variant : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Código de Barras</span>
              <span className="text-gray-800 font-medium text-sm font-mono">{sku.barcode}</span>
            </div>
          </div>
        </div>

        {/* Botón de Acción (Simulado) */}
        <div className="mt-10">
          <button className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition">
            Editar Producto
          </button>
        </div>
      </div>
    </div>
  );
}

