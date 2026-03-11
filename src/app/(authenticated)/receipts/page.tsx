"use client";

// Receipts page component
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ReceiptDraft, ReceiptPerkaraOption, ReceiptTajukOption } from '@/lib/types';
import { Download, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { CustomerAutocomplete } from '@/components/customer-autocomplete';
import { KVAutocomplete } from '@/components/kv-autocomplete';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const toCurrency = (value: number) => `RM ${value.toFixed(2)}`;

export default function ReceiptsPage() {
  const [noResit, setNoResit] = useState('');
  const [noSeriSebatHarga, setNoSeriSebatHarga] = useState('');
  const [namaPenerima, setNamaPenerima] = useState('');
  const [namaKolejVokasional, setNamaKolejVokasional] = useState('');
  const [tajuk, setTajuk] = useState('');
  const [perkara, setPerkara] = useState('');
  const [kuantiti, setKuantiti] = useState('1');
  const [hargaSeunit, setHargaSeunit] = useState('0');
  const [hargaPostage, setHargaPostage] = useState('0');
  const [tarikh, setTarikh] = useState(new Date().toISOString().slice(0, 10));
  const [semester, setSemester] = useState('');

  const [perkaraOptions, setPerkaraOptions] = useState<ReceiptPerkaraOption[]>([]);
  const [newPerkaraOption, setNewPerkaraOption] = useState('');
  const [selectedPerkaraOptionId, setSelectedPerkaraOptionId] = useState('');

  const [tajukOptions, setTajukOptions] = useState<ReceiptTajukOption[]>([]);
  const [newTajukOption, setNewTajukOption] = useState('');
  const [selectedTajukOptionId, setSelectedTajukOptionId] = useState('');

  const [receiptDrafts, setReceiptDrafts] = useState<ReceiptDraft[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingPerkaraOption, setIsSavingPerkaraOption] = useState(false);
  const [isSavingTajukOption, setIsSavingTajukOption] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingDrafts, setIsClearingDrafts] = useState(false);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [isResettingNoResit, setIsResettingNoResit] = useState(false);
  const [isResettingSebatHarga, setIsResettingSebatHarga] = useState(false);
  const [resetStartNo, setResetStartNo] = useState('1');
  const [resetStartNoSebatHarga, setResetStartNoSebatHarga] = useState('1');

  const { toast } = useToast();

  const jumlah = useMemo(() => {
    const qty = Number(kuantiti) || 0;
    const unit = Number(hargaSeunit) || 0;
    const postage = Number(hargaPostage) || 0;
    return qty * unit + postage;
  }, [kuantiti, hargaSeunit, hargaPostage]);

  const loadDrafts = async () => {
    const response = await fetch('/api/receipts', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const receipts = data.receipts ?? [];
    setReceiptDrafts(receipts);
    setNoResit(data.nextNoResit ?? '0001');
    setNoSeriSebatHarga(data.nextNoSeriSebatHarga ?? '001');
  };

  const loadPerkaraOptions = async () => {
    const response = await fetch('/api/receipt-perkara', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setPerkaraOptions(data.options ?? []);
  };

  const loadTajukOptions = async () => {
    const response = await fetch('/api/receipt-tajuk', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setTajukOptions(data.options ?? []);
  };

  useEffect(() => {
    loadDrafts();
    loadPerkaraOptions();
    loadTajukOptions();
  }, []);

  const resetForm = () => {
    setNamaPenerima('');
    setNamaKolejVokasional('');
    setKuantiti('1');
    setHargaSeunit('0');
    setHargaPostage('0');
    setTarikh(new Date().toISOString().slice(0, 10));
    setSemester('');
  };

  const handleSavePerkaraOption = async () => {
    const label = newPerkaraOption.trim();
    if (!label) return;

    setIsSavingPerkaraOption(true);
    try {
      const response = await fetch('/api/receipt-perkara', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 409 && data.option?.id && data.option?.label) {
          setPerkara(data.option.label);
          setSelectedPerkaraOptionId(data.option.id);
          setNewPerkaraOption('');
          await loadPerkaraOptions();
          toast({
            title: 'Perkara Sudah Ada',
            description: 'Perkara sedia ada dipilih dari menu.',
          });
          return;
        }

        toast({
          title: 'Simpan Perkara Gagal',
          description: data.error ?? `Tidak dapat simpan pilihan perkara (HTTP ${response.status}).`,
          variant: 'destructive',
        });
        return;
      }

      const created = await response.json().catch(() => null);

      setNewPerkaraOption('');
      if (created?.option?.label && created?.option?.id) {
        setPerkara(created.option.label);
        setSelectedPerkaraOptionId(created.option.id);
      }
      await loadPerkaraOptions();
      toast({
        title: 'Perkara Disimpan',
        description: 'Perkara telah ditambah ke menu dropdown.',
      });
    } catch {
      toast({
        title: 'Simpan Perkara Gagal',
        description: 'Ralat rangkaian/pelayan semasa simpan pilihan perkara.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPerkaraOption(false);
    }
  };

  const handleDeletePerkaraOption = async () => {
    if (!selectedPerkaraOptionId) return;

    const response = await fetch(`/api/receipt-perkara/${selectedPerkaraOptionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      toast({
        title: 'Padam Perkara Gagal',
        description: 'Tidak dapat padam pilihan perkara yang dipilih.',
        variant: 'destructive',
      });
      return;
    }

    const deletedOption = perkaraOptions.find((opt) => opt.id === selectedPerkaraOptionId);
    if (deletedOption && perkara === deletedOption.label) {
      setPerkara('');
    }

    setSelectedPerkaraOptionId('');
    await loadPerkaraOptions();
    toast({
      title: 'Perkara Deleted',
      description: 'Perkara option removed from dropdown menu.',
    });
  };

  const handleSaveTajukOption = async () => {
    const label = newTajukOption.trim();
    if (!label) return;

    setIsSavingTajukOption(true);
    try {
      const response = await fetch('/api/receipt-tajuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 409 && data.option?.id && data.option?.label) {
          setTajuk(data.option.label);
          setSelectedTajukOptionId(data.option.id);
          setNewTajukOption('');
          await loadTajukOptions();
          toast({
            title: 'Tajuk Sudah Ada',
            description: 'Tajuk sedia ada dipilih dari menu.',
          });
          return;
        }

        toast({
          title: 'Simpan Tajuk Gagal',
          description: data.error ?? `Tidak dapat simpan pilihan tajuk (HTTP ${response.status}).`,
          variant: 'destructive',
        });
        return;
      }

      const created = await response.json().catch(() => null);

      setNewTajukOption('');
      if (created?.option?.label && created?.option?.id) {
        setTajuk(created.option.label);
        setSelectedTajukOptionId(created.option.id);
      }
      await loadTajukOptions();
      toast({
        title: 'Tajuk Disimpan',
        description: 'Tajuk telah ditambah ke menu dropdown.',
      });
    } catch {
      toast({
        title: 'Simpan Tajuk Gagal',
        description: 'Ralat rangkaian/pelayan semasa simpan pilihan tajuk.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTajukOption(false);
    }
  };

  const handleDeleteTajukOption = async () => {
    if (!selectedTajukOptionId) return;

    const response = await fetch(`/api/receipt-tajuk/${selectedTajukOptionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      toast({
        title: 'Padam Tajuk Gagal',
        description: 'Tidak dapat padam pilihan tajuk yang dipilih.',
        variant: 'destructive',
      });
      return;
    }

    const deletedOption = tajukOptions.find((opt) => opt.id === selectedTajukOptionId);
    if (deletedOption && tajuk === deletedOption.label) {
      setTajuk('');
    }

    setSelectedTajukOptionId('');
    await loadTajukOptions();
    toast({
      title: 'Tajuk Deleted',
      description: 'Tajuk option removed from dropdown menu.',
    });
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSavingDraft(true);
    const payload = {
      namaPenerima,
      namaKolejVokasional,
      tajuk,
      perkara,
      kuantiti: Number(kuantiti),
      hargaSeunit: Number(hargaSeunit),
      hargaPostage: Number(hargaPostage),
      tarikh,
      semester,
    };

    const response = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast({
        title: 'Simpan Resit Gagal',
        description: data.error ?? `Tidak dapat simpan draf resit (HTTP ${response.status}).`,
        variant: 'destructive',
      });
      setIsSavingDraft(false);
      return;
    }

    await loadDrafts();
    setIsSavingDraft(false);
    resetForm();
    toast({
      title: 'Resit Disimpan',
      description: 'Draf resit berjaya disimpan ke senarai. Anda boleh tambah pelanggan seterusnya.',
    });
  };

  const handleDeleteDraft = async (receiptId: string) => {
    const response = await fetch(`/api/receipts/${receiptId}`, { method: 'DELETE' });
    if (!response.ok) {
      toast({
        title: 'Padam Gagal',
        description: 'Tidak dapat buang draf resit.',
        variant: 'destructive',
      });
      return;
    }

    await loadDrafts();
    toast({
      title: 'Resit Dipadam',
      description: 'Draf resit berjaya dipadam dari senarai.',
    });
  };

  const handleClearAllDrafts = async () => {
    if (receiptDrafts.length === 0 || isClearingDrafts) return;

    const confirmed = window.confirm('Kosongkan semua draft resit dalam senarai ini?');
    if (!confirmed) return;

    setIsClearingDrafts(true);
    try {
      const response = await fetch('/api/receipts', { method: 'DELETE' });
      if (!response.ok) {
        toast({
          title: 'Kosongkan Gagal',
          description: 'Tidak dapat kosongkan semua draft resit.',
          variant: 'destructive',
        });
        return;
      }

      await loadDrafts();
      toast({
        title: 'Senarai Dikosongkan',
        description: 'Semua draft resit telah dipadam.',
      });
    } catch {
      toast({
        title: 'Kosongkan Gagal',
        description: 'Ralat network/server semasa kosongkan draft.',
        variant: 'destructive',
      });
    } finally {
      setIsClearingDrafts(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/receipts/template/download', { method: 'GET' });

      if (!response.ok) {
        toast({
          title: 'Muat Turun Gagal',
          description: 'Tidak dapat memuat turun template.',
          variant: 'destructive',
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'resit-template.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Template Dimuat Turun',
        description: 'Fail template berjaya dimuat turun. Semak struktur dan muat naik semula apabila siap.',
      });
    } catch {
      toast({
        title: 'Muat Turun Gagal',
        description: 'Ralat semasa muat turun fail template.',
        variant: 'destructive',
      });
    }
  };

  const handleUploadTemplate = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast({
        title: 'Fail Tidak Sah',
        description: 'Sila muat naik fail Excel (.xlsx) sahaja.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/receipts/template/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast({
          title: 'Muat Naik Gagal',
          description: data.error ?? 'Tidak dapat memuat naik template.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Template Dimuat Naik',
        description: 'Template baharu berjaya dimuat naik. Anda kini boleh eksport resit.',
      });
    } catch {
      toast({
        title: 'Muat Naik Gagal',
        description: 'Ralat semasa muat naik fail template.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const handleSelectCustomer = (customer: { id: string; name: string; kodKV: string }) => {
    setNamaPenerima(customer.name);
    handleFillNamaKV(customer.kodKV);
  };

  const handleFillNamaKV = (kodKV: string) => {
    setNamaKolejVokasional(kodKV);
  };

  const handleSelectKV = (item: { id: string; name: string; kodKV: string }) => {
    setNamaKolejVokasional(item.kodKV);
    setNamaPenerima(item.name);
  };

  const handleExportXlsx = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/receipts/export', { method: 'GET' });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast({
          title: 'Eksport Gagal',
          description: data.error ?? 'Tidak dapat mengeksport fail resit.',
          variant: 'destructive',
        });
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') ?? '';
      const matchedName = contentDisposition.match(/filename="?([^\"]+)"?/i)?.[1];
      const fileName = matchedName ?? `resit-export-${Date.now()}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Eksport Berjaya',
        description: 'Fail export berjaya dijana mengikut template.',
      });
    } catch {
      toast({
        title: 'Eksport Gagal',
        description: 'Ralat rangkaian/pelayan semasa eksport XLSX.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetNoResit = async () => {
    const value = Number(resetStartNo);
    if (!Number.isInteger(value) || value < 1 || value > 999999) {
      toast({
        title: 'Nilai Tidak Sah',
        description: 'Masukkan nombor mula antara 1 hingga 999999.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingNoResit(true);
    try {
      let response = await fetch('/api/receipts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNo: value, resetType: 'resit' }),
      });

      // Backward-compatible fallback if browser still serves older JS bundle.
      if (!response.ok && response.status === 404) {
        response = await fetch('/api/receipts/reset-counter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startNo: value }),
        });
      }

      if (!response.ok) {
        const text = await response.text();
        let data: { error?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text?.slice(0, 200) };
        }
        toast({
          title: 'Reset Gagal',
          description: data.error ?? `Tidak dapat reset no siri resit (HTTP ${response.status}).`,
          variant: 'destructive',
        });
        return;
      }

      await loadDrafts();
      toast({
        title: 'Reset Berjaya',
        description: `No siri resit set semula. Nombor seterusnya: ${String(value).padStart(4, '0')}.`,
      });
    } catch {
      toast({
        title: 'Reset Gagal',
        description: 'Ralat network/server semasa reset no siri resit.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingNoResit(false);
    }
  };

  const handleResetSebatHarga = async () => {
    const value = Number(resetStartNoSebatHarga);
    if (!Number.isInteger(value) || value < 1 || value > 999) {
      toast({
        title: 'Nilai Tidak Sah',
        description: 'Masukkan nombor mula antara 1 hingga 999.',
        variant: 'destructive',
      });
      return;
    }

    setIsResettingSebatHarga(true);
    try {
      const response = await fetch('/api/receipts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNo: value, resetType: 'sebat_harga' }),
      });

      if (!response.ok) {
        const text = await response.text();
        let data: { error?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = { error: text?.slice(0, 200) };
        }
        toast({
          title: 'Reset Gagal',
          description: data.error ?? `Tidak dapat reset no siri sebut harga (HTTP ${response.status}).`,
          variant: 'destructive',
        });
        return;
      }

      await loadDrafts();
      toast({
        title: 'Reset Berjaya',
        description: `No siri sebut harga set semula. Nombor seterusnya: ${String(value).padStart(3, '0')}.`,
      });
    } catch {
      toast({
        title: 'Reset Gagal',
        description: 'Ralat network/server semasa reset no siri sebut harga.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingSebatHarga(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Generate Resit"
        description="Isi maklumat resit dan simpan ke senarai sebelum eksport." 
      />

      <Card className="border-none shadow-sm mb-6 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base">Pengurusan Template</CardTitle>
          <CardDescription>Muat turun template semasa untuk semakan, atau muat naik template anda sendiri.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleDownloadTemplate}>
            <Download size={16} className="mr-2" />
            Muat Turun Template
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <Upload size={16} className="mr-2" />
                Muat Naik Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Muat Naik Template Baharu</DialogTitle>
                <DialogDescription>Muat naik template Excel (.xlsx) yang telah disediakan. Data borang akan diisi ke sel yang dipetakan.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx"
                    disabled={isUploadingTemplate}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadTemplate(file);
                      }
                    }}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Template perlu mempunyai pemetaan sel berikut: M9 (No Resit), B9 (Nama), B10 (Kolej), B13 (Tajuk/Perkara), B21 (Perkara), H21 (Kuantiti), J21 (Harga/Seunit), M26 (Postage), M33 (Jumlah), M10 (Tarikh)
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <form onSubmit={handleSaveDraft} className="space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Maklumat Resit</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="noResit">No Siri Resit (4-6 angka)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="noResit"
                    value={noResit}
                    disabled
                    readOnly
                    className="max-w-[180px]"
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="gap-1">
                        <RotateCcw size={14} />
                        Reset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset No Siri Resit</DialogTitle>
                        <DialogDescription>
                          Tetapkan nombor mula baru untuk penjanaan automatik no siri.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Label htmlFor="resetStartNo">Nombor Mula (1 - 999999)</Label>
                        <Input
                          id="resetStartNo"
                          inputMode="numeric"
                          maxLength={6}
                          value={resetStartNo}
                          onChange={(e) => setResetStartNo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Contoh: 1"
                        />
                        <Button
                          type="button"
                          onClick={handleResetNoResit}
                          disabled={isResettingNoResit || !resetStartNo}
                          className="w-full"
                        >
                          {isResettingNoResit ? 'Sedang Reset...' : 'Simpan Reset'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-muted-foreground"></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="noSeriSebatHarga">No Siri Sebut Harga (3 angka)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="noSeriSebatHarga"
                    value={noSeriSebatHarga}
                    disabled
                    readOnly
                    className="max-w-[180px]"
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="gap-1">
                        <RotateCcw size={14} />
                        Reset
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset No Siri Sebut Harga</DialogTitle>
                        <DialogDescription>
                          Tetapkan nombor mula baru untuk penjanaan automatik no siri sebut harga.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Label htmlFor="resetStartNoSebatHarga">Nombor Mula (1 - 999)</Label>
                        <Input
                          id="resetStartNoSebatHarga"
                          inputMode="numeric"
                          maxLength={3}
                          value={resetStartNoSebatHarga}
                          onChange={(e) => setResetStartNoSebatHarga(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          placeholder="Contoh: 1"
                        />
                        <Button
                          type="button"
                          onClick={handleResetSebatHarga}
                          disabled={isResettingSebatHarga || !resetStartNoSebatHarga}
                          className="w-full"
                        >
                          {isResettingSebatHarga ? 'Sedang Reset...' : 'Simpan Reset'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-muted-foreground"></p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="namaPenerima">Nama Penerima</Label>
                <CustomerAutocomplete
                  value={namaPenerima}
                  onValueChange={setNamaPenerima}
                  onCustomerSelect={handleSelectCustomer}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="namaKolejVokasional">Nama Kolej Vokasional</Label>
                <KVAutocomplete
                  value={namaKolejVokasional}
                  onValueChange={setNamaKolejVokasional}
                  onKVSelect={handleSelectKV}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tajuk (Untuk Sebut Harga)</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
                <Select
                  value={tajuk}
                  onValueChange={(value) => {
                    setTajuk(value);
                    const selected = tajukOptions.find((opt) => opt.label === value);
                    setSelectedTajukOptionId(selected?.id ?? '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tajuk dari menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {tajukOptions.map((option) => (
                      <SelectItem key={option.id} value={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Atau taip tajuk baru"
                  value={newTajukOption}
                  onChange={(e) => setNewTajukOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTajukOption();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveTajukOption} disabled={isSavingTajukOption || !newTajukOption.trim()}>
                    Simpan Menu
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDeleteTajukOption} disabled={!selectedTajukOptionId}>
                    Padam Menu
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Perkara</Label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
                <Select
                  value={perkara}
                  onValueChange={(value) => {
                    setPerkara(value);
                    const selected = perkaraOptions.find((opt) => opt.label === value);
                    setSelectedPerkaraOptionId(selected?.id ?? '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih perkara dari menu" />
                  </SelectTrigger>
                  <SelectContent>
                    {perkaraOptions.map((option) => (
                      <SelectItem key={option.id} value={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Atau taip perkara baru"
                  value={newPerkaraOption}
                  onChange={(e) => setNewPerkaraOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSavePerkaraOption();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSavePerkaraOption} disabled={isSavingPerkaraOption || !newPerkaraOption.trim()}>
                    Simpan Menu
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDeletePerkaraOption} disabled={!selectedPerkaraOptionId}>
                    Padam Menu
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="kuantiti">Kuantiti</Label>
                <Input id="kuantiti" type="number" min="1" value={kuantiti} onChange={(e) => setKuantiti(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hargaSeunit">Harga Seunit</Label>
                <Input id="hargaSeunit" type="number" min="0" step="0.01" value={hargaSeunit} onChange={(e) => setHargaSeunit(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hargaPostage">Harga Postage</Label>
                <Input id="hargaPostage" type="number" min="0" step="0.01" value={hargaPostage} onChange={(e) => setHargaPostage(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarikh">Tarikh</Label>
                <Input id="tarikh" type="date" value={tarikh} onChange={(e) => setTarikh(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Contoh: Semester 1" required />
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-semibold">
                  {toCurrency(jumlah)}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="gap-2" disabled={isSavingDraft}>
                <Save size={16} />
                {isSavingDraft ? 'Menyimpan...' : 'Simpan Ke Senarai'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card className="mt-6 border-none shadow-sm">
        <CardHeader>
          <CardTitle>Senarai Draft Resit</CardTitle>
          <CardDescription>Resit yang telah disimpan sebelum export.</CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              className="gap-2"
              onClick={handleExportXlsx}
              disabled={isExporting || receiptDrafts.length === 0}
            >
              <Download size={16} />
              {isExporting ? 'Mengeksport...' : `Eksport XLSX (${receiptDrafts.length})`}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              onClick={handleClearAllDrafts}
              disabled={isClearingDrafts || receiptDrafts.length === 0}
            >
              <Trash2 size={16} />
              {isClearingDrafts ? 'Mengosongkan...' : 'Kosongkan Draft'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>No Resit</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Kolej</TableHead>
                  <TableHead>Tajuk</TableHead>
                  <TableHead>Perkara</TableHead>
                  <TableHead>Tarikh</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptDrafts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Belum ada draft resit.
                    </TableCell>
                  </TableRow>
                ) : (
                  receiptDrafts.map((item) => {
                    const total = item.kuantiti * item.hargaSeunit + item.hargaPostage;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.noResit}</TableCell>
                        <TableCell className="font-medium">{item.namaPenerima}</TableCell>
                        <TableCell>{item.namaKolejVokasional}</TableCell>
                        <TableCell>{item.tajuk}</TableCell>
                        <TableCell>{item.perkara}</TableCell>
                        <TableCell>{new Date(item.tarikh).toLocaleDateString()}</TableCell>
                        <TableCell>{item.semester}</TableCell>
                        <TableCell className="text-right">{toCurrency(total)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" className="text-destructive" onClick={() => handleDeleteDraft(item.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

