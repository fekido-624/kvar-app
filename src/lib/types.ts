export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: UserRole;
  password?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  postcode: string;
  phone: string;
  kodKV: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptDraft {
  id: string;
  noResit: string;
  noSeriSebatHarga: string;
  namaPenerima: string;
  namaKolejVokasional: string;
  tajuk: string;
  perkara: string;
  kuantiti: number;
  hargaSeunit: number;
  hargaPostage: number;
  tarikh: string;
  semester: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptPerkaraOption {
  id: string;
  label: string;
  createdAt: string;
}

export interface ReceiptTajukOption {
  id: string;
  label: string;
  createdAt: string;
}