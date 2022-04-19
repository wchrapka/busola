/* eslint-disable no-restricted-globals */

import toJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';
import { Resolver } from '@stoplight/json-ref-resolver';
import Ajv from 'ajv';
import pluralize from 'pluralize';

let JSONSchemas = null;
function createAjv(schema) {
  const ajv = new Ajv({
    formats: {
      int64: 'number',
      int32: 'number',
      'int-or-string': x => typeof x === 'number' || typeof x === 'string',
      'date-time': 'string',
    },
    strictSchema: false, //change to 'log' to see unsupported keywords
  });
  Object.values(schema.result.definitions).forEach(value => {
    if (value['x-kubernetes-group-version-kind']) {
      const { group, kind, version } = value[
        'x-kubernetes-group-version-kind'
      ][0];
      const key = `${group}/${version}/${pluralize(kind)}`;

      //TODO this is to be investigated, there must be a bug in this jsons, ajv cannot parse them
      if (key.startsWith('monitoring.coreos.com/v1alpha1/Alertmanager'))
        return null;

      if (!ajv.getSchema(key)) {
        ajv.addSchema(value, key);
      }
    }
  });
  console.log(ajv);
  return ajv;
}

self.onmessage = $event => {
  if ($event.data[0] === 'shouldInitialize') {
    self.postMessage({
      isInitialized: !!JSONSchemas,
    });
  }
  if ($event.data[0] === 'initialize') {
    new Resolver()
      .resolve($event.data[1])
      .then(resolved => {
        const schema = toJsonSchema(resolved);

        JSONSchemas = createAjv(schema);
        self.postMessage({
          isInitialized: !!JSONSchemas,
        });
      })
      .catch(err => {
        // TODO: notify the app of the error
        console.error(err);
      });
  }
  if ($event.data[0] === 'getSchema') {
    console.log($event.data);
    const schema = JSONSchemas.getSchema($event.data[1])?.schema;
    if (schema) {
      console.log(schema);
      self.postMessage({ [$event.data[1]]: schema });
    }
  }
};