// Neon Data API configuration
const NEON_DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL;

/** How long to cache a JWT before re-fetching (55 min; tokens last ~60 min). */
const TOKEN_CACHE_MS = 55 * 60 * 1000;

/**
 * The shape the frontend expects for an invoice (flat format).
 * The database stores this across invoices, clients, users, and line_items tables.
 *
 * NOTE: The frontend uses from_name / from_email / from_address for the UI,
 * but the DB columns are sender_name / sender_email / sender_address / sender_phone
 * to avoid PostgREST issues with the "from_" prefix.
 */
export interface FlatInvoice {
  id: number;
  invoice_number: string;
  date: string;        // issue_date from DB
  due_date: string;
  status: string;      // mapped from payment_status
  payment_status: string;
  total_amount: number;
  notes: string;
  currency: string;

  // From user (sender) — frontend keys
  from_name: string;
  from_address: string;
  from_email: string;

  // Bill-to client
  bill_to_name: string;
  bill_to_address: string;
  bill_to_email: string;

  // Line items (fetched from line_items table)
  lineItems: Array<{
    id: string;
    description: string;
    rate: number;
    quantity: number;
  }>;

  // GST (not stored in DB yet — default to false)
  enable_gst: boolean;
  gst_rate: number;
  is_igst: boolean;

  // For compatibility
  paid_amount: number;
}

class NeonAPIClient {
  private cachedToken: string | null = null;
  private tokenFetchedAt: number = 0;

  // ── Auth ──────────────────────────────────────────────────────

