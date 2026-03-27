import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { formatINR, formatDate } from '@/lib/format';
import {
  convertBackupToAppFormat,
  convertAppFormatToExport,
  parseBackupFile,
  downloadBackupFile,
} from '@/lib/invoice-import-export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Download,
  Trash2,
  FileText,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Upload,
  Settings,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DashboardAnalytics } from '@/components/invoice/DashboardAnalytics';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import { InvoiceData } from '@/types/invoice';

interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  status: string;
  payment_status: string;
  paid_amount: number;
  total_amount: number;
  bill_to_name: string;
  from_name: string;
  lineItems: any[];
  enable_gst?: boolean;
  gst_rate?: number;
  notes?: string;
  due_date?: string;
  from_address?: string;
  from_email?: string;
  bill_to_address?: string;
  bill_to_email?: string;
  is_igst?: boolean;
}

const statusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  unpaid: 'bg-amber-100 text-amber-700 border-amber-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
};

const paymentStatusColors: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  partial: 'bg-blue-100 text-blue-700 border-blue-200',
  unpaid: 'bg-amber-100 text-amber-700 border-amber-200',
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [importing, setImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);

  const hiddenPreviewRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const mapToInvoiceData = (invoice: Invoice): InvoiceData => {
    return {
      id: String(invoice.id),
      invoiceNumber: invoice.invoice_number,
      date: invoice.date,
      dueDate: invoice.due_date || invoice.date,
      status: invoice.status as any,
      fromName: invoice.from_name,
      fromAddress: invoice.from_address || '',
      fromEmail: invoice.from_email || '',
      billToName: invoice.bill_to_name,
      billToAddress: invoice.bill_to_address || '',
      billToEmail: invoice.bill_to_email || '',
      lineItems: invoice.lineItems || [],
      enableGST: invoice.enable_gst || false,
      gstRate: invoice.gst_rate || 0,
      isIGST: invoice.is_igst || false,
      notes: invoice.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleDownloadPDF = async (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingPdf(String(invoice.id));
    toast.loading('Generating PDF...');
    
    setTimeout(async () => {
      try {
        if (!hiddenPreviewRef.current) throw new Error('Preview not ready');
        const canvas = await html2canvas(hiddenPreviewRef.current, {
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
      } catch (err) {
        toast.dismiss();
        toast.error('Failed to generate PDF');
      } finally {
        setDownloadingPdf(null);
      }
    }, 100);
  };

  const handleMarkPaid = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.updateInvoice(id, { payment_status: 'paid', status: 'paid' });
      setInvoices(invoices.map(inv => String(inv.id) === id ? { ...inv, payment_status: 'paid', status: 'paid' } : inv));
      toast.success('Marked as paid');
    } catch {
      toast.error('Failed to mark as paid');
    }
  };

  // Load invoices on mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getInvoices(user?.id);
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    // Search filter
    const matchesSearch =
      (inv.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.bill_to_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.from_name || '').toLowerCase().includes(search.toLowerCase());

    // Status filter
    if (statusFilter === 'all') return matchesSearch;
    const paymentStatus = inv.payment_status || 'pending';
    if (statusFilter === 'unpaid') return matchesSearch && paymentStatus !== 'paid';
    return matchesSearch && paymentStatus === statusFilter;
  }).sort((a, b) => {
    const aPaid = a.payment_status === 'paid' ? 1 : 0;
    const bPaid = b.payment_status === 'paid' ? 1 : 0;
    if (aPaid !== bPaid) return aPaid - bPaid; // Unpaid (0) comes before Paid (1)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const stats = {
    total: filtered.length,
    paid: filtered.reduce((acc, inv) => {
      if (inv.payment_status === 'paid') {
        return acc + (inv.total_amount || 0);
      }
      return acc;
    }, 0),
    unpaid: filtered.reduce((acc, inv) => {
      if (inv.payment_status !== 'paid') {
        return acc + (inv.total_amount || 0);
      }
      return acc;
    }, 0),
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const backupInvoices = parseBackupFile(fileContent);

      // Show preview dialog
      setImportPreview(backupInvoices);
      setShowImportDialog(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Invalid backup file format'
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) return;

    setImporting(true);
    const successCount = { count: 0 };
    const failedCount = { count: 0 };

    try {
      for (const backupInvoice of importPreview) {
        try {
          // Convert to app format
          const appInvoice = convertBackupToAppFormat(backupInvoice);

          // Save to database
          await apiClient.createInvoice(appInvoice, user?.id);
          successCount.count++;
        } catch (error) {
          console.error('Failed to import invoice:', backupInvoice.number, error);
          failedCount.count++;
        }
      }

      // Reload invoices
      await loadInvoices();
      setShowImportDialog(false);
      setImportPreview([]);

      if (failedCount.count === 0) {
        toast.success(`Successfully imported ${successCount.count} invoices!`);
      } else {
        toast.warning(
          `Imported ${successCount.count} invoices. Failed: ${failedCount.count}`
        );
      }
    } catch (error) {
      toast.error('Failed to import invoices');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleExportAll = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }

    const exportData = convertAppFormatToExport(invoices);
    const filename = `invoice-backup-${new Date().toISOString().split('T')[0]}.json`;
    downloadBackupFile(exportData, filename);
    toast.success('Invoices exported successfully');
  };

  const handleExportFiltered = () => {
    if (filtered.length === 0) {
      toast.error('No invoices to export');
      return;
    }

    const exportData = convertAppFormatToExport(filtered);
    const filename = `invoice-backup-filtered-${new Date().toISOString().split('T')[0]}.json`;
    downloadBackupFile(exportData, filename);
    toast.success(`Exported ${filtered.length} invoices`);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteInvoice(id);
      setInvoices((prev) => prev.filter((inv) => String(inv.id) !== id));
      toast.success('Invoice deleted');
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const getTotal = (inv: Invoice) => {
    return inv.total_amount || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="text-sm text-gray-600 mt-1">
                {loading ? 'Loading...' : `${filtered.length} of ${invoices.length} invoices`}
              </p>
            </div>
            <Button onClick={() => navigate('/create')} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> New Invoice
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by invoice #, client, or sender..."
                className="pl-9 border-gray-300 focus:border-blue-500 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={loadInvoices} className="border-gray-300 hover:bg-gray-100 flex-1 sm:flex-none">
                ↻ Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-blue-300 hover:bg-blue-50 text-blue-600 flex-1 sm:flex-none"
              >
                <Upload className="h-4 w-4 mr-1" /> Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAll}
                disabled={invoices.length === 0}
                className="border-gray-300 hover:bg-gray-100 flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-1" /> Export All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFiltered}
                disabled={filtered.length === 0}
                className="border-gray-300 hover:bg-gray-100 flex-1 sm:flex-none"
              >
                <Settings className="h-4 w-4 mr-1" /> Export View
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && invoices.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Total Invoices</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Amount Paid</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{formatINR(stats.paid)}</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Pending Payment</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{formatINR(stats.unpaid)}</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      {!loading && invoices.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Payment Status:</span>
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-300 hover:bg-gray-100'}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'paid' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('paid')}
              className={statusFilter === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-gray-300 hover:bg-gray-100'}
            >
              Paid
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'unpaid' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('unpaid')}
              className={statusFilter === 'unpaid' ? 'bg-amber-600 hover:bg-amber-700' : 'border-gray-300 hover:bg-gray-100'}
            >
              Unpaid
            </Button>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {!loading && invoices.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pt-6 -mb-4">
          <DashboardAnalytics invoices={filtered} />
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No invoices yet</h3>
            <p className="text-sm text-gray-500 mt-1">Create your first invoice to get started</p>
            <Button onClick={() => navigate('/create')} className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Create Invoice
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((invoice) => {
              const total = getTotal(invoice);
              const paymentStatus = invoice.payment_status || 'pending';

              return (
                <Card
                  key={invoice.id}
                  className="group relative overflow-hidden bg-white border border-gray-100 rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/edit/${String(invoice.id)}`)}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  
                  <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 pl-7">
                    
                    {/* Left: Identity & Basic Info */}
                    <div className="flex items-start md:items-center gap-4 flex-1 w-full">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg tracking-tight truncate max-w-full">{invoice.invoice_number}</h3>
                          <Badge variant="outline" className={`font-medium shadow-sm ${paymentStatusColors[paymentStatus]}`}>
                            {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                          </Badge>
                          {invoice.status && invoice.status !== paymentStatus && invoice.status !== 'unpaid' && (
                            <Badge variant="outline" className={`font-medium shadow-sm ${statusColors[invoice.status] || 'bg-gray-100'}`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          Client: <span className="text-gray-900">{invoice.bill_to_name}</span>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Amount & Dates */}
                    <div className="flex-1 flex flex-col items-start md:items-center min-w-[200px] w-full mt-2 md:mt-0">
                      <div className="text-left md:text-center">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="text-2xl font-bold tracking-tight text-gray-900">{formatINR(total)}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Date: {formatDate(invoice.date)}</p>
                      </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end border-t border-gray-100 md:border-none pt-4 md:pt-0">
                      <div className="flex items-center gap-2">
                        {paymentStatus !== 'paid' && (
                          <Button
                            size="sm"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-none font-medium px-3"
                            onClick={(e) => handleMarkPaid(String(invoice.id), e)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-none font-medium px-3"
                          onClick={(e) => handleDownloadPDF(invoice, e)}
                          disabled={downloadingPdf === String(invoice.id)}
                        >
                          {downloadingPdf === String(invoice.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <><Download className="h-4 w-4 mr-1.5" /> PDF</>
                          )}
                        </Button>
                      </div>

                      <div className="w-px h-8 bg-gray-200 hidden sm:block mx-1"></div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all font-medium px-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit/${String(invoice.id)}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1.5" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(String(invoice.id));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Invoices Preview</DialogTitle>
            <DialogDescription>
              {importPreview.length} invoice(s) will be imported and added to your database. Review the list
              below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {importPreview.map((invoice, idx) => (
              <Card key={idx} className="p-4 border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{invoice.number}</p>
                    <p className="text-sm text-gray-600">
                      From: <span className="font-medium">{invoice.from.name}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      To: <span className="font-medium">{invoice.to.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Items: {invoice.items.length} | Status: {invoice.status}
                    </p>
                  </div>
                  <Badge
                    className={
                      invoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              disabled={importing}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={importing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" /> Import {importPreview.length} Invoice
                  {importPreview.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Invoice Preview for PDF Generation */}
      {downloadingPdf && (
        <div className="fixed top-[-9999px] left-[-9999px] z-[-1]">
          <InvoicePreview 
            invoice={mapToInvoiceData(invoices.find(i => String(i.id) === downloadingPdf)!)} 
            previewRef={hiddenPreviewRef} 
          />
        </div>
      )}
    </div>
  );
};

export default Index;
