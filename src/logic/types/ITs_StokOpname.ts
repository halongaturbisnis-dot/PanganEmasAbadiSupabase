import { EntityBase } from './app';

/**
 * Interface Kontrak Data Stok Opname
 */
export interface IStokOpname extends EntityBase {
  id: string;
  no_so: string;
  sku: string;
  qty_system: number;
  qty_actual: number;
  qty_diff: number;
  harga_per_unit: number;
  total_valuasi_aktual: number;
  total_valuasi_selisih: number;
  notes?: string;
  /**
   * Field virtual dari join stok_berjalan
   */
  stok_name?: string;
  stok_unit?: string;
  stok_category?: string;
}

export interface IStokOpnamePayload {
  sku: string;
  qty_system: number;
  qty_actual: number;
  harga_per_unit: number;
  total_valuasi_aktual: number;
  total_valuasi_selisih: number;
  notes?: string;
}
