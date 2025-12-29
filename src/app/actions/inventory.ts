'use server'

import { db } from '@/lib/firebase';
import { collection, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { redirect } from 'next/navigation';

// Tu API Key de ImgBB
const IMGBB_API_KEY = 'b922654effe3a1ab5ac85cc4c23f97b8';

// Función auxiliar para subir a ImgBB
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

// --- ACCIÓN 1: CREAR PRODUCTO ---
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

  const name = formData.get('name') as string;
  const brand = formData.get('brand') as string;
  const variant = formData.get('variantDetail') as string || 'Estándar';
  const initialStock = Number(formData.get('initialStock')) || 0;

  // 2. Guardar Padre
  batch.set(productRef, {
    name,
    brand,
    description: formData.get('description') || '',
    category: formData.get('category') || 'General',
    images: imageUrls,
    status: 'active',
    totalStock: initialStock,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 3. Guardar SKU
  batch.set(skuRef, {
    productId: productRef.id,
    sku: (formData.get('sku') as string).toUpperCase(),
    barcode: formData.get('barcode') || '',
    name: `${name} - ${variant}`,
    price: Number(formData.get('price')),
    cost: Number(formData.get('cost')),
    stock: initialStock,
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

// --- ACCIÓN 2: AJUSTAR STOCK (NUEVO) ---
export async function updateStockAction(formData: FormData) {
  const id = formData.get('id') as string;
  const newStock = Number(formData.get('newStock'));
  
  if (!id) throw new Error("ID requerido");

  const skuRef = doc(db, 'skus', id);
  
  await updateDoc(skuRef, {
    stock: newStock,
    updatedAt: new Date()
  });

  redirect(`/dashboard/inventory/${id}`);
}

// --- ACCIÓN 3: EDITAR PRODUCTO COMPLETO (NUEVO) ---
export async function updateProductAction(formData: FormData) {
  const id = formData.get('id') as string; // ID del SKU
  const productId = formData.get('productId') as string; // ID del Padre
  
  const skuRef = doc(db, 'skus', id);
  const productRef = doc(db, 'products', productId);

  // 1. Manejo de Nueva Imagen
  const files = formData.getAll('images') as File[];
  let imageUrl = formData.get('currentImageUrl') as string;

  if (files.length > 0 && files[0].size > 0 && files[0].name !== 'undefined') {
    const newUrl = await uploadToImgBB(files[0]);
    if (newUrl) imageUrl = newUrl;
  }

  // 2. Datos
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));
  const cost = Number(formData.get('cost'));
  const barcode = formData.get('barcode') as string;
  const variant = formData.get('variantDetail') as string;

  // 3. Actualizar SKU
  await updateDoc(skuRef, {
    name: `${name} - ${variant}`, // Actualizamos el nombre completo
    price,
    cost,
    barcode,
    imageUrl,
    attributes: { variant }
  });

  // 4. Actualizar Padre
  if (productId) {
    await updateDoc(productRef, {
      name, // Nombre base
      brand: formData.get('brand'),
      category: formData.get('category'),
      description: formData.get('description')
    });
  }

  redirect(`/dashboard/inventory/${id}`);
}

