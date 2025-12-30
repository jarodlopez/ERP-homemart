'use client';

import { useState, useEffect, useRef } from 'react';
import { searchProductsAction } from '@/app/actions/pos';
import { usePosStore } from '@/store/posStore';
import BarcodeScanner from '@/components/BarcodeScanner';
import CheckoutModal from '@/components/pos/CheckoutModal'; // <--- IMPORT NUEVO

export default function PosInterface({ session }: { session: any }) {
  // --- ESTADOS LOCALES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false); // <--- ESTADO PARA MODAL
  
  // --- ESTADOS GLOBALES ---
  const { cart, addToCart, removeFromCart, updateQuantity, getTotal, getItemCount } = usePosStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce de búsqueda
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
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleScan = async (code: string) => {
    setShowScanner(false);
    setIsSearching(true);
    const results = await searchProductsAction(code);
    if (results.length > 0) {
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
      
      {/* 1. BARRA SUPERIOR */}
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
        >
          📷
        </button>
      </div>

      {/* MODALES */}
      {showScanner && (
        <BarcodeScanner onScanSuccess={handleScan} onClose={() => setShowScanner(false)} />
      )}
      
      {/* AQUÍ ESTÁ LA MAGIA: EL MODAL DE CHECKOUT */}
      {showCheckout && (
        <CheckoutModal 
          session={session}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => setShowCheckout(false)}
        />
      )}

      {/* 2. ÁREA CENTRAL */}
      <div className="flex-1 overflow-y-auto bg-white">
        {searchTerm.length > 1 ? (
          <div className="p-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Resultados ({searchResults.length})</h3>
            {searchResults.length === 0 && !isSearching ? (
              <div className="text-center text-gray-400 text-sm py-10"><p>Sin resultados</p></div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addToCart(product);
                      setSearchTerm('');
                      setSearchResults([]);
                      searchInputRef.current?.focus();
                    }}
                    className="w-full flex justify-between items-center p-3 bg-white hover:bg-gray-50 border-b border-gray-50 text-left active:bg-blue-50 transition group"
                  >
                    <div>
                      <p className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition">{product.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">Stock: {product.stock}</p>
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
        ) : (
          <div className="pb-24">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-300 opacity-60">
                <span className="text-6xl mb-4 grayscale">🛒</span>
                <p className="font-bold text-lg">Carrito vacío</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400 font-bold uppercase tracking-wider flex justify-between sticky top-0 z-10 shadow-sm">
                  <span>Detalle</span>
                  <span>Subtotal</span>
                </div>
                {cart.map((item) => (
                  <div key={item.id} className="p-4 flex justify-between items-center bg-white">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.name}</p>
                      <p className="text-blue-600 text-xs font-bold">PU: C$ {item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                      <button onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white text-gray-600 font-bold rounded shadow-sm">-</button>
                      <span className="w-6 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className={`w-8 h-8 flex items-center justify-center text-white font-bold rounded shadow-sm ${item.quantity >= item.stock ? 'bg-gray-300' : 'bg-blue-600'}`}
                        disabled={item.quantity >= item.stock}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BARRA INFERIOR */}
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
           onClick={() => setShowCheckout(true)} // <--- ESTO ABRE EL MODAL
           className="w-full bg-green-600 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-200 active:scale-[0.98] transition flex justify-between px-6 items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
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

