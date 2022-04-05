import {
  calculatePodState,
  badgeType,
} from 'components/Predefined/Details/Pod/PodStatus';

//may return 'success' 'error' 'none' 'info'

export const getStatusBarColor = resource => {
  switch (resource.kind) {
    case 'Pod':
      return badgeType(calculatePodState(resource).status);
    case 'Deployment':
      const running = resource.status.readyReplicas || 0;
      const expected = resource.status.replicas || 0;
      return running === expected ? 'success' : 'error';
    case 'Job':
    case 'DaemonSets':
    case 'APIRules':
    case 'Functions':
    case 'Oauth':
    case 'PersistentVolumes':
    case 'PersistentVolumesClaims':
    case 'ReplicaSets':
    case 'Subscriptions':
    default:
      return 'none';
  }
};
