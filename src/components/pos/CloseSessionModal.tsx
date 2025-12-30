'use client';

import { useState } from 'react';
import { closeSessionAction } from '@/app/actions/pos';

interface Props {
  session: any;
  onClose: () => void;
}

export default function CloseSessionModal({ session, onClose }: Props) {
  const [finalCash, setFinalCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Cálculos estimados
  const expectedTotal = (session.initialCash || 0) + (session.totalSales || 0);
  const currentDiff = Number(finalCash) - expectedTotal;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            🔐
          </div>
          <h2 className="text-xl font-black text-gray-800">Cierre de Turno</h2>
          <p className="text-xs text-gray-400">Turno #{session.id.slice(-5).toUpperCase()}</p>
        </div>

        <form action={async (formData) => {
            setLoading(true);
            await closeSessionAction(formData);
            window.location.reload(); 
        }} className="space-y-4">
          
          <input type="hidden" name="sessionId" value={session.id} />

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fondo Inicial:</span>
                <span className="font-bold">C$ {session.initialCash}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ventas Totales:</span>
                <span className="font-bold text-blue-600">+ C$ {session.totalSales || 0}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                <span className="font-bold text-gray-700">Debe haber en caja:</span>
                <span className="font-black text-gray-900">C$ {expectedTotal.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Efectivo Real (Contado)</label>
            <input 
              name="finalCash"
              type="number" 
              step="0.01"
              required
              value={finalCash}
              onChange={(e) => setFinalCash(e.target.value)}
              className="w-full p-3 bg-white border-2 border-blue-100 focus:border-blue-500 rounded-xl text-xl font-bold outline-none"
              placeholder="0.00"
            />
            {finalCash && (
                <p className={`text-xs text-right mt-1 font-bold ${currentDiff < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    Diferencia: {currentDiff > 0 ? '+' : ''} C$ {currentDiff.toFixed(2)}
                </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas / Observaciones</label>
            <textarea 
              name="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none resize-none"
              placeholder="Ej: Se retiró efectivo para pago de luz..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
                type="button" 
                onClick={onClose}
                className="py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
            >
                Cancelar
            </button>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-700 active:scale-95 transition"
            >
                {loading ? 'Cerrando...' : 'Cerrar Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
