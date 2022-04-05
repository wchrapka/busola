import React, { Suspense } from 'react';

import { useTranslation } from 'react-i18next';
import { useMinWidth, TABLET } from 'hooks/useMinWidth';
import { LayoutPanel } from 'fundamental-react';
import './ResourceGraph.scss';
import { Spinner } from 'shared/components/Spinner/Spinner';
import { ErrorBoundary } from 'shared/components/ErrorBoundary/ErrorBoundary';

// This component is loaded after the page mounts.
// Don't try to load it on scroll. It was tested.
// It doesn't affect the lighthouse score, but it prolongs the graph waiting time.
const ResourceGraph = React.lazy(() =>
  import('../ResourceGraph/ResourceGraph'),
);

function ResourceGraphWrapper({ resourceGraphConfig, resource }) {
  const { t, i18n } = useTranslation(['translation']);

  const isTabletOrWider = useMinWidth(TABLET);

  if (!isTabletOrWider) {
    return null;
  }
  return (
    <LayoutPanel className="fd-margin--md resource-graph">
      <LayoutPanel.Header>
        <LayoutPanel.Head title={t('resource-graph.title')} />
      </LayoutPanel.Header>
      <LayoutPanel.Body>
        {resourceGraphConfig?.[resource.kind] && (
          <Suspense fallback={<Spinner />}>
            <ErrorBoundary
              i18n={i18n}
              customMessage={t('resource-graph.error')}
            >
              <ResourceGraph resource={resource} config={resourceGraphConfig} />
            </ErrorBoundary>
          </Suspense>
        )}
      </LayoutPanel.Body>
    </LayoutPanel>
  );
}

export default ResourceGraphWrapper;
