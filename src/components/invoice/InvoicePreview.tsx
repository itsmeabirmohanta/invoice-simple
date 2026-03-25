import { InvoiceData, calculateSubtotal, calculateTax } from '@/types/invoice';
import { formatINR, formatDate } from '@/lib/format';
import React from 'react';

interface Props {
  invoice: InvoiceData;
  previewRef?: React.RefObject<HTMLDivElement>;
}

const InvoicePreview = ({ invoice, previewRef }: Props) => {
  const subtotal = calculateSubtotal(invoice.lineItems);
  const taxAmount = invoice.enableGST ? calculateTax(subtotal, invoice.gstRate) : 0;
  const total = subtotal + taxAmount;

  return (
    <div
      ref={previewRef}
      className="bg-white text-gray-900 p-10 max-w-[794px] mx-auto shadow-sm border border-gray-100"
      style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", fontSize: '13px' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{invoice.fromName || 'Your Name'}</h1>
          <div className="text-gray-500 text-sm whitespace-pre-line leading-relaxed">
            {invoice.fromAddress || 'Your Address'}
          </div>
          {invoice.fromEmail && (
            <div className="text-gray-500 text-sm mt-1">{invoice.fromEmail}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-4xl font-light text-gray-300 tracking-wide mb-4">INVOICE</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-end gap-4">
              <span className="text-gray-400 uppercase text-xs tracking-wider">Invoice #</span>
              <span className="font-medium w-28 text-right">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-gray-400 uppercase text-xs tracking-wider">Date</span>
              <span className="w-28 text-right">{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-gray-400 uppercase text-xs tracking-wider">Due</span>
              <span className="w-28 text-right">{invoice.dueDate || 'On Receipt'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To + Balance Due */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-gray-400 uppercase text-xs tracking-wider mb-2">Bill To</div>
          <div className="font-semibold text-gray-900">{invoice.billToName || 'Client Name'}</div>
          <div className="text-gray-500 text-sm whitespace-pre-line leading-relaxed">
            {invoice.billToAddress}
          </div>
          {invoice.billToEmail && (
            <div className="text-gray-500 text-sm mt-1">{invoice.billToEmail}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">Balance Due</div>
          <div className="text-2xl font-bold text-gray-900">{formatINR(total)}</div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 text-gray-400 uppercase text-xs tracking-wider font-medium">Description</th>
            <th className="text-right py-2 text-gray-400 uppercase text-xs tracking-wider font-medium w-24">Rate</th>
            <th className="text-right py-2 text-gray-400 uppercase text-xs tracking-wider font-medium w-16">Qty</th>
            <th className="text-right py-2 text-gray-400 uppercase text-xs tracking-wider font-medium w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3 text-gray-800">{item.description || '—'}</td>
              <td className="py-3 text-right text-gray-700">{formatINR(item.rate)}</td>
              <td className="py-3 text-right text-gray-700">{item.quantity}</td>
              <td className="py-3 text-right text-gray-800 font-medium">{formatINR(item.rate * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-800">{formatINR(subtotal)}</span>
          </div>
          {invoice.enableGST && !invoice.isIGST && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CGST ({invoice.gstRate / 2}%)</span>
                <span className="text-gray-800">{formatINR(taxAmount / 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">SGST ({invoice.gstRate / 2}%)</span>
                <span className="text-gray-800">{formatINR(taxAmount / 2)}</span>
              </div>
            </>
          )}
          {invoice.enableGST && invoice.isIGST && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IGST ({invoice.gstRate}%)</span>
              <span className="text-gray-800">{formatINR(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t-2 border-gray-200 pt-2 mt-2">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="border-t border-gray-100 pt-6">
          <div className="text-gray-400 uppercase text-xs tracking-wider mb-2">Notes / Bank Details</div>
          <div className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">{invoice.notes}</div>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
