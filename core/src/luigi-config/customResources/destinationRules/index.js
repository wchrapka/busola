import { trafficPolicyBundle } from './trafficPolicy/trafficPolicyBundle';
import { subsets } from './subsets';

export const destinationRules = {
  details: {
    header: [],
    body: [
      {
        name: 'references',
        widget: 'Panel',
        children: [
          {
            source: 'spec.host',
            type: 'string',
            name: 'Host',
          },
          {
            source: 'spec.exportTo',
            widget: 'JoinedArray',
            separator: ', ',
          },
        ],
      },
      {
        source: 'spec.trafficPolicy',
        name: 'spec.trafficPolicy',
        widget: 'CodeViewer',
        visibility: '$exists($.data)',
      },
      {
        source: 'spec.subset',
        widget: 'CodeViewer',
        visibility: '$exists($.data)',
      },
      {
        source: 'spec.workloadSelector',
        widget: 'CodeViewer',
        visibility: '$exists($.data)',
      },
    ],
  },
  form: [
    {
      simple: true,
      path: 'spec.host',
    },
    {
      widget: 'FormGroup',
      simple: true,
      path: 'spec.trafficPolicy',
      children: trafficPolicyBundle,
    },
    subsets,
    { path: 'spec.exportTo', widget: 'SimpleList' },
    { path: 'spec.workloadSelector', widget: 'KeyValuePair' },
  ],
  general: {
    resource: {
      kind: 'DestinationRule',
      group: 'networking.istio.io',
      version: 'v1beta1',
    },
    name: 'Destination Rules',
    category: 'Istio',
    urlPath: 'destinationrules',
    scope: 'namespace',
    description: 'resource.description',
  },
  list: [
    {
      source: 'spec.host',
      name: 'Host',
    },
  ],
  translations: {
    en: {
      'metadata.annotations': 'Annotations',
      'metadata.labels': 'Labels',
      'metadata.creationTimestamp': 'Created at',
      'resource.description':
        '{{[Destination Rule](https://istio.io/latest/docs/reference/config/networking/destination-rule)}} specifies rules that apply to traffic intended for a service after routing.',
      references: 'References',
      'spec.exportTo': 'Exported To Namespaces',
      'spec.host': 'Host',
      'spec.trafficPolicy': 'Traffic Policy',
      'spec.subsets': 'Subsets',
      'spec.workloadSelector': 'Workload Selector',
    },
  },
};