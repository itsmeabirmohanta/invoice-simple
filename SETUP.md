# Frontend + Neon Database Setup

Your app is a **frontend-only web app** that connects directly to **Neon PostgreSQL** using the Neon Data API.

## Quick Start

### 1. Get Neon Data API Credentials

1. Go to [Neon Console](https://console.neon.tech/app/projects)
2. Select your project
3. Go to **API Keys** → Create a new API key
4. You'll get a key that looks like: `neondb_abc123...`
5. Your Data API URL: `https://[YOUR_PROJECT_ID].neon.database.neon.tech/rest/v1`

### 2. Configure Environment Variables

Edit `.env`:
```
VITE_NEON_DATA_API_KEY=your_api_key_here
VITE_NEON_DATA_API_URL=https://your-project.neon.database.neon.tech/rest/v1
```

### 3. Enable Neon Auth (Optional)

In Neon Console:
1. Go to **Auth** tab
2. Enable Neon Auth
3. Add your frontend URL to allowed origins: `http://localhost:5173`

Then add to `.env`:
```
VITE_NEON_AUTH_URL=https://your-project.auth.neon.tech
```

### 4. Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## How It Works

### Database Schema
Your Neon database should have tables like:
- `users` - User accounts (from Neon Auth)
- `invoices` - Invoice records
- `payments` - Payment records
- `clients` - Client information

### API Client
The frontend uses a `NeonAPIClient` class that:
- Connects to Neon Data API using HTTP
- Sends API key in headers for authentication
- Uses JWT tokens from Neon Auth for user authentication
- Supports filtering, creating, updating, and deleting records

### Example Usage
```typescript
import { apiClient } from '@/lib/api';

// Get all invoices for current user
const invoices = await apiClient.getInvoices(userId);

// Create new invoice
await apiClient.createInvoice({
  user_id: userId,
  client_id: '123',
  amount: 1000,
  due_date: '2024-04-01'
});

// Get payments for an invoice
const payments = await apiClient.getInvoicePayments(invoiceId);
```

## Deployment

### Frontend
- Deploy to **Vercel**, **Netlify**, or **GitHub Pages**
- Update `VITE_NEON_DATA_API_KEY` in deployment environment variables
- Add your deployment domain to Neon Auth allowed origins

### No Backend Server Needed!
- No Node.js server to run
- No Docker containers
- No hosting for backend code
- Just pure frontend + Neon database

## Neon Data API Reference

### GET (Read)
```
GET /rest/v1/table_name?column=eq.value
GET /rest/v1/table_name?id=eq.123
```

### POST (Create)
```
POST /rest/v1/table_name
Body: { "column": "value" }
```

### PATCH (Update)
```
PATCH /rest/v1/table_name?id=eq.123
Body: { "column": "new_value" }
```

### DELETE (Delete)
```
DELETE /rest/v1/table_name?id=eq.123
```

## Troubleshooting

### "401 Unauthorized"
- Check your API key is correct in `.env`
- Verify the API key hasn't expired in Neon Console

### CORS Error
- Add your frontend URL to Neon Auth allowed origins
- Ensure API key is sent in `apikey` header

### Table Not Found
- Verify table names match your Neon database schema
- Table names are case-sensitive

## Next Steps
1. Set up your database tables in Neon
2. Configure environment variables
3. Update your components to use `apiClient` methods
4. Test locally with `npm run dev`
5. Deploy to production

