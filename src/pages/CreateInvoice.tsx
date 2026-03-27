import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { InvoiceData, createEmptyLineItem, calculateSubtotal, calculateTax } from '@/types/invoice';
import { formatINR } from '@/lib/format';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LineItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
}

interface InvoiceFormData {
  invoice_number: string;
  date: string;
  due_date: string;
  status: string;
  from_name: string;
  from_address: string;
  from_email: string;
  bill_to_name: string;
  bill_to_address: string;
  bill_to_email: string;
  enable_gst: boolean;
  gst_rate: number;
  is_igst: boolean;
  notes: string;
  lineItems: LineItem[];
}

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);

  const getInitialData = (): InvoiceFormData => {
    return {
      invoice_number: '',
      date: new Date().toISOString().split('T')[0],
      due_date: 'On Receipt',
      status: 'unpaid',
      from_name: user?.name || '',
      from_address: user?.company_address || '',
      from_email: user?.company_email || '',
      bill_to_name: '',
      bill_to_address: '',
      bill_to_email: '',
      lineItems: [createEmptyLineItem()],
      enable_gst: false,
      gst_rate: 18,
      is_igst: false,
      notes: '',
    };
  };

  const [invoice, setInvoice] = useState<InvoiceFormData>(getInitialData());

  // Load invoice if editing
  useEffect(() => {
    if (id) {
      loadInvoice();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      const data = await apiClient.getInvoice(id!);
      setInvoice({
        invoice_number: data.invoice_number,
        date: data.date,
        due_date: data.due_date,
        status: data.status,
        from_name: data.from_name,
        from_address: data.from_address,
        from_email: data.from_email,
        bill_to_name: data.bill_to_name,
        bill_to_address: data.bill_to_address,
        bill_to_email: data.bill_to_email,
        lineItems: data.lineItems || [],
        enable_gst: data.enable_gst || false,
        gst_rate: data.gst_rate || 18,
        is_igst: data.is_igst || false,
        notes: data.notes || '',
      });
    } catch (error) {
      toast.error('Failed to load invoice');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const update = (fields: Partial<InvoiceFormData>) => setInvoice((prev) => ({ ...prev, ...fields }));

  const updateLineItem = (itemId: string, fields: Partial<LineItem>) => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => (item.id === itemId ? { ...item, ...fields } : item)),
    }));
  };

  const addLineItem = () => update({ lineItems: [...invoice.lineItems, createEmptyLineItem()] });

  const removeLineItem = (itemId: string) => {
    if (invoice.lineItems.length <= 1) return;
    update({ lineItems: invoice.lineItems.filter((i) => i.id !== itemId) });
  };

  const validateForm = (): boolean => {
    if (!invoice.from_name.trim()) {
      toast.error('Please enter your name/company');
      return false;
    }
    if (!invoice.bill_to_name.trim()) {
      toast.error('Please enter client name');
      return false;
    }
    if (invoice.lineItems.length === 0) {
      toast.error('Please add at least one line item');
      return false;
    }
    // Check if any line item is incomplete
    if (invoice.lineItems.some((item) => !item.description || item.rate <= 0 || item.quantity <= 0)) {
      toast.error('Please fill in all line item details');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        invoice_number: invoice.invoice_number,
        date: invoice.date,
        due_date: invoice.due_date,
        status: invoice.status,
        from_name: invoice.from_name,
        from_address: invoice.from_address,
        from_email: invoice.from_email,
        bill_to_name: invoice.bill_to_name,
        bill_to_address: invoice.bill_to_address,
        bill_to_email: invoice.bill_to_email,
        enable_gst: invoice.enable_gst,
        gst_rate: invoice.gst_rate,
        is_igst: invoice.is_igst,
        notes: invoice.notes,
        lineItems: invoice.lineItems,
      };

      if (id) {
        await apiClient.updateInvoice(id, payload);
        toast.success('Invoice updated');
      } else {
        await apiClient.createInvoice(payload, user?.id);
        toast.success('Invoice created');
      }
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoice_number}.pdf`);
      toast.dismiss();
      toast.success('PDF downloaded');
    } catch {
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };

  const subtotal = calculateSubtotal(invoice.lineItems);
  const taxAmount = invoice.enable_gst ? calculateTax(subtotal, invoice.gst_rate) : 0;
  const total = subtotal + taxAmount;

  // Convert form data to InvoiceData type for preview
  const previewData: InvoiceData = {
    id: id || crypto.randomUUID(),
    invoiceNumber: invoice.invoice_number,
    date: invoice.date,
    dueDate: invoice.due_date,
    status: invoice.status as any,
    fromName: invoice.from_name,
    fromAddress: invoice.from_address,
    fromEmail: invoice.from_email,
    billToName: invoice.bill_to_name,
    billToAddress: invoice.bill_to_address,
    billToEmail: invoice.bill_to_email,
    lineItems: invoice.lineItems,
    enableGST: invoice.enable_gst,
    gstRate: invoice.gst_rate,
    isIGST: invoice.is_igst,
    notes: invoice.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" /> Save
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-[1400px] mx-auto">
        {/* Form */}
        <div className="w-full lg:w-[480px] shrink-0 space-y-6">
          {/* Invoice Details */}
          <section className="bg-background rounded-lg border p-5 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Invoice #</Label>
                <Input value={invoice.invoice_number} onChange={(e) => update({ invoice_number: e.target.value })} placeholder="INV0001" />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={invoice.date} onChange={(e) => update({ date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Due / Terms</Label>
                <Input value={invoice.due_date} onChange={(e) => update({ due_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={invoice.status}
                  onChange={(e) => update({ status: e.target.value })}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </section>

          {/* From */}
          <section className="bg-background rounded-lg border p-5 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">From</h2>
            <Input placeholder="Your Name / Company" value={invoice.from_name} onChange={(e) => update({ from_name: e.target.value })} />
            <Textarea placeholder="Address" rows={2} value={invoice.from_address} onChange={(e) => update({ from_address: e.target.value })} />
            <Input placeholder="Email" value={invoice.from_email} onChange={(e) => update({ from_email: e.target.value })} />
          </section>

          {/* Bill To */}
          <section className="bg-background rounded-lg border p-5 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Bill To</h2>
            <Input placeholder="Client Name / Company" value={invoice.bill_to_name} onChange={(e) => update({ bill_to_name: e.target.value })} />
            <Textarea placeholder="Address" rows={2} value={invoice.bill_to_address} onChange={(e) => update({ bill_to_address: e.target.value })} />
            <Input placeholder="Email" value={invoice.bill_to_email} onChange={(e) => update({ bill_to_email: e.target.value })} />
          </section>

          {/* Line Items */}
          <section className="bg-background rounded-lg border p-5 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Line Items</h2>
            {invoice.lineItems.map((item, idx) => (
              <div key={item.id} className="space-y-3 pb-4 border-b border-dashed last:border-0 last:pb-0">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4 sm:w-5 pt-2.5 sm:pt-0">{idx + 1}.</span>
                  <Input
                    placeholder="Description"
                    className="flex-1"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                  />
                  {invoice.lineItems.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => removeLineItem(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 pl-0 sm:pl-7">
                  <div className="flex-1 min-w-[120px]">
                    <Label className="text-xs">Rate (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.rate || ''}
                      onChange={(e) => updateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, { quantity: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="w-full sm:w-28 text-right sm:pt-5 pt-2 flex justify-between sm:block border-t border-gray-100 sm:border-0 mt-2 sm:mt-0 items-center">
                    <span className="text-xs text-muted-foreground sm:hidden font-medium">Amount</span>
                    <span className="text-sm font-medium">{formatINR(item.rate * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLineItem} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </section>

          {/* Tax */}
          <section className="bg-background rounded-lg border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">GST / Tax</h2>
              <Switch checked={invoice.enable_gst} onCheckedChange={(v) => update({ enable_gst: v })} />
            </div>
            {invoice.enable_gst && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">GST Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={invoice.gst_rate}
                    onChange={(e) => update({ gst_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={invoice.is_igst} onCheckedChange={(v) => update({ is_igst: v })} />
                  <Label className="text-xs">{invoice.is_igst ? 'IGST' : 'CGST + SGST'}</Label>
                </div>
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="bg-background rounded-lg border p-5 space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Notes / Bank Details</h2>
            <Textarea
              placeholder="Bank details, payment instructions, etc."
              rows={4}
              value={invoice.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </section>

          {/* Summary */}
          <section className="bg-background rounded-lg border p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              {invoice.enable_gst && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{invoice.is_igst ? `IGST (${invoice.gst_rate}%)` : `GST (${invoice.gst_rate}%)`}</span>
                  <span>{formatINR(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Live Preview */}
        <div className="flex-1 min-w-0">
          <div className="sticky top-16">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Live Preview</h2>
            <div className="overflow-auto rounded-lg border bg-gray-50 p-4">
              <InvoicePreview invoice={previewData} previewRef={previewRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
