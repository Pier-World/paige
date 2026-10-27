import { PageFrame } from '../layout/PageFrame';
import { UpgradePrompt } from './UpgradePrompt';

const UPGRADE_DESCRIPTION =
  'Names, terms, contacts, and documents stay with Pier+. Events and Partners remain available on Standard.';

export function AnonymizedDealPreview({
  variant,
}: {
  variant: 'aside' | 'grid' | 'detail';
}) {
  const title =
    variant === 'detail'
      ? 'Opportunity details are included with Pier+'
      : 'Opportunities are included with Pier+';

  if (variant === 'aside') {
    return (
      <section>
        <p className="eyebrow mb-4">Deal Flow</p>
        <UpgradePrompt variant="inline" title={title} description={UPGRADE_DESCRIPTION} />
      </section>
    );
  }

  return (
    <PageFrame>
      <div className="mx-auto max-w-xl">
        <UpgradePrompt variant="inline" title={title} description={UPGRADE_DESCRIPTION} />
      </div>
    </PageFrame>
  );
}
