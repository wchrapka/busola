import { loadBalancer } from 'components/Extensibility/tempRes/loadBalancer';
import { connectionPool } from 'components/Extensibility/tempRes/connectionPool';
import { outlierDetection } from 'components/Extensibility/tempRes/outlierDetection';
import { tls } from 'components/Extensibility/tempRes/tls';
import { portLevelSettings } from 'components/Extensibility/tempRes/portLevelSettings';
import { tunnel } from 'components/Extensibility/tempRes/tunnel';

export const trafficPolicy = prefix => ({
  source: prefix + 'trafficPolicy',
  name: 'Traffic Policy',
  visibility: '$exists($.data)',
  widget: 'Panel',
  children: [
    loadBalancer('$parent.'),
    connectionPool('$parent.'),
    outlierDetection('$parent.'),
    tls('$parent.'),
    portLevelSettings('$parent.'),
    tunnel('$parent.'),
  ],
});
