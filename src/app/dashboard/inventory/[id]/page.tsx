import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getFullProductData(skuId: string) {
  try {
    // 1. Buscamos el SKU (Hijo)
    const skuRef = doc(db, 'skus', skuId);
    const skuSnap = await getDoc(skuRef);
    
    if (!skuSnap.exists()) return null;
    const skuData = skuSnap.data();

    // 2. Buscamos el Producto Padre usando el productId que está en el SKU
    let productData = {};
    if (skuData.productId) {
      const productRef = doc(db, 'products', skuData.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        productData = productSnap.data();
      }
    }

    // 3. Mezclamos todo en un solo objeto para la vista
    return {
      id: skuSnap.id,
      sku: skuData.sku || '---',
      name: skuData.name || 'Producto',
      price: Number(skuData.price) || 0,
      cost: Number(skuData.cost) || 0,
      stock: Number(skuData.stock) || 0,
      imageUrl: skuData.imageUrl || 'https://placehold.co/600x400?text=Sin+Imagen',
      barcode: skuData.barcode || '---',
      variant: skuData.attributes?.variant || 'Única',
      // Datos del Padre
      brand: (productData as any).brand || 'Genérico',
      category: (productData as any).category || 'General',
      description: (productData as any).description || ''
    };
  } catch (error) {
    console.error("Error obteniendo datos:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getFullProductData(params.id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-4xl mb-2">🕵️‍♂️</div>
        <h2 className="text-xl font-bold text-gray-800">Producto no encontrado</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">El ID {params.id} no existe en la base de datos.</p>
        <Link href="/dashboard/inventory" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">
          Volver al Listado
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Imagen Grande */}
      <div className="h-72 bg-gray-100 relative w-full group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        
        {/* Botón Volver Flotante */}
        <Link href="/dashboard/inventory" className="absolute top-4 left-4 bg-black/30 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/50 transition">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </div>

      <div className="p-6 -mt-8 bg-white rounded-t-[30px] relative z-10 shadow-xl min-h-[500px]">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-4">
             <div className="flex gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{product.brand}</span>
                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">{product.category}</span>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          </div>
          <div className="text-right">
             <p className="text-3xl font-black text-blue-600 tracking-tight">
               <span className="text-sm font-normal text-gray-400 mr-1">C$</span>
               {product.price.toFixed(2)}
             </p>
          </div>
        </div>

        {/* Stock y Costo */}
        <div className="grid grid-cols-2 gap-4 mt-6 py-6 border-t border-b border-gray-100">
          <div className="text-center">
            <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Stock Disponible</p>
            <p className={`text-2xl font-bold ${product.stock > 0 ? 'text-gray-800' : 'text-red-500'}`}>
              {product.stock}
            </p>
          </div>
          <div className="text-center border-l border-gray-100">
            <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Variante</p>
            <p className="text-lg font-bold text-gray-800 truncate px-2">{product.variant}</p>
          </div>
        </div>

        {/* Detalles Técnicos */}
        <div className="mt-8 space-y-4">
          <h3 className="font-bold text-gray-900">Detalles del Producto</h3>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">SKU Interno</span>
              <span className="font-mono font-medium text-gray-900">{product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Código de Barras</span>
              <span className="font-mono font-medium text-gray-900">{product.barcode}</span>
            </div>
            {product.description && (
              <div className="pt-2 border-t border-gray-200 mt-2">
                <p className="text-gray-500 mb-1">Descripción:</p>
                <p className="text-gray-800 leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

