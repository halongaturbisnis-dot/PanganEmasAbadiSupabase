import { dbClient } from '../libs/database';
import { IInfo } from '../types/ITs_Info';
import { errorService } from './errorService';
import { browserStorage } from '../utils/browserStorage';
import { IAkunSession } from '../types/ITs_Akun';

/**
 * INFO SERVICE
 * Logic backend untuk modul Informasi Perusahaan.
 * Menangani pengambilan dan update data Info.
 */

export const infoService = {
  /**
   * Mengambil session aktif.
   */
  getCurrentSession(): IAkunSession | null {
    return browserStorage.get<IAkunSession>('active_user');
  },

  /**
   * Mengambil data info perusahaan (selalu baris dengan ID '1').
   */
  async getInfo(): Promise<IInfo | null> {
    const sql = `SELECT * FROM info WHERE id = '1' LIMIT 1`;
    try {
      let result = await dbClient.query(sql);
      
      if (result.rows.length === 0) {
          return {
             id: '1',
             alamat: 'Alamat Perusahaan Belum Disetel',
             no_telepon: '-'
          };
      }
      return result.rows[0] as unknown as IInfo;
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  },

  /**
   * Memperbarui data info perusahaan.
   */
  async updateInfo(data: { alamat: string; no_telepon: string }): Promise<IInfo | null> {
    try {
      // 0. Audit - Update
      const session = this.getCurrentSession();
      const updated_by = session ? session.user_id : null;
      const updated_timezone = 'Asia/Jakarta';

      const sql = `UPDATE info SET alamat = ?, no_telepon = ?, updated_by = ?, updated_timezone = ? WHERE id = '1'`;
      await dbClient.query(sql, [data.alamat, data.no_telepon, updated_by, updated_timezone]);
      
      return this.getInfo();
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  }
};
