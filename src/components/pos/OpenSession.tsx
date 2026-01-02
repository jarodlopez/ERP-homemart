
'use client';

import { useState } from 'react';
import { openSessionAction } from '@/app/actions/pos';

interface Props {
  userData: any;
  userId: string;
  onSessionStart: () => void; // <--- ESTO ES VITAL PARA QUE CAMBIE LA VISTA
}

export default function OpenSession({ userData, userId, onSessionStart }: Props) {
  const [loading, setLoading] = useState(false);
  const [cash, setCash] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evitamos recarga del navegador
    setLoading(true);

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('userName', userData?.name || 'Vendedor');
    formData.append('initialCash', cash || '0');

    try {
      await openSessionAction(formData);
      
      // AQUÍ ESTÁ EL TRUCO: 
      // Llamamos a esta función para decirle a SalesPage: "¡Listo, carga el POS!"
      onSessionStart(); 
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Error al abrir la caja");
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          🔐
        </div>
        
        <h2 className="text-2xl font-black text-gray-800 mb-2">Apertura de Caja</h2>
        <p className="text-gray-500 text-sm mb-8">
          Hola <strong>{userData?.name}</strong>. Para comenzar a vender, ingresa el monto de efectivo inicial en caja (Fondo).
        </p>

        <form onSubmit={handleSubmit}>
          
          <div className="mb-6 text-left">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">
              Fondo de Caja (C$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-400 font-bold">C$</span>
              <input 
                name="initialCash"
                type="number" 
                step="0.01"
                required
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-2xl font-bold text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>
            
            {/* TUS BOTONES RÁPIDOS (Conservados) */}
            <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-2">
              {[0, 500, 1000, 2000, 5000].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCash(amount === 0 ? '' : amount.toString())}
                  className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition whitespace-nowrap"
                >
                  {amount === 0 ? 'Limpiar' : `C$ ${amount}`}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Abriendo Turno...</span>
                </>
            ) : (
              <>
                <span>Abrir Caja y Vender</span>
                <span>➡️</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
