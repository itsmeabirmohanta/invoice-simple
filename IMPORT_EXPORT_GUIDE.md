# Invoice Import/Export Guide

## Overview

The invoice app now has a complete backup and restore system that allows you to download your invoices as JSON backups and import them back when needed.

## Features

### 1. **Export All Invoices**

- Click **"Export All"** button in the dashboard header
- Downloads all invoices in JSON format
- Filename: `invoice-backup-YYYY-MM-DD.json`
- Preserves complete invoice data including items, dates, and status

### 2. **Export Current View**

- Click **"Export View"** button to export only filtered/searched invoices
- If you have filters applied (status, search), only those invoices are exported
- Filename: `invoice-backup-filtered-YYYY-MM-DD.json`
- Useful for exporting specific invoice subsets

### 3. **Import Invoices**

- Click **"Import"** button to select a JSON backup file
- Supported formats:
  - Direct JSON array of invoices
  - JSON object with `invoices` property (as provided)
- The app shows a preview dialog with all invoices to be imported
- Review the invoice count, dates, and status
- Click **"Import"** to add all invoices to your database
- Imported invoices are automatically saved to the database

## Import Format Support

The import system automatically converts between different invoice formats:

### Supported Backup Formats

```json
{
  "invoices": [
    {
      "id": "uuid",
      "number": "INV0001",
      "date": "2025-06-24",
      "from": {
        "name": "Your Business Name",
        "email": "business@example.com",
        "address": {
          "street1": "Address Line 1",
          "city": "City",
          "zip": "12345"
        }
      },
      "to": {
        "name": "Client Name",
        "email": "client@example.com",
        "address": {
          "street1": "Client Address",
          "city": "City",
          "zip": "12345"
        }
      },
      "items": [
        {
          "id": "item-uuid",
          "description": "Service Description",
          "rate": 1000,
          "qty": 1
        }
      ],
      "currency": "INR",
      "tax": {
        "type": "GST",
        "rate": 18
      },
      "status": "paid",
      "year": 2025,
      "notes": "Bank details and payment info"
    }
  ],
  "settings": {
    "templateColor": "default"
  }
}
```

## Data Transformation During Import

When importing, the system automatically:

- ✅ Converts old field names to new format
- ✅ Handles missing fields with sensible defaults
- ✅ Transforms address objects to strings
- ✅ Converts `qty` to `quantity`
- ✅ Maps `rate` and `quantity` correctly
- ✅ Determines GST settings from tax information
- ✅ Converts payment status from invoice status field
- ✅ Generates missing IDs for items

## Step-by-Step Usage

### Exporting Your Invoices

1. Go to the **Invoices** dashboard
2. (Optional) Filter invoices using:
   - Search by invoice number, client, or sender
   - Status filter (All, Paid, Unpaid)
3. Click **"Export All"** to export all invoices
   - OR click **"Export View"** to export only filtered invoices
4. Your browser will download the JSON file
5. Save the file to a safe location as backup

### Importing Previous Invoices

1. Go to the **Invoices** dashboard
2. Click the **"Import"** button
3. Select your backup JSON file
4. A preview dialog appears showing:
   - Number of invoices being imported
   - Invoice numbers and dates
   - Client names and status
5. Review the preview and click **"Import"**
6. Wait for the import to complete (shows "Importing..." status)
7. Success message appears when done
8. Imported invoices appear in your dashboard immediately

## Tips & Best Practices

### Regular Backups

- Export your invoices monthly or whenever you create new ones
- Store backups in multiple locations (cloud storage, external drive)
- Include the date in your backup filename for easy identification

### Batch Operations

- Use "Export View" to organize backups by status (paid, unpaid)
- Import multiple backup files one at a time
- Check import preview before confirming

### Data Safety

- Importing does NOT delete existing invoices
- Duplicate invoice numbers are allowed but not recommended
- All imported data is validated before saving to database
- Failed imports show error messages with details

## Technical Details

### Data Validation

The import system validates:

- Required fields: id, number, date, from, to, items
- Item array must contain valid rate and quantity
- Email format validation for addresses
- Address field parsing and conversion

### Error Handling

If import fails:

- Shows specific error message (e.g., "missing required fields")
- Lists which invoice caused the error
- Partial imports are allowed (some succeed, some fail)
- Review the error and correct the JSON file if needed

### Database Integration

- Imported invoices are saved to your Neon database
- Each invoice gets a unique ID
- All line items are properly associated
- Payment status is synchronized

## File Specifications

### Input File Requirements

- **Format**: JSON (.json extension)
- **Size**: Typically under 100KB for most invoice collections
- **Structure**: Array or object with `invoices` property
- **Encoding**: UTF-8

### Output File Format

- **Filename Pattern**: `invoice-backup-YYYY-MM-DD.json` or `invoice-backup-filtered-YYYY-MM-DD.json`
- **Size**: Depends on number of invoices (typically 1-50KB per 100 invoices)
- **Content**: Complete invoice data with metadata

## FAQ

**Q: Can I import invoices multiple times?**

A: Yes! Importing doesn't delete existing invoices, so you can import the same file multiple times if needed.

**Q: What happens if two invoices have the same number?**

A: The app allows duplicate invoice numbers. It's recommended to use unique numbers for tracking.

**Q: Can I edit the JSON before importing?**

A: Yes! The JSON format is editable. Just make sure to maintain the structure and validate required fields.

**Q: What if an invoice fails to import?**

A: The system shows which invoice failed and why. Other invoices in the file will still be imported.

**Q: Are imported invoices automatically backed up?**

A: No, you'll need to export again after importing to create a new backup.

## Contact & Support

If you encounter any issues:

1. Check that your JSON file is valid (use a JSON validator if needed)
2. Ensure all required fields are present
3. Try exporting a small subset of invoices first
4. Review the error message for specific guidance
