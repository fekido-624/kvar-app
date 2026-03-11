import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { requireCurrentUser } from '@/lib/auth';
import { validateSpreadsheetUpload } from '@/lib/upload-security';

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

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validated = await validateSpreadsheetUpload(file);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: validated.status });
    }

    const { buffer } = validated;

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
