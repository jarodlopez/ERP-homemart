export type UserRole = 'admin' | 'seller' | 'warehouse';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions: {
    canManageInventory: boolean;
    canViewReports: boolean;
    canSell: boolean;
  };
  createdAt: Date;
}
