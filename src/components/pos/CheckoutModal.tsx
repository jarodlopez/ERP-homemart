
'use client';

import { useState } from 'react';
import { usePosStore } from '@/store/posStore';
import { processSaleAction } from '@/app/actions/pos';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

const BANKS = ['BAC Credomatic', 'Banpro', 'Lafise Bancentro', 'Ficohsa', 'BDF', 'Avanz', 'Otro'];

export default function CheckoutModal({ session, onClose, onSuccess }: Props) {
  const { cart, getTotal, clearCart } = usePosStore();
  const currentCartTotal = getTotal();

  const [step, setStep] = useState<'details' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  
  // Guardamos la venta finalizada aquí para congelar los datos
  const [finalizedSale, setFinalizedSale] = useState<any>(null);

  // Datos Pago
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [amountReceived, setAmountReceived] = useState(currentCartTotal.toString());
  const [bankName, setBankName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // Datos Cliente
  const [isDelivery, setIsDelivery] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');

  // Cálculos en vivo (para el formulario)
  const liveFinalTotal = currentCartTotal + (isDelivery ? Number(deliveryFee) : 0);
  const change = Number(amountReceived) - liveFinalTotal;

  const handleProcessSale = async () => {
    if (paymentMethod === 'cash' && Number(amountReceived) < liveFinalTotal) {
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
        subtotal: currentCartTotal,
        deliveryFee: isDelivery ? Number(deliveryFee) : 0,
        total: liveFinalTotal,
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
      // 1. Congelar datos
      setFinalizedSale({
          ...saleData,
          saleId: (result as any).saleId 
      });
      // 2. Limpiar
      clearCart();
      // 3. Éxito
      setStep('success');
    } else {
      alert(`Error: ${(result as any).error || 'Error desconocido'}`);
    }
    setLoading(false);
  };

  const sendWhatsApp = () => {
    if (!finalizedSale) return;
    const phone = customerPhone.replace(/\D/g, '') || '';
    
    // Usamos los datos CONGELADOS
    const itemsList = finalizedSale.cart.map((i:any) => `• ${i.quantity}x ${i.name} (C$ ${i.price})`).join('%0A');
    const totalCobrado = finalizedSale.totals.total.toFixed(2);
    const envioCobrado = finalizedSale.totals.deliveryFee.toFixed(2);
    
    const message = `👋 Hola *${finalizedSale.customer.name}*, gracias por tu compra en HomeMart!%0A%0A🧾 *Orden:* ${finalizedSale.saleId}%0A📅 *Fecha:* ${new Date().toLocaleDateString()}%0A%0A📦 *Detalle:*%0A${itemsList}%0A%0A🚚 *Envío:* C$ ${envioCobrado}%0A💰 *TOTAL PAGADO: C$ ${totalCobrado}*`;
    
    const url = phone.length > 7 
      ? `https://wa.me/505${phone}?text=${message}` 
      : `https://wa.me/?text=${message}`;
      
    window.open(url, '_blank');
  };

  const generatePDF = () => {
    if (!finalizedSale) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('HomeMart ERP', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Orden: ${finalizedSale.saleId}`, 105, 22, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 105, 27, { align: 'center' });

    // Cliente
    doc.text(`Cliente: ${finalizedSale.customer.name}`, 14, 40);
    if(finalizedSale.customer.phone) doc.text(`Tel: ${finalizedSale.customer.phone}`, 14, 45);
    if(finalizedSale.customer.isDelivery) doc.text(`Dirección: ${finalizedSale.customer.address}`, 14, 50);

    // Tabla
    const tableData = finalizedSale.cart.map((item: any) => [
      item.quantity,
      item.name,
      `C$ ${item.price.toFixed(2)}`,
      `C$ ${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Cant', 'Producto', 'P. Unit', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 66, 66] }
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal: C$ ${finalizedSale.totals.subtotal.toFixed(2)}`, 190, finalY, { align: 'right' });
    if(finalizedSale.totals.deliveryFee > 0) {
        doc.text(`Envío: C$ ${finalizedSale.totals.deliveryFee.toFixed(2)}`, 190, finalY + 6, { align: 'right' });
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text(`TOTAL: C$ ${finalizedSale.totals.total.toFixed(2)}`, 190, finalY + 14, { align: 'right' });

    doc.save(`Factura_${finalizedSale.saleId}.pdf`);
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl relative">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">✅</div>
          <h2 className="text-xl font-black text-gray-800">¡Venta Exitosa!</h2>
          <p className="text-gray-500 text-sm font-mono mb-6">{finalizedSale?.saleId}</p>

          <div className="grid gap-3">
            <button onClick={generatePDF} className="w-full bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95">
              📄 Descargar Factura PDF
            </button>
            <button onClick={sendWhatsApp} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95">
              📱 Enviar WhatsApp
            </button>
            <button onClick={onSuccess} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl active:scale-95">
              🔄 Nueva Venta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FORMULARIO DE DETALLES ---
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sm:rounded-t-3xl">
          <h2 className="font-bold text-gray-800">Finalizar Venta</h2>
          <button onClick={onClose} className="w-8 h-8 bg-white rounded-full text-gray-500 font-bold shadow-sm">✕</button>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setIsDelivery(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${!isDelivery ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>🏪 En Tienda</button>
                <button onClick={() => setIsDelivery(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${isDelivery ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>🛵 Delivery</button>
            </div>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Nombre" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                    <input type="tel" placeholder="WhatsApp" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                </div>
                {isDelivery && (
                    <div className="space-y-3">
                        <textarea placeholder="Dirección..." rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none" />
                        <div className="flex items-center gap-2">
                           <label className="text-xs font-bold text-gray-500">Envío: C$</label>
                           <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-24 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-center" />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2 mb-4">
                   {['cash', 'card', 'transfer'].map(m => (
                     <button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 px-1 text-[10px] font-bold uppercase rounded-lg border ${paymentMethod === m ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}>{m === 'cash' ? '💵 Efec.' : m === 'card' ? '💳 Tarjeta' : '🏦 Transf.'}</button>
                   ))}
                </div>
                {paymentMethod !== 'cash' && (
                    <div className="bg-blue-50 p-3 rounded-xl space-y-3 border border-blue-100">
                        <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full p-2 rounded-lg border border-blue-200 text-sm bg-white">
                            <option value="">Banco...</option>
                            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <input type="text" placeholder="Referencia" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full p-2 rounded-lg border border-blue-200 text-sm" />
                    </div>
                )}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                   <div><p className="text-xs text-gray-500 mb-1">Total a Pagar</p><p className="text-2xl font-black text-gray-900">C$ {liveFinalTotal.toFixed(2)}</p></div>
                   {paymentMethod === 'cash' && (
                     <div className="text-right"><p className="text-xs text-gray-500 mb-1">Recibido</p><input type="number" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className="w-24 p-1 bg-white border border-gray-300 rounded text-right font-bold text-lg" /></div>
                   )}
                </div>
            </div>
        </div>
        <div className="p-4 border-t border-gray-100 bg-white sm:rounded-b-3xl">
          <button onClick={handleProcessSale} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50">
            {loading ? 'Procesando...' : `Confirmar C$ ${liveFinalTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
