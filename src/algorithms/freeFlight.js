let latLongCoordinates = [];
let distanceTable = [];



async function freeFlightDetection() {
    setStartTime();
    switch (freeFlightAlgorithm.value) {

        case "Complete Search":

            await resetParameters();
            await setParameter();
            await setFreeFlight();
            return await getFreeFlightResult(await getLongestPath());
            break;

        case "fast search":

            await resetParameters();
            await setOptimizedParameter();
            await setFreeFlight();
            return await getFreeFlightResult(await getOptimalPath());
            break;

    }
}


/**
 * returns the result object
 * @param freeFlight
 * @returns {Promise<{flightScore: number, startP, distanceBetweenPoints: number[], endP, type: string, totalDistance: number, waypoints: *[], points: ([]|[*, *, *, *, *]|*[]|SVGPointList|*)}>}
 */
async function getFreeFlightResult(freeFlight){

    let result = {
        type: "Free Flight",
        startpoint : freeFlight.points[0],
        endpoint : freeFlight.points[freeFlight.points.length-1],
        waypoints: freeFlight.points.slice(1, freeFlight.points.length-1),
        totalDistance: await getTotalDist(freeFlight.points),
        flightScore: await getFlightScore(await getTotalDist(freeFlight.points), freeFlightScore),
        distanceBetweenPoints: await getAllDistancesBetweenPoints(freeFlight.points),
        points: freeFlight.points
    };
    console.log(result);
    return result;

}


/**
 * get neighbour points and search for a better flight
 * @returns {Promise<{flightScore: number, indices: *[], startP: *, distanceBetweenPoints: number[], endP: *, type: string, totalDistance: number, waypoints: *[], points: *[]}|*>}
 */
async function getOptimalPath() {

    let flight = await getLongestPath();
    if(optRadius==0) return flight;
    await resetParameters();
    latLongCoordinates = await getNeighbourPoints(flight.indices);
    await initDistanceTable();
    await setFreeFlight();
    if ( flight.totalDistance < (await getLongestPath()).totalDistance) return await getOptimalPath();
    return flight;

}

/**
 * set freeFlightOptimizeFactor, optimized latLongCoordinates and the distance Table
 */
async function setOptimizedParameter () {

    optRadius = 0;
    latLongCoordinates = await getOptimizedLatLongs(freeFlightMaxSearchpoints);
    await initDistanceTable();

}


/**
 * get all local tracklogs from the flight
 * @param {number[]} points indexes of the freeflight points
 * @returns {Promise<number[]>} array of new local points
 */
async function getNeighbourPoints (points) {
    let neighbourPoints = [];
    for ( let pointIndex = 0; pointIndex < points.length; pointIndex++ ){
        for ( let latlongIndex = 0; latlongIndex < latLong.length; latlongIndex++ ) {
           if(distance(points[pointIndex], latlongIndex)<=optRadius) neighbourPoints.push(latlongIndex);
        }
    }
    return await sort(await removeDuplicates(neighbourPoints));

}

async  function setFreeFlight() {

    let candSearchStart = window.performance.now();
    for (let currentWaypoint = 0; currentWaypoint <= freeFlightWaypoints; currentWaypoint++ ){
        if ( getCurrentRuntimeMilliseconds() > domUpdateInterval*count ) {
            await domUpdate();
            count++;}
        await createAllFreeFlights(currentWaypoint);
        runtime +=(window.performance.now() - candSearchStart)/1000;
    }

}



/**
 * calculates the longest freeFlight with #waypoints
 * @param {number} waypoints
 */
async function createAllFreeFlights ( waypoints ) {

    for ( let latlongIndex = 0; latlongIndex < latLongCoordinates.length; latlongIndex++ ) {
        if ( getCurrentRuntimeMilliseconds() > domUpdateInterval*count ) {
            await domUpdate();
            count++;
        }
        let maxDistance = 0;
        let predecessor = "null";
        let tempDistance = -1;
        for ( let j = 0; j < latlongIndex; j++ ) {
            if ( waypoints == 0 )   tempDistance = distance(latLongCoordinates[latlongIndex],latLongCoordinates[j]);
            if ( waypoints != 0 )   tempDistance = distance(latLongCoordinates[latlongIndex],latLongCoordinates[j]) + distanceTable[waypoints-1][j][1];
            if (maxDistance < tempDistance) {
                maxDistance = tempDistance;
                predecessor = j;
            }
        }
        if ( maxDistance != 0 ) await updateTable(waypoints, latlongIndex, predecessor, maxDistance );
    }

}


async function updateTable( waypoints, latlongIndex, predecessor, maxDistance ) {

    distanceTable[waypoints][latlongIndex][0] = predecessor;
    distanceTable[waypoints][latlongIndex][1] = maxDistance;

}


/**
 * for every waypoint create a table which is stored in distTable, starting with zero waypoints
 * a table contains entrys for every latlong with currently data = (predecessor, distance)
 * distTable[i] contains a table for free flights with i waypoints
 */
async function initDistanceTable() {

    for (let currentWaypoint = 0; currentWaypoint <= freeFlightWaypoints; currentWaypoint++ ){
        let table = [];
        for ( let latlongIndex = 0 ; latlongIndex < latLongCoordinates.length; latlongIndex++ ) {
            let data = [0, "null"];
            table.push(data);
        }
        distanceTable[currentWaypoint] = table;
    }

}


