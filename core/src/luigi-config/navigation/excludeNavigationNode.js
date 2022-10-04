import { doesResourceExist, doesUserHavePermission } from './permissions';

export const excludeNavigationNode = (node, permissionSet) => {
  if (dependsOnConfigFeatures(node)) {
    if (isARequiredFeatureDisabled(node)) {
      markNavNodeToBeDeleted(node);
    }
  }
  if (dependsOnOtherResource(node)) {
    //used only for the Custom Resources node
    if (isParentResourceDisallowed(node, permissionSet)) {
      markNavNodeToBeDeleted(node);
    }
  }
  if (hasCompleteInformation(node)) {
    if (isResourceDisallowed(node, permissionSet)) {
      markNavNodeToBeDeleted(node);
    }
  }
};

const isParentResourceDisallowed = (node, permissionSet) => {
  const { group, resource } = node.context.requiredGroupResource;

  const doesExist = doesResourceExist({
    resourceGroup: group,
    resourceKind: resource,
  });
  const isPermitted = doesUserHavePermission(
    ['get', 'list'],
    { resourceGroup: group, resourceKind: resource },
    permissionSet,
  );

  return !doesExist || !isPermitted;
};

const tryGetResourceApiPath = viewUrl => {
  try {
    return new URL(viewUrl).searchParams.get('resourceApiPath');
  } catch (_) {
    return null;
  }
};

const isResourceDisallowed = (node, permissionSet) => {
  const apiPath = tryGetResourceApiPath(node.viewUrl);
  if (!apiPath) {
    return false;
  }

  const resourceGroup = apiPath.replace(/^\/apis?\//, '');

  const doesExist = doesResourceExist({
    resourceGroup,
    resourceKind: node.resourceType,
  });
  const isPermitted = doesUserHavePermission(
    ['get', 'list'],
    { resourceGroup, resourceKind: node.resourceType },
    permissionSet,
  );

  return !doesExist || !isPermitted;
};

const markNavNodeToBeDeleted = node => {
  node.toDelete = true;
  return node;
};

const dependsOnConfigFeatures = node =>
  Array.isArray(node.context?.requiredFeatures) &&
  node.context.requiredFeatures.length;

const isARequiredFeatureDisabled = node =>
  !!node.context.requiredFeatures.find(
    configFeature => !configFeature || configFeature.isEnabled === false,
  );

const dependsOnOtherResource = node =>
  typeof node.context?.requiredGroupResource === 'object';

const hasCompleteInformation = node => {
  if (typeof node.viewUrl === 'string') {
    const apiPath = new URL(node.viewUrl || '').searchParams.get(
      'resourceApiPath',
    );

    return apiPath && node.resourceType;
  }
  return false;
};
