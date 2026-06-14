/**
 * Sample service demonstrating payload optimization (selecting specific fields)
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Simulated database fetch
const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'editor' },
];

export const userService = {
  /**
   * Optimized fetch: only returns necessary fields for list view
   */
  getUsersList: async (): Promise<Pick<User, 'id' | 'name' | 'role'>[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In real app: SELECT id, name, role FROM users
    return mockUsers.map(({ id, name, role }) => ({ id, name, role }));
  },

  /**
   * Get full user detail
   */
  getUserDetail: async (id: string): Promise<User | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockUsers.find(u => u.id === id);
  }
};
