import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { requireCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const ExportParcelSchema = z.object({
  entries: z
    .array(
      z.object({
        namaCustomer: z.string().min(1),
        alamat: z.string().optional().default(''),
        poskod: z.string().optional().default(''),
        noPhone: z.string().min(1),
        noOrder: z.string().min(1),
        bilanganParcel: z.number().int().min(1),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = ExportParcelSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const templatePath = path.join(
    process.cwd(),
    'public',
    'templates',
    'data-parcel-template.xlsx'
  );

  try {
    await fs.access(templatePath);
  } catch {
    return NextResponse.json(
      { error: 'Template not found at public/templates/data-parcel-template.xlsx' },
      { status: 404 }
    );
  }

  const templateBuffer = await fs.readFile(templatePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return NextResponse.json(
      { error: 'Template workbook has no worksheet.' },
      { status: 400 }
    );
  }

  const expandedRows = parsed.data.entries.flatMap((entry) =>
    Array.from({ length: entry.bilanganParcel }, (_, index) => {
      const part = index + 1;
      const total = entry.bilanganParcel;
      return {
        namaCustomer: entry.namaCustomer,
        alamat: entry.alamat ?? '',
        poskod: entry.poskod ?? '',
        noPhone: entry.noPhone,
        instruction: `BUNGKUSAN NO ${entry.noOrder}. ${part}/${total} HUBUNGI PENERIMA SEBELUM DELIVERY. TERIMA KASIH ABANG KAKAK NINJA.`,
      };
    })
  );

  expandedRows.forEach((rowData, index) => {
    const row = index + 2;
    sheet.getCell(`A${row}`).value = rowData.namaCustomer;
    sheet.getCell(`B${row}`).value = rowData.alamat;
    sheet.getCell(`C${row}`).value = rowData.poskod;
    sheet.getCell(`D${row}`).value = rowData.noPhone;
    sheet.getCell(`E${row}`).value = rowData.instruction;
    // Column Parcel uses a fixed label requested by user.
    sheet.getCell(`F${row}`).value = 'BUKU';
    // Column H uses default quantity marker.
    sheet.getCell(`H${row}`).value = 1;
  });

  const outputBuffer = await workbook.xlsx.writeBuffer();
  const fileName = `data-parcel-export-${Date.now()}.xlsx`;

  return new NextResponse(Buffer.from(outputBuffer as ArrayBuffer), {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
