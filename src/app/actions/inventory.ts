'use server'

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { redirect } from 'next/navigation';

export async function createProductAction(formData: FormData) {
  const batch = writeBatch(db);

  // 1. Crear referencias con IDs automáticos
  const productRef = doc(collection(db, 'products'));
  const skuRef = doc(collection(db, 'skus'));

  // 2. Obtener datos básicos
  const name = formData.get('name') as string;
  const brand = formData.get('brand') as string;
  const skuCode = formData.get('sku') as string;
  
  // Generamos un nombre descriptivo para la variante
  const variantDetails = formData.get('variantDetail') as string || 'Estándar';
  const fullSkuName = `${name} - ${variantDetails}`;

  // 3. Preparar datos del Producto Padre
  batch.set(productRef, {
    name: name,
    brand: brand,
    description: formData.get('description') || '',
    category: formData.get('category') || 'General',
    imageUrl: formData.get('imageUrl') || '',
    status: 'active',
    totalStock: 0, // Inicia en 0 hasta que hagas una entrada de inventario
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 4. Preparar datos del SKU (Hijo)
  batch.set(skuRef, {
    productId: productRef.id,
    sku: skuCode.toUpperCase(), // Siempre mayúsculas
    barcode: formData.get('barcode') || '',
    name: fullSkuName,
    price: Number(formData.get('price')), // Precio en C$
    cost: Number(formData.get('cost')),   // Costo en C$
    stock: 0,
    lowStockAlert: 5,
    attributes: {
      variant: variantDetails
    }
  });

  // 5. Guardar todo junto (Atómico)
  try {
    await batch.commit();
  } catch (error) {
    console.error("Error guardando producto:", error);
    // Aquí podrías retornar un error, pero por simplicidad redirigimos
    return { error: 'Error al guardar' };
  }

  // 6. Redirigir al listado
  redirect('/dashboard/inventory');
}
