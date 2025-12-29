'use server'

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { redirect } from 'next/navigation';

const IMGBB_API_KEY = 'b922654effe3a1ab5ac85cc4c23f97b8';

async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.data?.url || '';
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return '';
  }
}

export async function createProductAction(formData: FormData) {
  const batch = writeBatch(db);
  const productRef = doc(collection(db, 'products'));
  const skuRef = doc(collection(db, 'skus'));

  // 1. Subir Imágenes
  const files = formData.getAll('images') as File[];
  const imageUrls: string[] = [];

  for (const file of files) {
    if (file.size > 0 && file.name !== 'undefined') {
      const url = await uploadToImgBB(file);
      if (url) imageUrls.push(url);
    }
  }

  const mainImage = imageUrls.length > 0 ? imageUrls[0] : 'https://placehold.co/400?text=No+Image';

  // 2. Datos del Formulario
  const name = formData.get('name') as string;
  const brand = formData.get('brand') as string;
  const variant = formData.get('variantDetail') as string || 'Estándar';
  
  // CAMBIO: Capturamos el stock inicial
  const initialStock = Number(formData.get('initialStock')) || 0;

  // 3. Guardar Padre (Sumamos el stock inicial al total)
  batch.set(productRef, {
    name,
    brand,
    description: formData.get('description') || '',
    category: formData.get('category') || 'General',
    images: imageUrls,
    status: 'active',
    totalStock: initialStock, // <--- Stock impacta al padre
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 4. Guardar SKU (Guardamos el stock inicial)
  batch.set(skuRef, {
    productId: productRef.id,
    sku: (formData.get('sku') as string).toUpperCase(),
    barcode: formData.get('barcode') || '',
    name: `${name} - ${variant}`,
    price: Number(formData.get('price')),
    cost: Number(formData.get('cost')),
    stock: initialStock, // <--- Stock impacta al hijo
    attributes: { variant },
    imageUrl: mainImage
  });

  try {
    await batch.commit();
  } catch (e) {
    throw new Error("Error al guardar");
  }

  redirect('/dashboard/inventory');
}
 
