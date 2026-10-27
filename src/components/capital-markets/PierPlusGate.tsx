import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isPierPlus } from '../../lib/membership';
import { UpgradePrompt } from './UpgradePrompt';

export function PierPlusGate({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const { user } = useAuth();

  if (!isPierPlus(user)) {
    return <UpgradePrompt variant="page" title={title} description={description} />;
  }

  return <>{children}</>;
}
