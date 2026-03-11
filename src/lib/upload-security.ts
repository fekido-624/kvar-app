import JSZip from 'jszip';

const DEFAULT_MAX_XLSX_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_XLSX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
  '',
]);

const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

type SpreadsheetValidationResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; error: string; status: number };

const hasZipSignature = (buffer: Buffer) =>
  buffer.length >= 4 && buffer.subarray(0, 4).equals(ZIP_SIGNATURE);

const hasMacroEntries = async (buffer: Buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.keys(zip.files).map((name) => name.toLowerCase());
  return entries.some((entry) => entry.endsWith('vbaproject.bin'));
};

export const validateSpreadsheetUpload = async (
  file: File,
  options?: { maxBytes?: number }
): Promise<SpreadsheetValidationResult> => {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_XLSX_SIZE_BYTES;

  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return { ok: false, error: 'Only .xlsx files are accepted.', status: 400 };
  }

  if (!ALLOWED_XLSX_MIME_TYPES.has(file.type)) {
    return { ok: false, error: 'Invalid file type.', status: 400 };
  }

  if (file.size <= 0) {
    return { ok: false, error: 'File is empty.', status: 400 };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `File too large. Maximum allowed size is ${Math.floor(maxBytes / (1024 * 1024))}MB.`,
      status: 413,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!hasZipSignature(buffer)) {
    return { ok: false, error: 'Invalid XLSX file signature.', status: 400 };
  }

  try {
    if (await hasMacroEntries(buffer)) {
      return { ok: false, error: 'Macro-enabled files are not allowed.', status: 400 };
    }
  } catch {
    return { ok: false, error: 'Invalid or corrupted XLSX file.', status: 400 };
  }

  return { ok: true, buffer };
};
