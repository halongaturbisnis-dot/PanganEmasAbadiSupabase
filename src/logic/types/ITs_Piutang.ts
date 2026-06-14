export enum TPiutangCategory {
  PENJUALAN = 'Penjualan',
  PINJAMAN = 'Pinjaman',
  OPERASIONAL = 'Operasional',
  LAINNYA = 'Lainnya'
}

export enum TPiutangStatus {
  ACTIVE = 'Active',
  SETTLED = 'Settled',
  CANCELLED = 'Cancelled'
}

export interface IPiutang {
  id: string;
  datetime: string;
  name: string;
  description: string | null;
  category: TPiutangCategory;
  sales_id: string | null;
  entity_name: string;
  principal_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string | null;
  status: TPiutangStatus;
  created_at: string;
  created_by: string | null;
  created_timezone: string;
  updated_at: string | null;
  updated_by: string | null;
  updated_timezone: string | null;
}

export interface IPiutangPembayaran {
  id: string;
  piutang_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'Tunai' | 'Non Tunai';
  bank_and_cash_id: string;
  income_id: string | null;
  description: string | null;
  proof_urls?: string | null;
  next_sla?: string | null;
  created_at: string;
  created_by: string | null;
  created_timezone: string;
  updated_at: string | null;
  updated_by: string | null;
  updated_timezone: string | null;
}

export interface IPiutangPayload extends Omit<IPiutang, 'id' | 'paid_amount' | 'outstanding_amount' | 'created_at' | 'updated_at'> {
  id?: string;
  payments?: IPiutangPembayaranPayload[];
}

export interface IPiutangPembayaranPayload {
  id?: string;
  piutang_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'Tunai' | 'Non Tunai';
  bank_and_cash_id: string;
  description?: string;
  next_sla?: string | null;
  files?: File[];
}
