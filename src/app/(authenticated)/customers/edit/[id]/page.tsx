"use client";

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [phone, setPhone] = useState('');
  const [kodKV, setKodKV] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPage = searchParams.get('page') ?? '1';
  const returnQ = searchParams.get('q') ?? '';
  const returnFilter = searchParams.get('filter') ?? 'all';
  const returnQueryParams = new URLSearchParams();
  returnQueryParams.set('page', returnPage);
  if (returnQ.trim()) returnQueryParams.set('q', returnQ);
  if (returnFilter !== 'all') returnQueryParams.set('filter', returnFilter);
  const returnUrl = `/customers?${returnQueryParams.toString()}`;
  const { toast } = useToast();

  useEffect(() => {
    const loadCustomer = async () => {
      const response = await fetch(`/api/customers/${customerId}`, { cache: 'no-store' });
      if (!response.ok) {
        router.push(returnUrl);
        return;
      }

      const data = await response.json();
      const found: Customer = data.customer;
      setCustomer(found);
      setName(found.name);
      setAddress(found.address);
      setPostcode(found.postcode);
      setPhone(found.phone);
      setKodKV(found.kodKV);
    };

    loadCustomer();
  }, [customerId, router, returnUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setIsSaving(true);

    const payload: Record<string, string> = {};
    if (name !== customer.name) payload.name = name;
    if (address !== customer.address) payload.address = address;
    if (postcode !== customer.postcode) payload.postcode = postcode;
    if (phone !== customer.phone) payload.phone = phone;
    if (kodKV !== customer.kodKV) payload.kodKV = kodKV;

    // Always send all fields to ensure complete update
    if (Object.keys(payload).length === 0) {
      toast({ title: 'Tiada Perubahan', description: 'Tiada maklumat yang diubah.' });
      setIsSaving(false);
      return;
    }

    const fullPayload = { name, address, postcode, kodKV, ...payload };

    const response = await fetch(`/api/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast({
        title: 'Kemaskini Gagal',
        description: data.error ?? 'Tidak dapat mengemaskini pelanggan.',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    toast({
      title: 'Pelanggan Dikemaskini',
      description: `Pelanggan ${name} berjaya dikemaskini.`,
    });
    router.push(returnUrl);
  };

  if (!customer) return null;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Edit Pelanggan"
        description={`Ubah butiran untuk ${customer.name}.`}
      />

      <form onSubmit={handleSave}>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Butiran Pelanggan</CardTitle>
            <CardDescription>Kemaskini maklumat pelanggan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
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
          <Button type="button" variant="ghost" onClick={() => router.push(returnUrl)}>
            <X size={18} className="mr-2" /> Batal
          </Button>
          <Button type="submit" className="gap-2 h-11 px-8" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Menyimpan...' : 'Kemaskini Pelanggan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