async function getLongestPath () {

    let endPoint =  await getEndpoint(freeFlightWaypoints);
    let wayPoints = await getWaypoints(endPoint, freeFlightWaypoints);
    let startPoint = await getStartpoint(freeFlightWaypoints, endPoint, wayPoints);
    let points = await getAllPoints(startPoint, wayPoints, endPoint);
    let freeFlight = {
        totalDistance: await getTotalDist(points),
        points: points,
        indices: await getAllIndices (startPoint, wayPoints, endPoint)
    };

    return freeFlight;

}

/**
 * combines all given points and returns them as coordinates in an array
 * @param {number} startPoint index of the startpoint
 * @param {number[]} wayPoints index of the waypoints
 * @param {number} endPoint index of the endpoint
 * @returns {Promise<Number[]>} array with the coordinates
 */
async function getAllPoints ( startPoint, wayPoints, endPoint ) {

    let points = [];
    points.push(latLongCoordinates[startPoint]);
    for ( let wayPoint = 0; wayPoint < wayPoints.length; wayPoint++ ){
        points.push(latLongCoordinates[wayPoints[wayPoint]]);
    }
    points.push(latLongCoordinates[endPoint]);
    return getLatlong(points);

}

async function getAllIndices ( startPoint, wayPoints, endPoint ) {

    let indices = [];
    indices.push(latLongCoordinates[startPoint]);
    for ( let wayPoint = 0; wayPoint < wayPoints.length; wayPoint++ ){
        indices.push(latLongCoordinates[wayPoints[wayPoint]]);
    }
    indices.push(latLongCoordinates[endPoint]);
    return indices;

}

/**
 * calculates the single distances between the given points
 * @param {number[]} points Coordinates - with lat and long
 * @returns {Promise<number[]>} distances between the points
 */
async function getAllDistancesBetweenPoints ( points ) {

    let distances = [];
    for ( let point = 0; point < points.length-1; point++ ) {
        distances.push(distanceBetweenCoordinates(points[point], points[point+1]));
    }
    return distances;

}

/**
 * calculates the score of the flight
 * @param {number} distance total distance in km
 * @param {number} scoringFactor
 * @returns {Promise<number>} scoring
 */
async function getFlightScore ( distance, scoringFactor ) {

    return distance * scoringFactor;

}

/**
 * gets the index of the endpoint
 * @param {number} waypoints number of waypoints
 * @returns {Promise<number>} index of the endpoint
 */
async function getEndpoint ( waypoints ) {

    let endpoint;
    let maxDistance = 0;
    for ( let i = 0; i < distanceTable[waypoints].length; i++ ) {
        if ( distanceTable[waypoints][i][1] > maxDistance ) {
            maxDistance = distanceTable[waypoints][i][1];
            endpoint = i;
        }
    }
    return endpoint;

}

/**
 * gets the index of the waypoints
 * @param {number} endpoint index of the endpoint
 * @param {number} amountOfWaypoints number of waypoints
 * @returns {Promise<*[]>} array with the index of the waypoints
 */
async function getWaypoints ( endpoint , amountOfWaypoints, ) {

    let waypoints = [];
    let successor = endpoint;
    for ( let waypoint = amountOfWaypoints; waypoint > 0 ; waypoint-- ) {
        waypoints[waypoint-1] = distanceTable[waypoint][successor][0];
        successor = waypoints[waypoint-1];
    }
    return waypoints;

}


/**
 * gets the latlong coordinates
 * @param {number[]} points the index of the coordinates
 * @returns {Promise<*[]>} the coordinates
 */
async function getLatlong ( points ) {

    let latlongs = [];
    for ( let index = 0; index < points.length; index++ ) {
        latlongs[index] = latLong[points[index]];
    }
    return latlongs;

}

/**
 * gets the index of the startpoint
 * @param {number} amountOfWaypoints the number of turnpoints
 * @param {number} endPoint the index of the endpoint
 * @param {number[]} waypoints the index of the waypoints
 * @returns {Promise<*>} the index of the startpoint
 */
async function getStartpoint ( amountOfWaypoints, endPoint, waypoints) {

    if ( amountOfWaypoints == 0) return  distanceTable[0][endPoint][0];
    if ( amountOfWaypoints != 0) return distanceTable[0][waypoints[0]][0];

}

/**
 * calculates the total distance between the given points
 * @param {number[]}points latlong coordinates of the given points
 * @returns {Promise<number>} total distance between the points
 */
async function getTotalDist ( points) {

    let distance = 0;
    for ( let point = 0; point < points.length-1; point++ ) {
        distance = distance + distanceBetweenCoordinates(points[point], points[point+1]);
    }
    return distance;

}

async function resetParameters() {
    runtime = 0;
    count = 0;
    latLongCoordinates.length = 0;
    distanceTable.length = 0;

}


async function removeDuplicates ( points ) {

    return points.filter((value,index) => points.indexOf(value)===index);

}


async function sort(points){

    return points.sort(function(a, b){return a - b});

}



async function setParameter () {
    for ( let latlong = 0; latlong < latLong.length; latlong++ ){
        latLongCoordinates.push(latlong);
    }
    await initDistanceTable();

}