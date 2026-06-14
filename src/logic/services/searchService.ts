/**
 * SERVICES/SEARCHSERVICE.TS
 * Intelligent Client-Side Search Engine.
 * Supports multi-column searching, relevance sorting, and specific filters.
 */

export interface SearchOptions<T> {
  keys: (keyof T)[];
  threshold?: number; // Minimum match score
  limit?: number;
}

class SearchService {
  /**
   * Performs an intelligent search across a dataset.
   * @param query The string to search for.
   * @param dataset The array of objects to search within.
   * @param options Configuration for searchable keys and behavior.
   */
  search<T>(query: string, dataset: T[], options: SearchOptions<T>): T[] {
    if (!query || query.trim() === '') return dataset;
    
    const normalizedQuery = query.toLowerCase().trim();
    const queryParts = normalizedQuery.split(/\s+/);

    const results = dataset
      .map((item) => {
        let score = 0;
        let matches = 0;

        options.keys.forEach((key) => {
          const value = String(item[key] || '').toLowerCase();
          
          // Exact match bonus
          if (value === normalizedQuery) {
            score += 100;
            matches++;
          }
          // Starts with bonus
          else if (value.startsWith(normalizedQuery)) {
            score += 50;
            matches++;
          }
          // Partial matches
          else {
            queryParts.forEach((part) => {
              if (value.includes(part)) {
                score += 10;
                matches++;
              }
            });
          }
        });

        return { item, score, matches };
      })
      .filter((result) => result.matches > 0 && result.score >= (options.threshold || 0))
      .sort((a, b) => b.score - a.score)
      .map((result) => result.item);

    return options.limit ? results.slice(0, options.limit) : results;
  }
}

export const searchService = new SearchService();
