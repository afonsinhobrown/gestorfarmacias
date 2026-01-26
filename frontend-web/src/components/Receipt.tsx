import React from 'react';
import QRCode from 'react-qr-code';

interface ReceiptItem {
    produto?: string; // Backend envia produto
    name?: string;    // Fallback
    qty: number | string;
    total: number | string;
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
    qrCodeData
}) => {
    // Cálculos de segurança caso venham nulos do backend
    const totalVal = safeNumber(total);
    const subtotalVal = totalVal / 1.16;
    const taxVal = totalVal - subtotalVal;

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

            <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-2">
                <span>DATA: {displayDate}</span>
                <span>HORA: {new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-600 mb-4">PEDIDO: #{orderId}</p>

            <div className="mb-4">
                <div className="flex justify-between font-black border-b border-gray-800 pb-1 mb-2">
                    <span className="w-1/2">ITEM</span>
                    <span className="w-1/6 text-center">QTD</span>
                    <span className="w-1/3 text-right">TOTAL</span>
                </div>
                {items.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-1">
                        <span className="w-1/2 truncate pr-1 lowercase first-letter:uppercase">
                            {item.produto || item.name || 'Produto'}
                        </span>
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
                    <span>SUBTOTAL</span>
                    <span>{formatMoney(subtotalVal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>IVA (16%)</span>
                    <span>{formatMoney(taxVal)}</span>
                </div>
                <div className="flex justify-between font-black text-xl mt-3 pt-3 border-t-2 border-gray-900">
                    <span>TOTAL</span>
                    <span>{formatMoney(totalVal)}</span>
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
