import React, { useCallback, useMemo, useState } from 'react';
import Immutable from 'immutable';
import pluralize from 'pluralize';
import { useTranslation } from 'react-i18next';
import * as jp from 'jsonpath';

import { ResourceForm } from 'shared/ResourceForm';
import { useMicrofrontendContext } from 'shared/contexts/MicrofrontendContext';
import { useNotification } from 'shared/contexts/NotificationContext';
import { Spinner } from 'shared/components/Spinner/Spinner';
import { useGetSchema } from 'hooks/useGetSchema';
import { prettifyKind } from 'shared/utils/helpers';

import { ResourceSchema } from './ResourceSchema';
import { createTemplate } from './helpers';
import { VarStoreContextProvider } from './contexts/VarStore';
import { prepareSchemaRules } from './helpers/prepareSchemaRules';
import {
  getResourceObjFromUIStore,
  getUIStoreFromResourceObj,
} from './helpers/immutableConverter';

export function ExtensibilityCreate({
  formElementRef,
  setCustomValid,
  resourceType,
  resourceUrl,
  resource: initialResource,
  resourceSchema: createResource,
  toggleFormFn,
  resourceName,
}) {
  const { namespaceId: namespace } = useMicrofrontendContext();
  const notification = useNotification();
  const { t } = useTranslation();
  const general = createResource?.general;
  const api = general?.resource || {};

  const [store, setStore] = useState(
    getUIStoreFromResourceObj(
      initialResource ||
        createResource?.template ||
        createTemplate(api, namespace, general?.scope),
    ),
  );

  const resource = useMemo(() => getResourceObjFromUIStore(store), [store]);

  const updateUIStore = res =>
    setStore(prevStore => prevStore.set('values', Immutable.fromJS(res)));

  const afterCreatedFn = async defaultAfterCreatedFn => {
    if (createResource?.details) {
      defaultAfterCreatedFn();
    } else {
      notification.notifySuccess({
        content: t(
          initialResource
            ? 'common.create-form.messages.patch-success'
            : 'common.create-form.messages.create-success',
          {
            resourceType: resourceName,
          },
        ),
      });
    }
    toggleFormFn(false);
  };

  const {
    schema,
    error: errorOpenApi,
    loading: loadingOpenAPISchema,
  } = useGetSchema({
    resource: api,
  });

  const { simpleRules, advancedRules } = useMemo(() => {
    const fullSchemaRules = [
      { path: 'metadata.name', simple: true },
      { path: 'metadata.labels' },
      { path: 'metadata.annotations' },
      ...(createResource?.form ?? []),
    ];

    return {
      simpleRules: prepareSchemaRules(
        fullSchemaRules.filter(item => item.simple ?? false),
      ),
      advancedRules: prepareSchemaRules(
        fullSchemaRules.filter(item => item.advanced ?? true),
      ),
    };
  }, [createResource]);

  const handleNameChange = useCallback(
    resourceName => {
      const resource = getResourceObjFromUIStore(store);
      jp.value(resource, '$.metadata.name', resourceName);
      jp.value(
        resource,
        "$.metadata.labels['app.kubernetes.io/name']",
        resourceName,
      );
      setStore(prevStore =>
        prevStore.set('values', Immutable.fromJS(resource)),
      );
    },
    [store, setStore],
  );

  if (loadingOpenAPISchema) return <Spinner />;

  return (
    <VarStoreContextProvider>
      <ResourceForm
        pluralKind={resourceType}
        singularName={pluralize(resourceName || prettifyKind(resource.kind), 1)}
        resource={resource}
        setResource={updateUIStore}
        formElementRef={formElementRef}
        createUrl={resourceUrl}
        setCustomValid={setCustomValid}
        onlyYaml={!schema}
        initialResource={initialResource}
        afterCreatedFn={afterCreatedFn}
        handleNameChange={handleNameChange}
      >
        <ResourceSchema
          simple
          key={api.version}
          schema={errorOpenApi ? {} : schema}
          schemaRules={simpleRules}
          resource={resource}
          store={store}
          setStore={setStore}
          onSubmit={() => {}}
          path={general?.urlPath || ''}
        />
        <ResourceSchema
          advanced
          key={api.version}
          schema={errorOpenApi ? {} : schema}
          schemaRules={advancedRules}
          resource={resource}
          store={store}
          setStore={setStore}
          path={general?.urlPath || ''}
        />
      </ResourceForm>
    </VarStoreContextProvider>
  );
}

ExtensibilityCreate.allowEdit = true;
