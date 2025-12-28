export type ProductStatus = 'active' | 'archived' | 'draft';

// El Padre (Contenedor general)
export interface Product {
  id?: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  imageUrl: string;
  totalStock: number; // Suma del stock de todas sus variantes
  status: ProductStatus;
  createdAt: Date; 
  updatedAt: Date;
}

// El Hijo (La unidad de venta real)
export interface Sku {
  id?: string;
  productId: string;  // Conexión con el padre
  sku: string;        // Tu código único (ej: POLO-ROJ-M)
  barcode: string;    // EAN/UPC para el lector
  name: string;       // Nombre autogenerado
  attributes: {
    [key: string]: string; // { color: "Rojo", talla: "M" }
  };
  price: number;      // Precio de Venta en C$
  cost: number;       // Costo de Compra en C$
  stock: number;      // Existencia actual
  lowStockAlert: number; 
}
