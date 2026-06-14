import { dbClient } from '../libs/database';
import { errorService } from './errorService';
import { ICustomer } from '../types/ITs_Customer';

export interface CustomerReportData {
  purchasedCustomers: (ICustomer & { total_trx: number })[];
  pipelineCustomers: ICustomer[];
  topFrequency: { name: string; freq: number }[];
  topNominal: { name: string; total_nominal: number }[];
}

export const laporanCustomerService = {
  /**
   * Get all customer report data
   */
  async getCustomerReport(): Promise<CustomerReportData | null> {
    try {
      
      // 1. Customers with at least 1 purchase
      const sqlPurchased = `
        SELECT c.*, COUNT(p.id) as total_trx 
        FROM customer c 
        JOIN penjualan p ON c.id = p.customer_id 
        WHERE p.approval_status = 'Approved' 
        GROUP BY c.id 
        HAVING total_trx >= 1
        ORDER BY total_trx DESC
      `;

      // 2. Customers with 0 purchases (Pipeline) - Pipeline usually shouldn't be date filtered as it's a current state, 
      // but if we want to see who WAS in pipeline during that period? No, let's keep pipeline as lifetime/current.
      const sqlPipeline = `
        SELECT c.* 
        FROM customer c 
        LEFT JOIN penjualan p ON c.id = p.customer_id AND p.approval_status = 'Approved' 
        WHERE p.id IS NULL
        ORDER BY c.name ASC
      `;

      // 3. Top 5 frequency
      const sqlTopFreq = `
        SELECT c.name, COUNT(p.id) as freq 
        FROM customer c 
        JOIN penjualan p ON c.id = p.customer_id 
        WHERE p.approval_status = 'Approved' 
        GROUP BY c.id 
        ORDER BY freq DESC 
        LIMIT 5
      `;

      // 4. Top 5 nominal (production price only)
      const sqlTopNominal = `
        SELECT c.name, SUM(p.sum_product_price) as total_nominal 
        FROM customer c 
        JOIN penjualan p ON c.id = p.customer_id 
        WHERE p.approval_status = 'Approved' 
        GROUP BY c.id 
        ORDER BY total_nominal DESC 
        LIMIT 5
      `;

      const [purchasedRes, pipelineRes, topFreqRes, topNominalRes] = await Promise.all([
        dbClient.query(sqlPurchased),
        dbClient.query(sqlPipeline),
        dbClient.query(sqlTopFreq),
        dbClient.query(sqlTopNominal)
      ]);

      return {
        purchasedCustomers: purchasedRes.rows as unknown as (ICustomer & { total_trx: number })[],
        pipelineCustomers: pipelineRes.rows as unknown as ICustomer[],
        topFrequency: topFreqRes.rows as unknown as { name: string; freq: number }[],
        topNominal: topNominalRes.rows as unknown as { name: string; total_nominal: number }[]
      };
    } catch (error) {
      errorService.handle(error);
      return null;
    }
  }
};
