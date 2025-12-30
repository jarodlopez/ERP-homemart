'use client';

import { useState } from 'react';
import { usePosStore } from '@/store/posStore';
import { processSaleAction } from '@/app/actions/pos';

interface Props {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

// Bancos de Nicaragua
const BANKS = ['BAC Credomatic', 'Banpro', 'Lafise Bancentro', 'Ficohsa', 'BDF', 'Avanz', 'Otro'];

export default function CheckoutModal({ session, onClose, onSuccess }: Props) {
  const { cart, getTotal, clearCart } = usePosStore();
  const total = getTotal();

  // Estados del Formulario
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  
  // Guardamos la venta finalizada aquí para que no se pierda al borrar el carrito
  const [finalizedSale, setFinalizedSale] = useState<any>(null);

  // Datos de Pago
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash, transfer, card
  const [amountReceived, setAmountReceived] = useState(total.toString());
  const [bankName, setBankName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // Datos Cliente / Delivery
  const [isDelivery, setIsDelivery] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');

  // Cálculos
  const finalTotal = total + (isDelivery ? Number(deliveryFee) : 0);
  const change = Number(amountReceived) - finalTotal;

  const handleProcessSale = async () => {
    // Validaciones
    if (paymentMethod === 'cash' && Number(amountReceived) < finalTotal) {
      alert("El monto recibido es menor al total.");
      return;
    }
    if ((paymentMethod === 'card' || paymentMethod === 'transfer') && (!bankName || !referenceNumber)) {
        alert("Selecciona el banco e ingresa el número de referencia.");
        return;
    }

    setLoading(true);
    
    const saleData = {
      session: { id: session.id, userId: session.userId, userName: session.userName },
      cart,
      totals: {
        subtotal: total,
        deliveryFee: isDelivery ? Number(deliveryFee) : 0,
        total: finalTotal,
      },
      customer: {
        name: customerName || 'Cliente General',
        phone: customerPhone,
        address: isDelivery ? address : null,
        isDelivery
      },
      payment: {
        method: paymentMethod,
        amountReceived: Number(amountReceived),
        change: change > 0 ? change : 0,
        bank: paymentMethod !== 'cash' ? bankName : null,
        reference: paymentMethod !== 'cash' ? referenceNumber : null
      }
    };

    const result = await processSaleAction(saleData);

    if (result.success) {
      // 1. Guardamos la "foto" de la venta para el recibo
      setFinalizedSale({
          ...saleData,
          saleId: result.saleId // ID generado por el server (HM...)
      });
      
      // 2. Limpiamos el carrito del store
      clearCart();
      
      // 3. Pasamos a pantalla de éxito
      setStep('success');
    } else {
      alert(`Error: ${(result as any).error || 'Error desconocido'}`);
    }
    setLoading(false);
  };

  const sendWhatsApp = () => {
    if (!finalizedSale) return;
    
    const phone = customerPhone.replace(/\D/g, '') || '';
    
    // Construimos la lista de productos
    const itemsList = finalizedSale.cart.map((i:any) => `• ${i.quantity}x ${i.name} (C$ ${i.price})`).join('%0A');
    
    // Mensaje formateado
    const message = `👋 Hola *${customerName || 'Cliente'}*, gracias por tu compra en HomeMart!%0A%0A🧾 *Orden:* ${finalizedSale.saleId}%0A📅 *Fecha:* ${new Date().toLocaleDateString()}%0A%0A📦 *Detalle:*%0A${itemsList}%0A%0A🚚 *Envío:* C$ ${Number(deliveryFee).toFixed(2)}%0A💰 *TOTAL PAGADO: C$ ${finalTotal.toFixed(2)}*`;
    
    const url = phone.length > 7 
      ? `https://wa.me/505${phone}?text=${message}` 
      : `https://wa.me/?text=${message}`;
      
    window.open(url, '_blank');
  };

  // --- VISTA DE ÉXITO ---
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm animate-bounce">
            ✅
          </div>
          
          <h2 className="text-2xl font-black text-gray-800 mb-1">¡Venta Exitosa!</h2>
          <p className="text-gray-500 text-sm font-mono bg-gray-100 py-1 px-3 rounded-lg inline-block mb-6">
            {finalizedSale?.saleId}
          </p>
          
          <div className="text-left bg-gray-50 p-4 rounded-xl mb-6 text-sm">
             <div className="flex justify-between mb-1">
                 <span className="text-gray-500">Total Pagado:</span>
                 <span className="font-bold text-gray-800">C$ {finalTotal.toFixed(2)}</span>
             </div>
             {finalizedSale?.payment?.method !== 'cash' && (
                 <div className="flex justify-between text-xs">
                     <span className="text-gray-400">Ref:</span>
                     <span className="text-gray-600">{finalizedSale?.payment?.reference}</span>
                 </div>
             )}
          </div>

          <div className="grid gap-3">
            <button 
              onClick={sendWhatsApp}
              className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>📱 Enviar Recibo WhatsApp</span>
            </button>
            
            <button 
              onClick={onSuccess} 
              className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition active:scale-95"
            >
              🔄 Nueva Venta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA FORMULARIO ---
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sm:rounded-t-3xl">
          <h2 className="font-bold text-gray-800">Finalizar Venta</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white rounded-full text-gray-500 font-bold shadow-sm">✕</button>
        </div>

        {/* Body Scrollable */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* 1. Tipo de Entrega */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setIsDelivery(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${!isDelivery ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              🏪 En Tienda
            </button>
            <button 
              onClick={() => setIsDelivery(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${isDelivery ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              🛵 Delivery
            </button>
          </div>

          {/* 2. Datos Cliente */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Cliente</h3>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Nombre" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
              />
              <input 
                type="tel" 
                placeholder="WhatsApp (8888-8888)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
              />
            </div>
            
            {isDelivery && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <textarea 
                  placeholder="Dirección de entrega..." 
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex items-center gap-2">
                   <label className="text-xs font-bold text-gray-500">Costo Envío: C$</label>
                   <input 
                    type="number" 
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="w-24 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center"
                   />
                </div>
              </div>
            )}
          </div>

          {/* 3. Pago y Bancos */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Método de Pago</h3>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
               {['cash', 'card', 'transfer'].map(m => (
                 <button
                   key={m}
                   onClick={() => setPaymentMethod(m)}
                   className={`py-2 px-1 text-[10px] font-bold uppercase rounded-lg border ${
                     paymentMethod === m ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500'
                   }`}
                 >
                   {m === 'cash' ? '💵 Efectivo' : m === 'card' ? '💳 Tarjeta' : '🏦 Transf.'}
                 </button>
               ))}
            </div>

            {/* CAMPOS DE BANCO Y REFERENCIA (Si no es efectivo) */}
            {paymentMethod !== 'cash' && (
                <div className="bg-blue-50 p-3 rounded-xl space-y-3 border border-blue-100 animate-in fade-in">
                    <div>
                        <label className="text-[10px] font-bold text-blue-500 uppercase block mb-1">Banco</label>
                        <select 
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full p-2 rounded-lg border border-blue-200 text-sm bg-white"
                        >
                            <option value="">Selecciona Banco...</option>
                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-blue-500 uppercase block mb-1">N° Comprobante / Ref</label>
                        <input 
                            type="text" 
                            placeholder="Ej: 123456"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            className="w-full p-2 rounded-lg border border-blue-200 text-sm"
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
               <div>
                 <p className="text-xs text-gray-500 mb-1">Total a Pagar</p>
                 <p className="text-2xl font-black text-gray-900">C$ {finalTotal.toFixed(2)}</p>
               </div>
               
               {paymentMethod === 'cash' && (
                 <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Recibido</p>
                    <input 
                      type="number" 
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-24 p-1 bg-white border border-gray-300 rounded text-right font-bold text-lg"
                    />
                 </div>
               )}
            </div>

            {paymentMethod === 'cash' && (
              <div className="flex justify-between px-2">
                <span className="text-xs font-bold text-gray-400">Cambio / Vuelto:</span>
                <span className={`font-bold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  C$ {change.toFixed(2)}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white sm:rounded-b-3xl">
          <button 
            onClick={handleProcessSale}
            disabled={loading || (paymentMethod === 'cash' && change < 0)}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : `Confirmar C$ ${finalTotal.toFixed(2)}`}
          </button>
        </div>

      </div>
    </div>
  );
}
 
