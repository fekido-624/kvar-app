"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

export default function CreateCustomerPage() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [kodKV, setKodKV] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        address,
        postcode,
        phone,
        kodKV,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast({
        title: 'Cipta Gagal',
        description: data.error ?? 'Tidak dapat mencipta pelanggan.',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    toast({
      title: 'Pelanggan Dicipta',
      description: `Pelanggan ${name} berjaya ditambah.`,
    });
    router.push('/customers');
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Cipta Pelanggan Baharu"
        description="Tambah pelanggan baharu ke pangkalan data."
      />

      <form onSubmit={handleSave}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Masukkan butiran pelanggan di bawah.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama pelanggan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat penuh"
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="Postcode"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nombor telefon"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                />
                <p className="text-xs text-muted-foreground">Nombor sahaja.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kodKV">Kod KV</Label>
              <Input
                id="kodKV"
                value={kodKV}
                onChange={(e) => setKodKV(e.target.value)}
                placeholder="Unique Kod KV"
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Kod KV boleh berulang untuk pelanggan yang berbeza.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <X size={18} className="mr-2" /> Batal
          </Button>
          <Button type="submit" className="gap-2 h-11 px-8" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Mencipta...' : 'Cipta Pelanggan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
