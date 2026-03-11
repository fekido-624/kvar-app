import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { requireCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(request: NextRequest) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Only .xlsx files are accepted' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save to templates directory
    const templatesDir = path.join(process.cwd(), 'templates');
    await fs.mkdir(templatesDir, { recursive: true });

    const templatePath = path.join(templatesDir, 'resit-template.xlsx');
    await fs.writeFile(templatePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'Template uploaded successfully',
      fileName: file.name,
      size: buffer.byteLength,
    });
  } catch (error) {
    console.error('Template upload error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
