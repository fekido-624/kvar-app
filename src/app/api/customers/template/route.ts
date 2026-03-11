import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  // Create sample data
  const sampleData = [
    ['Name', 'Address', 'Postcode', 'No.phone', 'Kod KV'],
    ['Ahmad Bin Ali', 'No 123, Jalan Mawar, Taman Indah', '50000', '012-3456789', 'KV001'],
    ['Siti Fatimah', 'No 456, Jalan Kenanga, Taman Bahagia', '51000', '013-9876543', 'KV002'],
    ['Kumar A/L Raju', 'No 789, Jalan Melati, Taman Sejahtera', '52000', '014-1234567', 'KV003'],
  ];

  // Create workbook and worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Name
    { wch: 40 }, // Address
    { wch: 10 }, // Postcode
    { wch: 15 }, // Phone
    { wch: 10 }, // Kod KV
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Return as downloadable file
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="customer_template.xlsx"',
    },
  });
}
