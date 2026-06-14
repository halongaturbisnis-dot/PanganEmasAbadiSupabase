export enum TLiabilitasCategory {
  PEMBELIAN = 'Pembelian',
  PINJAMAN = 'Pinjaman',
  OPERASIONAL = 'Operasional',
  LAINNYA = 'Lainnya'
}

export enum TLiabilitasStatus {
  ACTIVE = 'Active',
  SETTLED = 'Settled',
  CANCELLED = 'Cancelled'
}

export interface ILiabilitas {
  id: string;
  datetime: string;
  name: string;
  description: string | null;
  category: TLiabilitasCategory;
  purchase_id: string | null;
  entity_name: string;
  principal_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string | null;
  status: TLiabilitasStatus;
  created_at: string;
  created_by: string | null;
  created_timezone: string;
  updated_at: string | null;
  updated_by: string | null;
  updated_timezone: string | null;
}

export interface ILiabilitasPembayaran {
  id: string;
  liabilitas_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'Tunai' | 'Non Tunai';
  bank_and_cash_id: string;
  expense_id: string | null;
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

export interface ILiabilitasPayload extends Omit<ILiabilitas, 'id' | 'paid_amount' | 'outstanding_amount' | 'created_at' | 'updated_at'> {
  id?: string;
  payments?: ILiabilitasPembayaranPayload[];
}

export interface ILiabilitasPembayaranPayload {
  id?: string;
  liabilitas_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'Tunai' | 'Non Tunai';
  bank_and_cash_id: string;
  description?: string;
  next_sla?: string | null;
  files?: File[];
}
