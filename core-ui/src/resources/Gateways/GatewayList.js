import React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourcesList } from 'shared/components/ResourcesList/ResourcesList';
import { Link } from 'shared/components/Link/Link';
import { GatewayCreate } from './GatewayCreate';
import { Labels } from 'shared/components/Labels/Labels';
import { Trans } from 'react-i18next';

export function GatewayList(props) {
  const { t } = useTranslation();

  const customColumns = [
    {
      header: t('gateways.selector'),
      value: gateway => (
        <Labels key="selector" labels={gateway.spec.selector} />
      ),
    },
  ];

  const description = (
    <Trans i18nKey="gateways.description">
      <Link
        className="fd-link"
        url="https://istio.io/latest/docs/reference/config/networking/gateway/"
      />
    </Trans>
  );

  return (
    <ResourcesList
      customColumns={customColumns}
      description={description}
      createResourceForm={GatewayCreate}
      {...props}
    />
  );
}

export default GatewayList;
