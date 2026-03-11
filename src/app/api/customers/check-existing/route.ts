import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

const CheckExistingCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  phone: z.string().min(1, 'Phone is required'),
});

export async function POST(request: Request) {
  const currentUser = await requireCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = CheckExistingCustomerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const customer = await prisma.customer.findFirst({
    where: {
      name: data.name.trim(),
      address: data.address.trim(),
      postcode: data.postcode.trim(),
      phone: data.phone.trim(),
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({
    exists: Boolean(customer),
    customerId: customer?.id ?? null,
  });
}