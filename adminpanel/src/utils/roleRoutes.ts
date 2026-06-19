import type { User } from '../services/api';

export function getRoleHome(role: User['role'], cashierMode = false): string {
  if (cashierMode && (role === 'employee' || role === 'chief')) {
    return '/cashier/pos';
  }
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

export function isCashierEligible(role: User['role']): boolean {
  return role === 'employee' || role === 'chief';
}
