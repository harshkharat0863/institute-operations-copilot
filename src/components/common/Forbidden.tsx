import React from 'react';
import { ShieldAlert, ArrowLeft, Bot, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

interface ForbiddenProps {
  attemptedScreen?: string;
  onNavigateHome: () => void;
}

export const Forbidden: React.FC<ForbiddenProps> = ({ attemptedScreen = 'Requested Resource', onNavigateHome }) => {
  const { role, user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-5 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>
      
      <div className="inline-flex items-center gap-2 mb-3">
        <Badge variant="danger" dot>HTTP 403 Forbidden</Badge>
        <span className="text-xs text-slate-400">•</span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role-Based Access Control</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        Not Allowed for Your Role
      </h1>
      
      <p className="text-slate-600 max-w-md text-sm mb-6 leading-relaxed">
        Your active security profile <strong className="text-slate-800 capitalize">({role || 'Unknown'})</strong> is not permitted to access{' '}
        <span className="font-semibold text-slate-800">"{attemptedScreen}"</span>. This restriction is enforced client-side and at the API schema view layer.
      </p>

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 mb-8 max-w-md w-full space-y-1.5">
        <div className="flex justify-between">
          <span className="text-slate-400">Authenticated User:</span>
          <span className="font-medium text-slate-800">{user?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Security Clearance:</span>
          <span className="font-mono text-indigo-700 font-semibold uppercase">{role}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Policy:</span>
          <span className="font-mono text-slate-600">Principle of Least Privilege (PoLP)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