  private async getAuthToken(): Promise<string | null> {
    if (this.cachedToken && Date.now() - this.tokenFetchedAt < TOKEN_CACHE_MS) {
      return this.cachedToken;
    }

    const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
    if (!authUrl) return null;

    try {
      const response = await fetch(`${authUrl}/token`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.token) {
          this.cachedToken = data.token;
          this.tokenFetchedAt = Date.now();
          console.log('Fetched fresh JWT from /token endpoint');
          return this.cachedToken;
        }
      }

      this.cachedToken = null;
      this.tokenFetchedAt = 0;
    } catch {
      this.cachedToken = null;
      this.tokenFetchedAt = 0;
    }
    return null;
  }

  setAuthToken(_token?: string) {
    this.cachedToken = null;
    this.tokenFetchedAt = 0;
  }

  clearAuthToken() {
    this.cachedToken = null;
    this.tokenFetchedAt = 0;
  }

  // ── Low-level request ─────────────────────────────────────────

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T = any>(
    method: string,
    table: string,
    filters?: Record<string, string>,
    body?: any,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    let url = `${NEON_DATA_API_URL}/${table}`;

    if (filters && (method === 'GET' || method === 'DELETE' || method === 'PATCH')) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const headers = await this.getHeaders();
    if (extraHeaders) {
      Object.assign(headers, extraHeaders);
    }

    const options: RequestInit = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Neon API error: ${response.status}`);
      }

      if (method === 'DELETE' || response.status === 204) {
        return {} as T;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);
    } catch (error) {
      console.error(`API Error (${method} ${table}):`, error);
      throw error;
    }
  }

  // ── Helper: build address string from client row ──────────────

  private buildAddress(row: any): string {
    const parts = [row.address, row.city, row.state, row.zip, row.country].filter(Boolean);
    return parts.join(', ');
  }

  // ── Helper: map DB row(s) into FlatInvoice ────────────────────
  // DB columns: sender_name, sender_email, sender_address, sender_phone
  // Frontend keys: from_name, from_email, from_address

  private mapToFlatInvoice(
    inv: any,
    client: any,
    lineItems: any[],
  ): FlatInvoice {
    return {
      id: inv.id,
      invoice_number: inv.invoice_number,
      date: inv.issue_date,
      due_date: inv.due_date,
      status: inv.payment_status === 'paid' ? 'paid' : 'unpaid',
      payment_status: inv.payment_status || 'pending',
      total_amount: parseFloat(inv.total_amount) || 0,
      notes: inv.notes || '',
      currency: inv.currency || 'INR',

      // Map DB sender_* → frontend from_*
      from_name: inv.sender_name || '',
      from_address: inv.sender_address || '',
      from_email: inv.sender_email || '',

      // Client info from clients table
      bill_to_name: client?.name || '',
      bill_to_address: client ? this.buildAddress(client) : '',
      bill_to_email: client?.email || '',

      lineItems: (lineItems || []).map((li) => ({
        id: String(li.id),
        description: li.description,
        rate: parseFloat(li.unit_price) || 0,
        quantity: parseFloat(li.quantity) || 1,
      })),

      enable_gst: false,
      gst_rate: 0,
      is_igst: false,

      paid_amount: inv.payment_status === 'paid' ? (parseFloat(inv.total_amount) || 0) : 0,
    };
  }

  // ── Invoices (high-level) ─────────────────────────────────────

  /**
   * Get all invoices, enriched with client info and line items.
   * Sender info (sender_name, etc.) is stored directly on the invoice row.
   */
  async getInvoices(userId?: string): Promise<FlatInvoice[]> {
    // 1. Fetch invoices
    const invoiceFilters = userId ? { user_id: `eq.${userId}` } : undefined;
    const invoices = await this.request<any[]>('GET', 'invoices', invoiceFilters);

    if (!invoices || invoices.length === 0) return [];

    // 2. Collect unique client_ids and invoice_ids
    const clientIds = [...new Set(invoices.map((i) => i.client_id))];
    const invoiceIds = invoices.map((i) => i.id);

    // 3. Batch-fetch clients and line_items
    const [clients, lineItems] = await Promise.all([
      this.request<any[]>('GET', 'clients', { id: `in.(${clientIds.join(',')})` }),
      this.request<any[]>('GET', 'line_items', { invoice_id: `in.(${invoiceIds.join(',')})` }),
    ]);

    // 4. Build lookup maps
    const clientMap = new Map((clients || []).map((c) => [c.id, c]));
    const lineItemsByInvoice = new Map<number, any[]>();
    for (const li of lineItems || []) {
      const existing = lineItemsByInvoice.get(li.invoice_id) || [];
      existing.push(li);
      lineItemsByInvoice.set(li.invoice_id, existing);
    }

    // 5. Map to flat format
    return invoices.map((inv) =>
      this.mapToFlatInvoice(
        inv,
        clientMap.get(inv.client_id),
        lineItemsByInvoice.get(inv.id) || [],
      ),
    );
  }

  /**
   * Get a single invoice by ID, enriched with client and line item data.
   */
  async getInvoice(id: string): Promise<FlatInvoice> {
    const invoices = await this.request<any[]>('GET', 'invoices', { id: `eq.${id}` });
    if (!invoices || invoices.length === 0) {
      throw new Error('Invoice not found');
    }
    const inv = invoices[0];

    const [clients, lineItems] = await Promise.all([
      this.request<any[]>('GET', 'clients', { id: `eq.${inv.client_id}` }),
      this.request<any[]>('GET', 'line_items', { invoice_id: `eq.${inv.id}` }),
    ]);

    return this.mapToFlatInvoice(
      inv,
      clients?.[0],
      lineItems || [],
    );
  }

  /**
   * Create an invoice from the flat format.
   * Maps frontend from_* keys → DB sender_* columns.
   */
  async createInvoice(flat: any, userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('User must be logged in to create invoices');
    }

    // 1. Find or create client
    let clientId: number;
    const existingClients = await this.request<any[]>('GET', 'clients', {
      user_id: `eq.${userId}`,
      name: `eq.${flat.bill_to_name}`,
    });

    if (existingClients && existingClients.length > 0) {
      clientId = existingClients[0].id;
    } else {
      // Parse address into components
      const addressParts = (flat.bill_to_address || '').split(', ');
      const newClients = await this.request<any[]>(
        'POST',
        'clients',
        undefined,
        {
          user_id: userId,
          name: flat.bill_to_name || 'Unknown',
          email: flat.bill_to_email || '',
          address: addressParts[0] || '',
          city: addressParts[1] || '',
          zip: addressParts[2] || '',
        },
        { Prefer: 'return=representation' },
      );
      clientId = newClients[0].id;
    }

    // 2. Calculate total from line items
    const items = flat.lineItems || flat.line_items || [];
    const total = items.reduce(
      (sum: number, item: any) => sum + (item.rate || item.unit_price || 0) * (item.quantity || item.qty || 1),
      0,
    );

    // 3. Insert invoice — map from_* → sender_*
    const newInvoices = await this.request<any[]>(
      'POST',
      'invoices',
      undefined,
      {
        user_id: userId,
        client_id: clientId,
        invoice_number: flat.invoice_number || '',
        issue_date: flat.date,
        due_date: flat.due_date || flat.date,
        notes: flat.notes || '',
        payment_status: flat.payment_status || (flat.status === 'paid' ? 'paid' : 'pending'),
        total_amount: total,
        currency: 'INR',
        sender_name: flat.from_name || '',
        sender_email: flat.from_email || '',
        sender_address: flat.from_address || '',
      },
      { Prefer: 'return=representation' },
    );

    const invoiceId = newInvoices[0].id;

    // 4. Insert line items
    if (items.length > 0) {
      const lineItemRows = items.map((item: any) => ({
        invoice_id: invoiceId,
        description: item.description || '',
        quantity: item.quantity || item.qty || 1,
        unit_price: item.rate || item.unit_price || 0,
        amount: (item.rate || item.unit_price || 0) * (item.quantity || item.qty || 1),
      }));

      await this.request('POST', 'line_items', undefined, lineItemRows);
    }

    // 5. If paid, add a payment record
    if (flat.payment_status === 'paid' || flat.status === 'paid') {
      await this.request('POST', 'payments', undefined, {
        invoice_id: invoiceId,
        amount: total,
        payment_date: flat.date,
        payment_method: 'bank_transfer',
        notes: 'Full payment',
      });
    }
  }

  /**
   * Update an invoice (and its line items).
   * Maps frontend from_* keys → DB sender_* columns.
   */
  async updateInvoice(id: string, flat: any): Promise<void> {
    // 1. Get existing invoice to know user_id and client_id
    const existingInvoices = await this.request<any[]>('GET', 'invoices', { id: `eq.${id}` });
    if (!existingInvoices || existingInvoices.length === 0) {
      throw new Error('Invoice not found');
    }

    // 2. Calculate total
    const items = flat.lineItems || flat.line_items || [];
    const total = items.reduce(
      (sum: number, item: any) => sum + (item.rate || item.unit_price || 0) * (item.quantity || item.qty || 1),
      0,
    );

    // 3. Update invoice record — map from_* → sender_*
    await this.request('PATCH', 'invoices', { id: `eq.${id}` }, {
      invoice_number: flat.invoice_number || '',
      issue_date: flat.date,
      due_date: flat.due_date || flat.date,
      notes: flat.notes || '',
      payment_status: flat.payment_status || (flat.status === 'paid' ? 'paid' : 'pending'),
      total_amount: total,
      sender_name: flat.from_name || '',
      sender_email: flat.from_email || '',
      sender_address: flat.from_address || '',
    });

    // 4. Delete old line items and re-insert
    await this.request('DELETE', 'line_items', { invoice_id: `eq.${id}` });

    if (items.length > 0) {
      const lineItemRows = items.map((item: any) => ({
        invoice_id: parseInt(id),
        description: item.description || '',
        quantity: item.quantity || item.qty || 1,
        unit_price: item.rate || item.unit_price || 0,
        amount: (item.rate || item.unit_price || 0) * (item.quantity || item.qty || 1),
      }));

      await this.request('POST', 'line_items', undefined, lineItemRows);
    }
  }

  async deleteInvoice(id: string) {
    // line_items and payments cascade-delete via FK
    return this.request('DELETE', 'invoices', { id: `eq.${id}` });
  }

  // ── Payments ──────────────────────────────────────────────────

  async getPayments(userId?: string) {
    const filters = userId ? { user_id: `eq.${userId}` } : undefined;
    return this.request<any[]>('GET', 'payments', filters);
  }

  async getInvoicePayments(invoiceId: string) {
    return this.request<any[]>('GET', 'payments', { invoice_id: `eq.${invoiceId}` });
  }

  async createPayment(payment: any) {
    return this.request('POST', 'payments', undefined, payment);
  }

  async deletePayment(id: string) {
    return this.request('DELETE', 'payments', { id: `eq.${id}` });
  }

  // ── Clients ───────────────────────────────────────────────────

  async getClients(userId?: string) {
    const filters = userId ? { user_id: `eq.${userId}` } : undefined;
    return this.request<any[]>('GET', 'clients', filters);
  }

  async createClient(client: any) {
    return this.request('POST', 'clients', undefined, client);
  }

  async updateClient(id: string, client: any) {
    return this.request('PATCH', 'clients', { id: `eq.${id}` }, client);
  }

  async deleteClient(id: string) {
    return this.request('DELETE', 'clients', { id: `eq.${id}` });
  }

  // ── Auth Users (Better Auth's "user" table) ───────────────────

  async getAuthUser(id: string) {
    return this.request<any[]>('GET', 'user', { id: `eq.${id}` });
  }
}

export const apiClient = new NeonAPIClient();
