/**
 * Interface definition for Penjualan (Sales) Module.
 * This file serves as the data contract between Database and System.
 * Matches schemas defined in /database/PenjualanTable.sql, PenjualanProdukTable.sql, etc.
 */

export interface ITs_Penjualan {
  id: string;
  datetime: string;
  sales_id?: string;
  sales_name?: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_company?: string;
  
  // Financial Summary
  sum_product_price: number;
  sum_added_cost: number;
  discount_type: 'price' | 'percent';
  discount_value: number;
  discount_amount: number;
  grand_total: number;
  
  // Payment Status
  payment_type: 'Lunas' | 'Tempo';
  deposit: number;
  outstanding: number;
  sla_date?: string;
  
  // Payment Details
  payment_method: 'Tunai' | 'Non Tunai';
  bank_cash_source_id: string;
  
  // Files & Remarks
  payment_proof_fileurls: string[]; // Handled as JSON string in DB
  keterangan?: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled' | 'Completed';
  invoice_pdf_url?: string;
  
  // Approval Workflow
  approver_id?: string;
  approver_name?: string;
  approver_jabatan?: string;
  approval_status?: 'Pending' | 'Approved' | 'Rejected';
  approval_signature_url?: string;
  approval_at?: string;
  approval_note?: string;
  
  // Audit Trail
  created_at: string;
  created_by?: string;
  created_timezone: string;
  updated_at?: string;
  updated_by?: string;
  updated_timezone?: string;

  // Nested Data (Transient/UI purposes)
  items?: ITs_PenjualanProduk[];
  costs?: ITs_PenjualanBiaya[];
}

export interface ITs_PenjualanProduk {
  id: string;
  penjualan_id: string;
  
  // Product Data
  is_mixing: boolean; // 1 = true, 0 = false
  is_dropship?: boolean; // 1 = true, 0 = false
  sku?: string;
  name: string;
  kategori?: string;
  sub_kategori?: string;
  unit: string;
  qty: number;
  
  // Pricing & Profit Snapshot
  unit_selling_price: number;
  unit_base_price: number;
  total_selling_price: number;
  total_base_price: number;
  margin_amount: number;
  margin_percentage: number;
  
  // Audit Trail
  created_at: string;
  created_by?: string;
  created_timezone: string;
  updated_at?: string;
  updated_by?: string;
  updated_timezone?: string;

  // Mixing Data (Transient/UI purposes)
  mixing_composition?: ITs_PenjualanProdukMixing[];
}

export interface ITs_PenjualanProdukMixing {
  id: string;
  penjualan_id: string;
  penjualan_produk_id: string;
  
  // Composition Data
  sku: string;
  name: string;
  unit: string;
  qty_composition: number;
  total_qty: number;
  
  // Snapshot Data
  base_price_snapshot: number;
  total_base_price: number;
  
  // Audit Trail
  created_at: string;
  created_by?: string;
  created_timezone: string;
  updated_at?: string;
  updated_by?: string;
  updated_timezone?: string;
}

export interface ITs_PenjualanBiaya {
  id: string;
  penjualan_id: string;
  
  // Cost Data
  nama_biaya: string;
  nominal: number;
  keterangan?: string;
  
  // Audit Trail
  created_at: string;
  created_by?: string;
  created_timezone: string;
  updated_at?: string;
  updated_by?: string;
  updated_timezone?: string;
}
