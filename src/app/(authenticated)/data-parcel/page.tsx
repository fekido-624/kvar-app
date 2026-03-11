"use client";

import { useMemo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KVAutocomplete } from '@/components/kv-autocomplete';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type KVSelection = {
  id: string;
  name: string;
  address: string;
  postcode: string;
  phone: string;
  kodKV: string;
};

type ParcelEntry = {
  id: string;
  namaCustomer: string;
  alamat: string;
  poskod: string;
  kv: string;
  noPhone: string;
  noOrder: string;
  bilanganParcel: number;
};

const emptyForm = {
  namaCustomer: '',
  alamat: '',
  poskod: '',
  kv: '',
  noPhone: '',
  noOrder: '',
  bilanganParcel: '1',
};

export default function DataParcelPage() {
  const [form, setForm] = useState(emptyForm);
  const [entries, setEntries] = useState<ParcelEntry[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const totalParcel = useMemo(
    () => entries.reduce((sum, item) => sum + item.bilanganParcel, 0),
    [entries]
  );

  const updateForm = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSelectKV = (item: KVSelection) => {
    setForm((current) => ({
      ...current,
      namaCustomer: item.name,
      alamat: item.address,
      poskod: item.postcode,
      kv: item.kodKV,
      noPhone: item.phone,
    }));
  };

  const handleSelectNamaCustomer = (item: KVSelection) => {
    setForm((current) => ({
      ...current,
      namaCustomer: item.name,
      alamat: item.address,
      poskod: item.postcode,
      kv: item.kodKV,
      noPhone: item.phone,
    }));
  };

  const handleSaveToList = () => {
    const bilanganParcel = Number(form.bilanganParcel);
    const missingFields: string[] = [];

    if (!form.namaCustomer.trim()) missingFields.push('Nama Pelanggan');
    if (!form.kv.trim()) missingFields.push('KV');
    if (!form.noPhone.trim()) missingFields.push('No. Telefon');
    if (!form.noOrder.trim()) missingFields.push('No Order');
    if (!form.bilanganParcel.trim()) missingFields.push('Bilangan Parcel');

    if (missingFields.length > 0) {
      toast({
        title: 'Form belum lengkap',
        description: `Sila lengkapkan: ${missingFields.join(', ')}.`,
        variant: 'destructive',
      });
      return;
    }

    if (!Number.isInteger(bilanganParcel) || bilanganParcel < 1) {
      toast({
        title: 'Bilangan Parcel tidak sah',
        description: 'Bilangan Parcel mesti nombor 1 atau lebih.',
        variant: 'destructive',
      });
      return;
    }

    const nextEntry: ParcelEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      namaCustomer: form.namaCustomer.trim(),
      alamat: form.alamat.trim(),
      poskod: form.poskod.trim(),
      kv: form.kv.trim(),
      noPhone: form.noPhone.trim(),
      noOrder: form.noOrder.trim(),
      bilanganParcel,
    };

    setEntries((current) => [...current, nextEntry]);
    setForm(emptyForm);

    toast({
      title: 'Data disimpan ke senarai',
      description: 'Data parcel berjaya ditambah untuk pratonton.',
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries((current) => current.filter((item) => item.id !== entryId));
  };

  const handleExportXlsx = async () => {
    if (entries.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/data-parcel/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entries: entries.map((entry) => ({
            namaCustomer: entry.namaCustomer,
            alamat: entry.alamat,
            poskod: entry.poskod,
            noPhone: entry.noPhone,
            noOrder: entry.noOrder,
            bilanganParcel: entry.bilanganParcel,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast({
          title: 'Export gagal',
          description: data.error ?? 'Tidak dapat mengeksport fail XLSX data parcel.',
          variant: 'destructive',
        });
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') ?? '';
      const matchedName = contentDisposition.match(/filename="?([^\"]+)"?/i)?.[1];
      const fileName = matchedName ?? `data-parcel-export-${Date.now()}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export berjaya',
        description: 'Fail XLSX data parcel berjaya dijana ikut template.',
      });
    } catch {
      toast({
        title: 'Export gagal',
        description: 'Ralat network/server semasa export data parcel.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Data Parcel"
        description="Isi borang data parcel dan simpan ke senarai untuk pratonton sebelum eksport XLSX."
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Borang Parcel</CardTitle>
            <CardDescription>Boleh cari dari DB guna Nama Pelanggan atau KV. No. Telefon auto isi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="namaCustomer">Nama Pelanggan</Label>
              <KVAutocomplete
                value={form.namaCustomer}
                onValueChange={(value) => updateForm('namaCustomer', value)}
                onKVSelect={handleSelectNamaCustomer}
                placeholder="Cari Nama Pelanggan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kv">KV</Label>
              <KVAutocomplete
                value={form.kv}
                onValueChange={(value) => updateForm('kv', value)}
                onKVSelect={handleSelectKV}
                placeholder="Cari Kod KV"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noPhone">No. Telefon</Label>
              <Input
                id="noPhone"
                value={form.noPhone}
                onChange={(e) => updateForm('noPhone', e.target.value)}
                placeholder="Auto isi selepas pilih KV"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noOrder">No Order</Label>
              <Input
                id="noOrder"
                value={form.noOrder}
                onChange={(e) => updateForm('noOrder', e.target.value)}
                placeholder="Masukkan no order"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bilanganParcel">Bilangan Parcel</Label>
              <Input
                id="bilanganParcel"
                type="number"
                min="1"
                value={form.bilanganParcel}
                onChange={(e) => updateForm('bilanganParcel', e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 3"
              />
            </div>

            <Button type="button" className="w-full" onClick={handleSaveToList}>
              Simpan Ke Senarai
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Senarai Preview Parcel</CardTitle>
            <CardDescription>
              {entries.length} entri dalam senarai | Jumlah parcel: {totalParcel}
            </CardDescription>
            <div className="pt-2">
              <Button
                type="button"
                className="gap-2"
                onClick={handleExportXlsx}
                disabled={isExporting || entries.length === 0}
              >
                <Download size={16} />
                {isExporting ? 'Mengeksport...' : `Eksport XLSX (${entries.length})`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nama Pelanggan</TableHead>
                    <TableHead>KV</TableHead>
                    <TableHead>No. Telefon</TableHead>
                    <TableHead>No Order</TableHead>
                    <TableHead className="text-right">Bilangan Parcel</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Belum ada data parcel dalam senarai.
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.namaCustomer}</TableCell>
                        <TableCell className="font-medium">{item.kv}</TableCell>
                        <TableCell>{item.noPhone}</TableCell>
                        <TableCell>{item.noOrder}</TableCell>
                        <TableCell className="text-right">{item.bilanganParcel}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteEntry(item.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
