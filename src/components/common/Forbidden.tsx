import React from 'react';
import { ShieldAlert, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { Button } from './Button';

interface ForbiddenProps {
  attemptedScreen?: string;
  onNavigateHome: () => void;
}

export const Forbidden: React.FC<ForbiddenProps> = ({ attemptedScreen = 'Requested Resource', onNavigateHome }) => {
  const { role, user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-12 h-12 rounded-[6px] bg-status-red-bg border border-status-red/20 flex items-center justify-center text-status-red mb-4">
        <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
      </div>

      <div className="inline-flex items-center gap-2 mb-3">
        <Badge variant="danger" dot>403 Forbidden</Badge>
        <span className="text-xs text-text-subtle">•</span>
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Access Control</span>
      </div>

      <h1 className="font-serif text-2xl font-medium text-text tracking-tight mb-2">
        Restricted for Your Role
      </h1>

      <p className="text-text-muted max-w-md text-xs sm:text-sm mb-6 leading-relaxed">
        Your active persona <strong className="text-text capitalize">({role || 'Unknown'})</strong> is not permitted to access{' '}
        <span className="font-medium text-text">"{attemptedScreen}"</span>. This restriction is enforced at the database view and API layer.
      </p>

      <div className="p-3.5 bg-surface rounded-[8px] border border-border text-left text-xs text-text-muted mb-6 max-w-sm w-full space-y-1.5">
        <div className="flex justify-between">
          <span className="text-text-subtle">Authenticated User:</span>
          <span className="font-medium text-text">{user?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-subtle">Persona:</span>
          <span className="font-mono text-accent font-medium uppercase">{role}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-subtle">Policy:</span>
          <span className="font-mono text-text-muted">Least Privilege Enforcement</span>
        </div>
      </div>

      <Button
        variant="primary"
        onClick={onNavigateHome}
        icon={<Home className="w-4 h-4" strokeWidth={1.5} />}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
