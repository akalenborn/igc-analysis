function createMapControl(elementName) {
    'use strict';

    let map;
    let layersControl;
    let mapLayers;
    let timePositionMarker;
    let planeIcon;
    let layerGroups;
    let layerGroup;
    let trackLatLong = [];

    createMap();

    function createMap() {
        if (map) map.remove();
        map = L.map(elementName, {gestureHandling: false});
        const attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>';
        mapLayers = {
            positron: L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                attribution: attribution,
                maxZoom: 18
            }),

            darkMatter: L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
                attribution: attribution,
                maxZoom: 18
            }),

            openStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
            }),

            toner: L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 18
            }),

            watercolor: L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.',
                maxZoom: 18
            }),
            terrain: L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', {
                attribution: 'Map tiles by <a href="https://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
                maxZoom: 18
            })
        };

        layersControl = L.control.layers({
            'OpenStreetMap': mapLayers.openStreetMap,
            'Carto Positron': mapLayers.positron,
            'Carto Dark Matter': mapLayers.darkMatter,
            'Stamen Toner': mapLayers.toner,
            'Stamen Watercolor': mapLayers.watercolor,
            'Stamen Terrain': mapLayers.terrain
        });

        mapLayers.openStreetMap.addTo(map);
        layersControl.addTo(map);

        L.AwesomeMarkers.Icon.prototype.options.prefix = 'fa';
        planeIcon = L.AwesomeMarkers.icon({
            icon: 'plane',
            iconColor: 'white',
            markerColor: 'red'
        });
        layerGroups = {};
        layerGroup = L.layerGroup().addTo(map);


        return map;
    }

    // Private methods for drawing turn point sectors and start / finish lines

    function getLine(pt1, pt2, lineRad, drawOptions) {
        //returns line through pt1, at right angles to line between pt1 and pt2, length lineRad.
        //Use Pythogoras- accurate enough on this scale
        const latDiff = pt2[0] - pt1[0];
        //need radians for cosine function
        const northMean = (pt1[0] + pt2[0]) * Math.PI / 360;
        const startRads = pt1[0] * Math.PI / 180;
        const longDiff = (pt1[1] - pt2[1]) * Math.cos(northMean);
        const hypotenuse = Math.sqrt(latDiff * latDiff + longDiff * longDiff);
        //assume earth is a sphere circumference 40030 Km
        const latDelta = lineRad * longDiff / hypotenuse / 111.1949269;
        const longDelta = lineRad * latDiff / hypotenuse / 111.1949269 / Math.cos(startRads);
        const lineStart = L.latLng(pt1[0] - latDelta, pt1[1] - longDelta);
        const lineEnd = L.latLng(pt1[0] + latDelta, longDelta + pt1[1]);
        const polylinePoints = [lineStart, lineEnd];

        return L.polyline(polylinePoints, drawOptions);
    }

    function getTpSector(centrept, pt1, pt2, sectorRadius, sectorAngle, drawOptions) {
        const headingIn = getBearing(pt1, centrept);
        const bearingOut = getBearing(pt2, centrept);
        let bisector = headingIn + (bearingOut - headingIn) / 2;

        if (Math.abs(bearingOut - headingIn) > 180) {
            bisector = (bisector + 180) % 360;
        }

        let beginAngle = bisector - sectorAngle / 2;

        if (beginAngle < 0) {
            beginAngle += 360;
        }

        const endAngle = (bisector + sectorAngle / 2) % 360;
        const sectorOptions = {...drawOptions, startAngle: beginAngle, stopAngle: endAngle};
        return L.circle(centrept, sectorRadius, sectorOptions);
    }


    return {
        initMap: () => {
            // (re-)initialize the map
            createMap();
        },

        reset: () => {
            // Clear any existing track data so that a new file can be loaded.
            if (mapLayers.track) {
                map.removeLayer(mapLayers.track);
                layersControl.removeLayer(mapLayers.track);
            }

            if (mapLayers.task) {
                map.removeLayer(mapLayers.task);
                layersControl.removeLayer(mapLayers.task);
            }
        },

        clearLayer: layerName => {
            if (layerGroups[layerName] !== undefined) map.removeLayer(layerGroups[layerName]);
            layerGroups[layerName] = undefined;
        },

        clearLayers: () => {
            layerGroup.clearLayers();
        },

        addTrack: latLong => {
            trackLatLong = latLong;
            const trackLine = L.polyline(latLong, {color: 'red', weight: 3});
            timePositionMarker = L.marker(latLong[0], {icon: planeIcon});
            mapLayers.track = L.layerGroup([
                trackLine,
                timePositionMarker
            ]).addTo(map);
            layersControl.addOverlay(mapLayers.track, 'Flight path');

            map.fitBounds(trackLine.getBounds());
        },


        addShape: (latLong, color) => {
            const trackLine = L.polyline(latLong, {color: color, weight: 3});
            mapLayers.track = L.layerGroup([
                trackLine
            ]).addTo(map);
        },

        addTriangle: (triObj, color) => {
            if (layerGroups[triObj.name] === undefined) {
                layerGroups[triObj.name] = L.layerGroup().addTo(map);
            }
            L.polygon([triObj.result.w1, triObj.result.w2, triObj.result.w3], {color: color}).addTo(layerGroups[triObj.name]);
        },

        addFlachesDreieck: (triObj, color ) => {
            if (layerGroups[triObj.name] === undefined) {
                layerGroups[triObj.name] = L.layerGroup().addTo(map);
            }
            L.polygon([triObj.result.points[1], triObj.result.points[2], triObj.result.points[3]], {color: color}).addTo(layerGroups[triObj.name]);
        },

        addLine: (freeFlight, color) => {
            if (layerGroups[freeFlight.name] === undefined) {
                layerGroups[freeFlight.name] = L.layerGroup().addTo(map);
            }
            let firstpolyline = new L.polyline(freeFlight.result.points, {
                color: color,
                weight: 3
            });
            firstpolyline.addTo(layerGroups[freeFlight.name]);
        },


        addTask: (coordinates, names) => {
            //Clearer if we don't show track to and from start line and finish line, as we are going to show lines
            const taskLayers = [L.polyline(coordinates, {color: 'blue', weight: 3})];
            const lineOptions = {
                fillColor: 'green',
                color: 'black',
                weight: 2,
                opacity: 0.8
            };
            const sectorDrawOptions = {
                fillColor: 'green',
                fillOpacity: 0.1,
                color: 'black',
                weight: 1,
                opacity: 0.8
            };
            //definitions from BGA rules
            //defined here as any future changes will be easier
            const startLineRadius = 5;
            const finishLineRadius = 1;
            const tpCircleRadius = 500;
            const tpSectorRadius = 20000;
            const tpSectorAngle = 90;
            let j;
            for (j = 0; j < coordinates.length; j++) {
                taskLayers.push(L.marker(coordinates[j]).bindPopup(names[j]));
                switch (j) {
                    case 0:
                        const startLine = getLine(coordinates[0], coordinates[1], startLineRadius, lineOptions);
                        taskLayers.push(startLine);
                        break;
                    case (coordinates.length - 1):
                        const finishLine = getLine(coordinates[j], coordinates[j - 1], finishLineRadius, lineOptions);
                        taskLayers.push(finishLine);
                        break;
                    default:
                        taskLayers.push(L.circle(coordinates[j], tpCircleRadius, sectorDrawOptions));
                        const tpSector = getTpSector(coordinates[j], coordinates[j - 1],
                            coordinates[j + 1], tpSectorRadius, tpSectorAngle, sectorDrawOptions);
                        taskLayers.push(tpSector);
                }
            }
            mapLayers.task = L.layerGroup(taskLayers).addTo(map);
            layersControl.addOverlay(mapLayers.task, 'Task');
        },

        setTimeMarker: timeIndex => {
            const markerLatLng = trackLatLong[timeIndex];
            if (markerLatLng) {
                timePositionMarker.setLatLng(markerLatLng);

                if (!map.getBounds().contains(markerLatLng)) {
                    map.panTo(markerLatLng);
                }
            }
        },

        addMarker: markerLatLng => {
            L.marker(markerLatLng).addTo(layerGroup);
        },

        addMarkerTo: (layerName, markerLatLng, pointName) => {
            if (layerGroups[layerName] === undefined) {
                layerGroups[layerName] = L.layerGroup().addTo(map);
            }
            if (pointName!=undefined) L.marker(markerLatLng).addTo(layerGroups[layerName])
                .bindPopup(pointName+": "+markerLatLng)
                .openPopup();
            if (pointName==undefined) L.marker(markerLatLng).addTo(layerGroups[layerName]);
        },
    };
}