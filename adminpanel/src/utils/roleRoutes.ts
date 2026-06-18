import type { User } from '../services/api';

export function getRoleHome(role: User['role']): string {
  switch (role) {
    case 'superAdmin':
      return '/admin/dashboard';
    case 'purchaser':
      return '/purchaser/purchases';
    case 'chief':
      return '/chief/inventory';
    case 'employee':
      return '/employee/pos';
    default:
      return '/signin';
  }
}

export const ROLE_LABELS: Record<User['role'], string> = {
  superAdmin: 'Super Admin',
  purchaser: 'Purchaser',
  chief: 'Chief',
  employee: 'Employee',
};
