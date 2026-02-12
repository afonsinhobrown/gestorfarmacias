import React from 'react';
import QRCode from 'react-qr-code';

interface ReceiptItem {
    produto?: string; // Backend envia produto
    name?: string;    // Fallback
    qty: number | string;
    total: number | string;
    is_isento?: boolean;
    taxa_iva?: number;
}

interface ReceiptProps {
    pharmacyName: string;
    pharmacyAddress: string;
    nuit: string;
    date: string;
    orderId: string;
    items: ReceiptItem[];
    subtotal?: number | string;
    tax?: number | string;
    total: number | string;
    qrCodeData: string;
    sellerName?: string;
    paymentMethod?: string;
    paidAmount?: number | string;
    change?: number | string;
}

const safeNumber = (val: number | string | undefined): number => {
    if (val === undefined || val === null) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
};

const formatMoney = (val: number | string | undefined) => {
    return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(safeNumber(val));
};

export const Receipt: React.FC<ReceiptProps> = ({
    pharmacyName,
    pharmacyAddress,
    nuit,
    date,
    orderId,
    items = [],
    total,
    qrCodeData,
    sellerName,
    paymentMethod,
    paidAmount,
    change
}) => {
    // Cálculos de IVA Item a Item
    let totalExempt = 0;
    let totalTaxed = 0;
    let totalIVA = 0;

    items.forEach(item => {
        const itemTotal = safeNumber(item.total);
        if (item.is_isento) {
            totalExempt += itemTotal;
        } else {
            const rate = (item.taxa_iva || 16) / 100;
            const base = itemTotal / (1 + rate);
            const iva = itemTotal - base;
            totalTaxed += base;
            totalIVA += iva;
        }
    });

    const totalVal = safeNumber(total);
    const subtotalVal = totalExempt + totalTaxed;

    // Formatar data
    let displayDate = new Date().toLocaleDateString('pt-MZ');
    try {
        if (date) displayDate = new Date(date).toLocaleDateString('pt-MZ');
    } catch (e) { }

    return (
        <div className="bg-white p-6 max-w-[320px] w-full mx-auto shadow-2xl relative text-gray-900 font-mono text-xs leading-relaxed print:shadow-none border border-gray-100">

            <div className="text-center mb-6">
                <h2 className="font-black text-xl uppercase mb-1">{pharmacyName || 'FARMÁCIA'}</h2>
                <p className="text-[10px] text-gray-500">{pharmacyAddress || 'Endereço não informado'}</p>
                <p className="text-[10px] text-gray-500">NUIT: {nuit || 'Consumidor Final'}</p>
            </div>

            <div className="border-b border-dashed border-gray-300 my-3"></div>

            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                <span>DATA: {displayDate}</span>
                <span>HORA: {new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-2">
                <span>DOC: #{orderId}</span>
                <span className="uppercase">OP: {sellerName || 'SISTEMA'}</span>
            </div>

            <div className="mb-4">
                <div className="flex justify-between font-black border-b border-gray-800 pb-1 mb-2">
                    <span className="w-1/2">ITEM</span>
                    <span className="w-1/6 text-center">QTD</span>
                    <span className="w-1/3 text-right">TOTAL</span>
                </div>
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-1">
                        <div className="w-1/2 flex flex-col">
                            <span className="truncate pr-1 lowercase first-letter:uppercase">
                                {item.produto || item.name || 'Produto'}
                            </span>
                            {item.is_isento && <span className="text-[7px] font-black text-gray-400">ISENTO</span>}
                        </div>
                        <span className="w-1/6 text-center">{item.qty}</span>
                        <span className="w-1/3 text-right">
                            {new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 2 }).format(safeNumber(item.total))}
                        </span>
                    </div>
                ))}
            </div>

            <div className="border-b border-dashed border-gray-300 my-3"></div>

            <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-600">
                    <span>MERCADORIA ISENTA</span>
                    <span>{formatMoney(totalExempt)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>SUBTOTAL TRIBUTÁVEL</span>
                    <span>{formatMoney(totalTaxed)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>IVA TOTAL</span>
                    <span>{formatMoney(totalIVA)}</span>
                </div>
                <div className="flex justify-between font-black text-xl mt-3 pt-3 border-t-2 border-gray-900">
                    <span>TOTAL</span>
                    <span>{formatMoney(totalVal)}</span>
                </div>

                <div className="mt-4 pt-2 border-t border-dotted border-gray-400 space-y-1 text-[9px] font-bold text-gray-500 uppercase">
                    <div className="flex justify-between">
                        <span>PAGAMENTO:</span>
                        <span>{paymentMethod || 'DINHEIRO'}</span>
                    </div>
                    {safeNumber(paidAmount) > 0 && (
                        <>
                            <div className="flex justify-between">
                                <span>VALOR ENTREGUE:</span>
                                <span>{formatMoney(paidAmount)}</span>
                            </div>
                            <div className="flex justify-between text-gray-900 border-t border-gray-200 mt-1 pt-1 font-black">
                                <span>TROCO:</span>
                                <span>{formatMoney(change)}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-2">
                <QRCode value={qrCodeData || 'S/N'} size={80} />
                <p className="mt-2 text-[9px] text-center font-bold uppercase text-gray-400">Obrigado pela preferência!</p>
                <div className="text-[8px] text-center text-gray-300">Processado por GestorFarma</div>
            </div>
        </div>
    );
};
