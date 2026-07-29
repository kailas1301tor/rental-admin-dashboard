import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/auth/AuthContext';
import { useProfile } from '@/auth/ProfileProvider';
import { firstAllowedPath } from '@/auth/permissions';

export function UnauthorizedPage() {
  const { user } = useAuth();
  const { permissions } = useProfile();
  const home = firstAllowedPath(permissions, user) ?? '/login';

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-text-primary">Access denied</h1>
        <p className="mt-2 text-sm text-text-secondary">
          You do not have permission to view this module. Contact a Super Admin
          if you need access.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={home}>
            <Button variant="outline">Go to allowed page</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
