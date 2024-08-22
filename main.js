/*
 * Copyright (c) Flowmap.gl contributors
 * SPDX-License-Identifier: MIT
 *
 * Flowmap.gl: https://github.com/visgl/flowmap.gl
 * Flowmap.gl pure JS example: https://github.com/ilyabo/flowmap.gl-purejs-example
 * Data are in https://github.com/binarybottle/typing-data/.
 * Forked and modified by Arno Klein (binarybottle.com)
 */

import {Deck} from "@deck.gl/core";
import {FlowmapLayer} from "@flowmap.gl/layers";
import {getViewStateForLocations} from "@flowmap.gl/data";
import {csv} from "d3-fetch";
import maplibregl from "maplibre-gl";

const MAPLIBRE_STYLE = "";
  //"https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Typing data
const DATA_PATH = `https://raw.githubusercontent.com/binarybottle/typing-data/main`;
async function fetchData() {
  return await Promise.all([
    csv(`${DATA_PATH}/locations-32keys-staggered.csv`, (row, i) => ({
      id: row.id,
      name: row.name,
      lat: Number(row.lat),
      lon: Number(row.lon),
    })),
    csv(`${DATA_PATH}/key-pair-times-32keys-separate-hands-1way.csv`, (row) => ({
      origin: row.origin,
      dest: row.dest,
      count: Number(row.count),
    })),
  ]).then(([locations, flows]) => ({locations, flows}));
}

fetchData().then((data) => {
  const {locations, flows} = data;
  const [width, height] = [globalThis.innerWidth, globalThis.innerHeight];
  const initialViewState = getViewStateForLocations(
    locations,
    (loc) => [loc.lon, loc.lat],
    [width, height],
    {pad: 0.3}
  );

  const map = new maplibregl.Map({
    container: "map",
    style: MAPLIBRE_STYLE,
    // Note: deck.gl will be in charge of interaction and event handling
    interactive: false,
    center: [initialViewState.longitude, initialViewState.latitude],
    zoom: initialViewState.zoom,
    bearing: initialViewState.bearing,
    pitch: initialViewState.pitch,
  });

  const deck = new Deck({
    canvas: "deck-canvas",
    width: "100%",
    height: "100%",
    initialViewState: initialViewState,
    controller: true,
    map: true,
    onViewStateChange: ({viewState}) => {
      map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch,
      });
    },
    layers: [],
  });

  deck.setProps({
    layers: [
      new FlowmapLayer({
        id: "my-flowmap-layer",
        data: {locations, flows},
        pickable: true,
        getLocationId: (loc) => loc.id,
        getLocationLat: (loc) => loc.lat,
        getLocationLon: (loc) => loc.lon,
        getFlowOriginId: (flow) => flow.origin,
        getFlowDestId: (flow) => flow.dest,
        getFlowMagnitude: (flow) => flow.count,
        getLocationName: (loc) => loc.name,
      }),
    ],
  });
});
