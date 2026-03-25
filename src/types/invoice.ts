export interface LineItem {
  id: string;
  description: string;
  rate: number;
  quantity: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';

  // Sender
  fromName: string;
  fromAddress: string;
  fromEmail: string;

  // Client
  billToName: string;
  billToAddress: string;
  billToEmail: string;

  // Items
  lineItems: LineItem[];

  // Tax
  enableGST: boolean;
  gstRate: number;
  isIGST: boolean; // true = IGST, false = CGST+SGST split

  // Notes / Bank details
  notes: string;

  createdAt: string;
  updatedAt: string;
}

export const createEmptyLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: '',
  rate: 0,
  quantity: 1,
});

export const calculateSubtotal = (items: LineItem[]): number =>
  items.reduce((sum, item) => sum + item.rate * item.quantity, 0);

export const calculateTax = (subtotal: number, gstRate: number): number =>
  (subtotal * gstRate) / 100;
