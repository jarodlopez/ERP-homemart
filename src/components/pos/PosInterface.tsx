
'use client';

import { useState, useEffect, useRef } from 'react';
import { searchProductsAction } from '@/app/actions/pos';
import { usePosStore } from '@/store/posStore';
import BarcodeScanner from '@/components/BarcodeScanner';

export default function PosInterface({ session }: { session: any }) {
  // --- ESTADOS LOCALES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // --- ESTADOS GLOBALES (CARRITO) ---
  const { cart, addToCart, removeFromCart, updateQuantity, getTotal, getItemCount } = usePosStore();
  
  // Referencia para enfocar el input automáticamente
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- EFECTO DE BÚSQUEDA (DEBOUNCE) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        setIsSearching(true);
        const results = await searchProductsAction(searchTerm);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500); // Esperamos 500ms a que termines de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // --- MANEJO DEL ESCÁNER ---
  const handleScan = async (code: string) => {
    setShowScanner(false);
    setIsSearching(true);
    // Buscamos directo el código escaneado
    const results = await searchProductsAction(code);
    
    if (results.length > 0) {
      // Si lo encontramos, lo agregamos directo y limpiamos
      addToCart(results[0]);
      setSearchTerm('');
      setSearchResults([]);
      alert(`Producto agregado: ${results[0].name}`);
    } else {
      alert('Producto no encontrado');
    }
    setIsSearching(false);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-white">
      
      {/* 1. BARRA SUPERIOR (BUSCADOR) */}
      <div className="p-3 border-b border-gray-100 flex gap-2 sticky top-0 bg-white z-20 shadow-sm">
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="🔍 Buscar nombre, SKU o barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 text-gray-800 text-sm py-3 px-4 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition font-medium border border-transparent focus:border-blue-100"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-3 top-3.5">
               <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button 
          onClick={() => setShowScanner(true)}
          className="bg-gray-800 text-white px-4 rounded-lg flex items-center justify-center active:scale-95 transition shadow-md"
          title="Abrir Escáner"
        >
          📷
        </button>
      </div>

      {/* COMPONENTE ESCÁNER (MODAL) */}
      {showScanner && (
        <BarcodeScanner onScanSuccess={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* 2. ÁREA CENTRAL (RESULTADOS O CARRITO) */}
      <div className="flex-1 overflow-y-auto bg-white">
        
        {/* CASO A: MOSTRANDO RESULTADOS DE BÚSQUEDA */}
        {searchTerm.length > 1 && (
          <div className="p-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Resultados ({searchResults.length})</h3>
            
            {searchResults.length === 0 && !isSearching ? (
              <div className="text-center text-gray-400 text-sm py-10">
                <p>No encontramos productos con "{searchTerm}"</p>
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addToCart(product);
                      setSearchTerm(''); // Limpiamos búsqueda al seleccionar
                      setSearchResults([]);
                      searchInputRef.current?.focus(); // Volvemos al teclado
                    }}
                    className="w-full flex justify-between items-center p-3 bg-white hover:bg-gray-50 border-b border-gray-50 text-left active:bg-blue-50 transition group"
                  >
                    <div>
                      <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition">{product.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                         SKU: {product.sku} | Stock: {product.stock}
                      </p>
                    </div>
                    <div className="text-right">
                       <div className="text-blue-600 font-bold text-sm">C$ {product.price}</div>
                       <div className="text-[10px] text-green-600 font-bold">+ Agregar</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CASO B: LISTADO DEL CARRITO (VISTA POR DEFECTO) */}
        {searchTerm.length <= 1 && (
          <div className="pb-24">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-300 opacity-60">
                <span className="text-6xl mb-4 grayscale">🛒</span>
                <p className="font-bold text-lg">Carrito vacío</p>
                <p className="text-xs mt-1">Usa el buscador o escáner para agregar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between sticky top-0 z-10 shadow-sm">
                  <span>Detalle de Venta</span>
                  <span>Subtotal</span>
                </div>
                
                {cart.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center bg-white">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.name}</p>
                      <p className="text-blue-600 text-xs font-bold">PU: C$ {item.price.toFixed(2)}</p>
                    </div>
                    
                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 font-bold rounded shadow-sm active:scale-90 transition text-lg border border-gray-200"
                      >
                        -
                      </button>
                      
                      <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                      
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className={`w-8 h-8 flex items-center justify-center text-white font-bold rounded shadow-sm active:scale-90 transition text-lg ${
                          item.quantity >= item.stock 
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : 'bg-blue-600 shadow-blue-200'
                        }`}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BARRA INFERIOR DE TOTALES (FIJA) */}
      <div className="border-t border-gray-200 bg-white p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30">
         <div className="flex justify-between items-end mb-4">
            <div className="text-gray-500 text-xs font-medium">
              <p>Items: <span className="text-gray-800 font-bold">{getItemCount()}</span></p>
              <p>Turno: <span className="font-mono bg-gray-100 px-1 rounded">#{session.id.slice(-5).toUpperCase()}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total a Pagar</p>
              <p className="text-3xl font-black text-gray-900 leading-none tracking-tight">
                <span className="text-lg text-gray-400 mr-1 font-bold align-top mt-1 inline-block">C$</span>
                {getTotal().toFixed(2)}
              </p>
            </div>
         </div>
         
         <button 
           className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-200 active:scale-[0.98] transition flex justify-between px-6 items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:bg-green-700"
           disabled={cart.length === 0}
         >
            <span>Cobrar</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium opacity-80">C$ {getTotal().toFixed(2)}</span>
              <span className="bg-green-800/30 px-2 py-1 rounded text-sm">➡️</span>
            </div>
         </button>
      </div>
    </div>
  );
}
