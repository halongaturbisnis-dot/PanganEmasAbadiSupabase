/**
 * Link Service
 * Service for handling external links and fetching dynamic configurations.
 */

const SHEET_ID = '1pA0YojPfPzJYiqPf3-aSNaqyHwKn1-eT9fXAkGAb0AA';
const SHEET_NAME = 'Master Link';
const FALLBACK_LINK = 'https://maindi.id';

export const linkService = {
  /**
   * Opens an external URL in a new tab with security best practices.
   */
  openExternal: (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Opens media content ensuring correct tab handling.
   */
  openMedia: (url: string) => {
    window.open(url, '_blank');
  },

  /**
   * Fetches the dynamic link from B2 cell of Master Link spreadsheet.
   * Using CSV export format for public spreadsheet access without API Key.
   */
  fetchDynamicFooterLink: async (): Promise<string> => {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch spreadsheet');
      
      const csvContent = await response.text();
      const rows = csvContent.split('\n');
      if (rows.length < 2) return FALLBACK_LINK;
      
      const secondRow = rows[1];
      const columns = secondRow.split(',').map(col => col.replace(/^"|"$/g, '').trim());
      
      if (columns.length < 2) return FALLBACK_LINK;
      
      const link = columns[1];
      if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
        return link;
      }
      
      return FALLBACK_LINK;
    } catch (error) {
      console.error('Error fetching dynamic link:', error);
      return FALLBACK_LINK;
    }
  }
};
