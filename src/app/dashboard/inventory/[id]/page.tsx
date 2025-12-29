import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Definimos el tipo correcto para Next.js 16 (params es una Promesa)
type Props = {
  params: Promise<{ id: string }>;
};

async function getFullProductData(skuId: string) {
  try {
    if (!skuId) return null;

    // 1. Buscamos el SKU (Hijo)
    const skuRef = doc(db, 'skus', skuId);
    const skuSnap = await getDoc(skuRef);
    
    if (!skuSnap.exists()) return null;
    const skuData = skuSnap.data();

    // 2. Buscamos el Producto Padre
    let productData = {};
    if (skuData.productId) {
      const productRef = doc(db, 'products', skuData.productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        productData = productSnap.data();
      }
    }

    // 3. Mezclamos los datos
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
  // CORRECCIÓN CRÍTICA NEXT.JS 16: Esperamos a que params se resuelva
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const product = await getFullProductData(id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-4xl mb-2">🕵️‍♂️</div>
        <h2 className="text-xl font-bold text-gray-800">Producto no encontrado</h2>
        <p className="text-sm text-gray-500 mt-1">
          No se encontró el documento con ID: <br/>
          <span className="font-mono bg-gray-200 px-2 py-1 rounded text-xs select-all">
            {id || 'ID NO DETECTADO'}
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-4 mb-6 max-w-xs mx-auto">
          Puede que el producto haya sido eliminado o el enlace sea incorrecto.
        </p>
        <Link href="/dashboard/inventory" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
          Volver al Listado
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Imagen Grande */}
      <div className="h-80 bg-gray-100 relative w-full group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={product.imageUrl || 'https://placehold.co/600x400?text=Sin+Imagen'} 
          alt={product.name} 
          className="w-full h-full object-cover" 
        />
        
        {/* Degradado superior */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>

        {/* Botón Volver */}
        <Link href="/dashboard/inventory" className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full shadow-sm hover:bg-white/40 transition active:scale-95">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
      </div>

      <div className="p-6 -mt-10 bg-white rounded-t-[35px] relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] min-h-[500px]">
        
        {/* Barra decorativa para arrastrar (visual) */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

        {/* Cabecera Principal */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
             <div className="flex flex-wrap gap-2 mb-2">
                {product.brand && <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">{product.brand}</span>}
                {product.category && <span className="bg-gray-50 text-gray-600 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">{product.category}</span>}
             </div>
             <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
          </div>
          <div className="text-right">
             <p className="text-3xl font-black text-blue-600 tracking-tighter">
               <span className="text-sm font-bold text-gray-400 mr-0.5 align-top mt-1 inline-block">C$</span>
               {product.price.toFixed(2)}
             </p>
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-2 gap-4 py-2 mb-8">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
            <p className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Stock Disponible</p>
            <p className={`text-2xl font-black ${product.stock > 0 ? 'text-gray-800' : 'text-red-500'}`}>
              {product.stock}
            </p>
            <p className="text-[10px] text-gray-400">unidades</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
             <p className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-wider">Costo Compra</p>
             <p className="text-2xl font-black text-gray-800">C${product.cost.toFixed(2)}</p>
             <p className="text-[10px] text-green-600 font-bold">
               Margen: {product.price > 0 ? Math.round(((product.price - product.cost) / product.price) * 100) : 0}%
             </p>
          </div>
        </div>

        {/* Detalles Técnicos */}
        <div className="space-y-6">
          <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-2">Ficha Técnica</h3>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium">SKU Interno</span>
              <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{product.sku}</span>
            </div>
            
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium">Variante</span>
              <span className="text-gray-900 font-bold">{product.variant}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium">Código de Barras</span>
              <span className="font-mono text-gray-900">{product.barcode !== 'N/A' ? product.barcode : '---'}</span>
            </div>

            {product.description && (
              <div className="mt-4 pt-4">
                <p className="text-gray-500 font-medium mb-2">Descripción</p>
                <p className="text-gray-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-50">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción (Simulados por ahora) */}
        <div className="mt-10 grid grid-cols-2 gap-4">
            <button className="col-span-1 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl active:scale-95 transition hover:bg-gray-50">
               Editar
            </button>
            <button className="col-span-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition hover:bg-blue-700">
               Ajustar Stock
            </button>
        </div>
      </div>
    </div>
  );
}

