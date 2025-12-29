import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { updateProductAction } from '@/app/actions/inventory';
import Link from 'next/link';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Cargar Datos Existentes
  const skuRef = doc(db, 'skus', id);
  const skuSnap = await getDoc(skuRef);
  if (!skuSnap.exists()) return <div>Producto no encontrado</div>;
  const sku = skuSnap.data();

  // Cargar datos del padre si existe
  let product = { name: '', brand: '', category: '', description: '' };
  if (sku.productId) {
    const productRef = doc(db, 'products', sku.productId);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      product = productSnap.data() as any;
    }
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-24">
      <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">Editar Producto</h1>
        <Link href={`/dashboard/inventory/${id}`} className="text-sm text-red-500">Cancelar</Link>
      </div>

      <form action={updateProductAction} className="p-4 space-y-6">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="productId" value={sku.productId} />
        <input type="hidden" name="currentImageUrl" value={sku.imageUrl} />

        {/* FOTOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sku.imageUrl || 'https://placehold.co/100'} alt="Actual" className="w-24 h-24 object-cover rounded-lg mx-auto mb-2" />
            
            <div className="relative overflow-hidden inline-block">
                <button type="button" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">Cambiar Foto</button>
                <input name="images" type="file" accept="image/*" className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer" />
            </div>
            <p className="text-[10px] text-gray-400">Deja esto vacío para mantener la foto actual</p>
        </div>

        {/* DATOS GENERALES */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-400">Datos Principales</h2>
          
          <div>
            <label className="text-xs font-bold text-gray-500">Nombre Base</label>
            <input name="name" type="text" defaultValue={product.name} className="w-full p-3 bg-gray-50 border rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="text-xs font-bold text-gray-500">Marca</label>
                <input name="brand" type="text" defaultValue={product.brand} className="w-full p-3 bg-gray-50 border rounded-xl" />
             </div>
             <div>
                <label className="text-xs font-bold text-gray-500">Categoría</label>
                <input name="category" type="text" defaultValue={product.category} className="w-full p-3 bg-gray-50 border rounded-xl" />
             </div>
          </div>

          <div>
             <label className="text-xs font-bold text-gray-500">Descripción</label>
             <textarea name="description" rows={2} defaultValue={product.description} className="w-full p-3 bg-gray-50 border rounded-xl"></textarea>
          </div>
        </div>

        {/* PRECIOS Y VARIANTES */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border-l-4 border-orange-500">
          <h2 className="text-xs font-bold uppercase text-orange-600">Precios y Detalles</h2>
          
          <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-xs font-bold text-gray-500">Precio Venta</label>
               <input name="price" type="number" step="0.01" defaultValue={sku.price} className="w-full p-3 bg-green-50 border border-green-200 text-green-800 font-bold rounded-xl" />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500">Costo</label>
               <input name="cost" type="number" step="0.01" defaultValue={sku.cost} className="w-full p-3 bg-gray-50 border rounded-xl" />
             </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Variante</label>
            <input name="variantDetail" type="text" defaultValue={sku.attributes?.variant} className="w-full p-3 bg-gray-50 border rounded-xl" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Código de Barras</label>
            <input name="barcode" type="text" defaultValue={sku.barcode} className="w-full p-3 bg-gray-50 border rounded-xl" />
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition">
          Guardar Cambios
        </button>
      </form>
    </div>
  );
}
