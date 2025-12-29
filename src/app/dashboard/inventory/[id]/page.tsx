import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { deleteProductAction } from '@/app/actions/inventory'; // Importamos la acción

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

async function getFullProductData(skuId: string) {
  try {
    if (!skuId) return null;
    const skuRef = doc(db, 'skus', skuId);
    const skuSnap = await getDoc(skuRef);
    if (!skuSnap.exists()) return null;
    const skuData = skuSnap.data();

    let productData = {};
    if (skuData.productId) {
      const productRef = doc(db, 'products', skuData.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) productData = productSnap.data();
    }

    return {
      id: skuSnap.id,
      sku: skuData.sku || '---',
      name: skuData.name || 'Producto sin nombre',
      price: Number(skuData.price) || 0,
      cost: Number(skuData.cost) || 0,
      stock: Number(skuData.stock) || 0,
      imageUrl: skuData.imageUrl || '',
      barcode: skuData.barcode || 'N/A',
      variant: (skuData.attributes && skuData.attributes.variant) ? skuData.attributes.variant : 'Única',
      brand: (productData as any).brand || '',
      category: (productData as any).category || '',
      description: (productData as any).description || ''
    };
  } catch (error) {
    console.error("Error obteniendo datos:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const product = await getFullProductData(id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h2 className="text-lg font-bold text-gray-800">Producto no encontrado</h2>
        <Link href="/dashboard/inventory" className="mt-6 bg-gray-800 text-white px-6 py-3 rounded-lg font-medium text-sm">
          Volver al Inventario
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-10">
      {/* 1. Imagen Principal */}
      <div className="h-64 bg-gray-100 relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={product.imageUrl || 'https://placehold.co/600x400?text=Sin+Imagen'} 
          alt={product.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none"></div>
        
        <Link href="/dashboard/inventory" className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-sm transition active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      {/* 2. Información */}
      <div className="p-5 bg-white relative z-10 -mt-4 rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1 pr-4">
             <div className="flex flex-wrap gap-2 mb-1.5">
                {product.brand && <span className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">{product.brand}</span>}
                {product.category && product.brand && <span className="text-gray-300">•</span>}
                {product.category && <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{product.category}</span>}
             </div>
             <h1 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          </div>
          <div className="text-right bg-blue-50 px-3 py-2 rounded-xl">
             <p className="text-2xl font-bold text-blue-600 leading-none">
               <span className="text-sm font-bold mr-0.5">C$</span>
               {product.price.toFixed(2)}
             </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
            <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Stock Disponible</p>
            <p className={`text-xl font-bold ${product.stock > 0 ? 'text-gray-800' : 'text-red-500'}`}>
              {product.stock} <span className="text-sm font-normal text-gray-500">unds</span>
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
             <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Costo Unitario</p>
             <p className="text-xl font-bold text-gray-800">C${product.cost.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Detalles</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-500">SKU</span>
              <span className="font-mono font-medium text-gray-900 bg-gray-100 px-2 rounded">{product.sku}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Variante</span>
              <span className="text-gray-900 font-medium">{product.variant}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Código de Barras</span>
              <span className="font-mono text-gray-900">{product.barcode}</span>
            </li>
          </ul>

          {product.description && (
            <div className="pt-3">
              <p className="text-gray-500 text-sm mb-2">Descripción</p>
              <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* 3. Botones Acciones */}
        <div className="mt-8 grid grid-cols-2 gap-3">
            <Link 
              href={`/dashboard/inventory/${id}/edit`}
              className="col-span-1 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl text-center active:scale-95 transition hover:bg-gray-50 hover:border-gray-300"
            >
               Editar
            </Link>
            
            <Link 
              href={`/dashboard/inventory/${id}/adjust`}
              className="col-span-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 text-center active:scale-95 transition hover:bg-blue-700"
            >
               Ajustar Stock
            </Link>
        </div>

        {/* 4. BOTÓN BORRAR (NUEVO) */}
        <div className="mt-12 border-t border-gray-100 pt-6">
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <button 
              type="submit"
              className="w-full text-red-500 text-xs font-bold uppercase tracking-widest py-4 hover:bg-red-50 rounded-xl transition"
            >
              🗑️ Eliminar Producto
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

