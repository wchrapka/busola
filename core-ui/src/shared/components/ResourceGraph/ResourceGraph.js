import React, { useEffect, useState, useLayoutEffect } from 'react';
import { Graphviz } from 'graphviz-react';

import { navigateToResource } from 'shared/hooks/navigate';
import { useMicrofrontendContext } from 'shared/contexts/MicrofrontendContext';
import { useRelatedResources } from 'shared/components/ResourceGraph/useRelatedResources';
import { useIntersectionObserver } from 'shared/hooks/useIntersectionObserver';
import { buildGraph } from 'shared/components/ResourceGraph/buildGraph';
import { Spinner } from 'shared/components/Spinner/Spinner';
import { useMinWidth, TABLET } from 'hooks/useMinWidth';
import { SaveGraphControls } from './SaveGraphControls';

import './ResourceGraph.scss';
import { getStatusBarColor } from 'shared/components/ResourceGraph/setStatusBarColor';

function ResourceGraph({ resource, config }) {
  const { features } = useMicrofrontendContext();
  const [dotSrc, setDotSrc] = useState('');
  const [isReady, setReady] = useState(false);

  const [graphEl, setGraphEl] = useState(null);
  const isTabletOrWider = useMinWidth(TABLET);

  const { hasBeenInView } = useIntersectionObserver(graphEl, {
    skip: !isTabletOrWider,
  });
  const redraw = () => {
    const data = {
      initialResource: resource,
      store: resourcesStore.current,
    };
    setDotSrc(buildGraph(data, config));
  };

  useEffect(() => {
    if (!setReady) return;

    const initEventListeners = () => {
      for (const resourcesOfKind of Object.keys(resourcesStore.current)) {
        for (const res of resourcesStore.current[resourcesOfKind]) {
          const node = document.getElementById(res.metadata.uid);
          if (!node) continue;

          // add status bar
          const nodePosition =
            [...node.children]
              .find(el => {
                return el.nodeName === 'polygon';
              })
              ?.getAttribute('points')
              ?.split(/[,\s]/)
              .map(x => parseFloat(x)) || [];

          if (nodePosition.length) {
            // takes x coordinates from two opposite box vertexes
            const biggestX = Math.max(nodePosition[0], nodePosition[4]);

            // takes y coordinates from two opposite box vertexes
            const y1 = nodePosition[1];
            const y2 = nodePosition[5];
            const smallestY = Math.min(y1, y2);
            const rangeY = Math.max(y1, y2) - smallestY;

            const rect = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'rect',
            );
            rect.setAttribute('x', biggestX.toString());
            rect.setAttribute('y', smallestY.toString());
            rect.setAttribute('width', '5');
            rect.setAttribute('height', rangeY.toString());
            rect.classList.add(
              'resource_status',
              `resource_status_${res.metadata.uid}`,
              getStatusBarColor(res),
            );
            console.log(getStatusBarColor(res));

            node.appendChild(rect);
          }

          if (res.metadata.uid === resource.metadata.uid) {
            node.classList.add('root-node');
          } else {
            node.onclick = () => navigateToResource(res);
          }
        }
      }
    };
    initEventListeners();

    // adding "resource" to dependencies re-adds the status bars that are manually removed to avoid a crush
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, resource, config]);

  useLayoutEffect(() => {
    // manually remove added nodes before re-rendering to avoid the application crush.
    // app crushes because they're added to the DOM directly, and they don't have keys
    return () => {
      const statuses = document.querySelectorAll('.resource_status');
      statuses.forEach(bar => {
        bar.remove();
      });
    };
    //
  }, [resource, config]);

  const [resourcesStore, startedLoading, startLoading] = useRelatedResources({
    resource,
    config,
    events: {
      onRelatedResourcesRefresh: redraw,
      onAllLoaded: a => {
        setReady(true);
      },
    },
  });
  useEffect(() => {
    if (hasBeenInView) {
      startLoading();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBeenInView]);
  if (!features.VISUAL_RESOURCES?.isEnabled) {
    return '';
  }

  return (
    <>
      <div
        ref={node => {
          setGraphEl(node);
        }}
      />
      {startedLoading && dotSrc ? (
        <div id="graph-area">
          <Graphviz
            dot={dotSrc}
            // https://github.com/magjac/d3-graphviz#selection_graphviz
            options={{
              height: '100%',
              width: '100%',
              zoom: isReady, // if always true, then the graph will jump on first pan or zoom
              useWorker: false,
            }}
          />
          <SaveGraphControls
            content={dotSrc}
            // .gv extension is preferred instead of .dot
            name={`${resource.kind} ${resource.metadata.name}.gv`}
          />
        </div>
      ) : (
        <div className="loader">
          <Spinner />
        </div>
      )}
    </>
  );
}

export default ResourceGraph;
