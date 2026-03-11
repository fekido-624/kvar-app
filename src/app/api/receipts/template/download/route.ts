import { NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { requireCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templatesDir = path.join(process.cwd(), 'templates');
    const templatePath = path.join(templatesDir, 'resit-template.xlsx');

    // Check if file exists
    await fs.access(templatePath);

    // Read the file
    const fileBuffer = await fs.readFile(templatePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="resit-template.xlsx"',
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Template file not found' },
      { status: 404 }
    );
  }
}
