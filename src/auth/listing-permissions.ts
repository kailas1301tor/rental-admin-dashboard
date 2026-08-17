import type { PermissionLevel } from '@/types/permissions';

export function maxPermissionLevel(
  ...levels: Array<PermissionLevel | undefined>
): PermissionLevel | undefined {
  if (levels.includes('manage')) return 'manage';
  if (levels.includes('view')) return 'view';
  return undefined;
}
