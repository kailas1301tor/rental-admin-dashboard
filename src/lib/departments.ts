import type { Department } from '@/types';

export function departmentLabel(
  id: string | null | undefined,
  departments?: Department[],
): string {
  if (!id) return '—';
  const match = departments?.find((d) => d.id === id);
  return match?.name ?? id;
}

export function adminTierLabel(tier: string): string {
  switch (tier) {
    case 'super_admin':
      return 'Super Admin';
    case 'general_admin':
      return 'General Admin';
    case 'department_admin':
      return 'Department Admin (HOD)';
    default:
      return tier;
  }
}
