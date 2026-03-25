/**
 * Invoice Import/Export Utility
 * Handles conversion between backup format and application format
 */

interface BackupInvoiceFormat {
  id: string;
  number: string;
  date: string;
  terms?: string;
  from: {
    name: string;
    email: string;
    address?: {
      street1: string;
      street2?: string;
      city: string;
      state?: string;
      zip: string;
    };
    phone?: string;
    businessNumber?: string;
  };
  to: {
    name: string;
    email: string;
    address?: {
      street1: string;
      street2?: string;
      city: string;
      state?: string;
      zip?: string;
    };
    phone?: string;
  };
  items: Array<{
    id: string;
    description: string;
    rate: number;
    qty: number;
  }>;
  currency?: string;
  tax?: {
    type: string;
    rate: number;
  };
  discount?: {
    type: string;
  };
  status: string;
  year?: number;
  notes?: string;
}

interface ApplicationInvoiceFormat {
  invoice_number: string;
  date: string;
  due_date?: string;
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
  payment_status?: string;
  paid_amount?: number;
  lineItems: Array<{
    id: string;
    description: string;
    rate: number;
    quantity: number;
  }>;
}

/**
 * Convert backup format invoice to application format
 */
export const convertBackupToAppFormat = (
  backupInvoice: BackupInvoiceFormat
): ApplicationInvoiceFormat => {
  // Build addresses
  const fromAddress = backupInvoice.from.address
    ? `${backupInvoice.from.address.street1}${backupInvoice.from.address.street2 ? ', ' + backupInvoice.from.address.street2 : ''}, ${backupInvoice.from.address.city}${backupInvoice.from.address.state ? ', ' + backupInvoice.from.address.state : ''} ${backupInvoice.from.address.zip}`
    : '';

  const billToAddress = backupInvoice.to.address
    ? `${backupInvoice.to.address.street1}${backupInvoice.to.address.street2 ? ', ' + backupInvoice.to.address.street2 : ''}, ${backupInvoice.to.address.city}${backupInvoice.to.address.state ? ', ' + backupInvoice.to.address.state : ''} ${backupInvoice.to.address.zip || ''}`
    : '';

  // Determine payment status from status
  let paymentStatus = 'unpaid';
  if (backupInvoice.status === 'paid') {
    paymentStatus = 'paid';
  } else if (backupInvoice.status === 'partial') {
    paymentStatus = 'partial';
  }

  // Determine GST info
  const gstTax = backupInvoice.tax;
  const enableGst = gstTax && gstTax.type !== 'None' && gstTax.rate > 0;
  const gstRate = gstTax?.rate || 18;

  return {
    invoice_number: backupInvoice.number,
    date: backupInvoice.date,
    due_date: backupInvoice.date, // Use same date if no due date
    status: backupInvoice.status === 'outstanding' ? 'unpaid' : backupInvoice.status,
    from_name: backupInvoice.from.name,
    from_address: fromAddress,
    from_email: backupInvoice.from.email,
    bill_to_name: backupInvoice.to.name,
    bill_to_address: billToAddress,
    bill_to_email: backupInvoice.to.email,
    enable_gst: enableGst,
    gst_rate: gstRate,
    is_igst: true, // Default to IGST
    notes: backupInvoice.notes || '',
    payment_status: paymentStatus,
    paid_amount: paymentStatus === 'paid' ? calculateInvoiceTotal(backupInvoice) : 0,
    lineItems: backupInvoice.items.map((item) => ({
      id: item.id || crypto.randomUUID(),
      description: item.description,
      rate: item.rate,
      quantity: item.qty || 1,
    })),
  };
};

/**
 * Calculate total from backup invoice
 */
const calculateInvoiceTotal = (invoice: BackupInvoiceFormat): number => {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.rate * item.qty, 0);
  const tax = invoice.tax && invoice.tax.type !== 'None' ? (subtotal * invoice.tax.rate) / 100 : 0;
  return subtotal + tax;
};

/**
 * Convert application format to export format
 */
export const convertAppFormatToExport = (invoices: any[]): any => {
  return {
    invoices: invoices.map((inv) => ({
      id: inv.id,
      number: inv.invoice_number || inv.invoiceNumber,
      date: inv.date,
      terms: 'On Receipt',
      from: {
        name: inv.from_name || inv.fromName,
        email: inv.from_email || inv.fromEmail,
        address: {
          street1: inv.from_address?.split(', ')[0] || inv.fromAddress?.split(', ')[0] || '',
          city:
            inv.from_address?.split(', ')[1] || inv.fromAddress?.split(', ')[1] || '',
          zip: inv.from_address?.split(', ')[2] || inv.fromAddress?.split(', ')[2] || '',
        },
      },
      to: {
        name: inv.bill_to_name || inv.billToName,
        email: inv.bill_to_email || inv.billToEmail,
        address: {
          street1: inv.bill_to_address?.split(', ')[0] || inv.billToAddress?.split(', ')[0] || '',
          city:
            inv.bill_to_address?.split(', ')[1] || inv.billToAddress?.split(', ')[1] || '',
          zip: inv.bill_to_address?.split(', ')[2] || inv.billToAddress?.split(', ')[2] || '',
        },
      },
      items: (inv.line_items || inv.lineItems || []).map((item: any) => ({
        id: item.id,
        description: item.description,
        rate: item.rate,
        qty: item.quantity || item.qty || 1,
      })),
      currency: 'INR',
      tax: {
        type: inv.enable_gst || inv.enableGST ? 'GST' : 'None',
        rate: inv.gst_rate || inv.gstRate || 18,
      },
      discount: {
        type: 'None',
      },
      status: inv.payment_status === 'paid' ? 'paid' : 'unpaid',
      year: new Date(inv.date).getFullYear(),
      notes: inv.notes || '',
    })),
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
};

/**
 * Parse and validate backup JSON file
 */
export const parseBackupFile = (fileContent: string): BackupInvoiceFormat[] => {
  try {
    const data = JSON.parse(fileContent);

    // Handle both direct array and wrapped object with invoices property
    const invoices = Array.isArray(data) ? data : data.invoices || [];

    if (!Array.isArray(invoices)) {
      throw new Error('Invalid backup format: invoices must be an array');
    }

    // Validate each invoice has required fields
    invoices.forEach((inv, index) => {
      if (!inv.id || !inv.number || !inv.date || !inv.from || !inv.to || !inv.items) {
        throw new Error(
          `Invalid invoice at index ${index}: missing required fields (id, number, date, from, to, items)`
        );
      }
    });

    return invoices;
  } catch (error) {
    throw new Error(
      `Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Download backup as JSON file
 */
export const downloadBackupFile = (data: any, filename: string = 'invoice-backup.json') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
