
async function freeFlightDetection() {

    let numberOfTurnpoints = 3;
    let distTable =  await initDistanceTable(numberOfTurnpoints);
    await getFreeFlight(numberOfTurnpoints, distTable);

    return await getLongestPath(distTable, numberOfTurnpoints);
}


async  function getFreeFlight(numberOfTurnpoints, distTable) {
    for (let currentTurnpoint = 0; currentTurnpoint <= numberOfTurnpoints; currentTurnpoint++ ){
        await createAllFreeFlights(currentTurnpoint, distTable);
    }

}


// calculates the longest freeFlight with #turnpoints.
async function createAllFreeFlights ( turnpoints, distTable ) {
    for (let latlongIndex =0; latlongIndex < latLong.length; latlongIndex++) {
        let maxDistance = 0;
        let predecessor = "null";
        let tempDistance = -1;
        for ( let j = 0; j<latlongIndex; j++ ) {
            if ( turnpoints == 0 )   tempDistance= distanceBetweenCoordinates(latLong[latlongIndex],latLong[j]);
            if ( turnpoints != 0 )   tempDistance= distanceBetweenCoordinates(latLong[latlongIndex],latLong[j]) + distTable[turnpoints-1][j][1];
            if (maxDistance < tempDistance) {
                maxDistance = tempDistance;
                predecessor = j;
            }
        }
        if (maxDistance != 0) {
            await updateTable(turnpoints, latlongIndex, predecessor, maxDistance);
        }
    }
}


// update distTable with predecessor and maxDistance
async function updateTable(turnpoints, latlongIndex, predecessor, maxDistance) {
    distTable[turnpoints][latlongIndex][0] = predecessor;
    distTable[turnpoints][latlongIndex][1] = maxDistance;
}


// for every Turnpoint create a table which is stored in distTable, starting with zero turnpoints
// a table contains entrys for every latlong with currently data = (predecessor, distance)
// distTable[0] contains a table for freeFlights with 0 turnpoints
// distTable[1] contains a table for freeFlights with 1 turnpoint
async function initDistanceTable(numberOfTurnpoints) {
    for (let currentTurnpoint = 0; currentTurnpoint <= numberOfTurnpoints; currentTurnpoint++){
        let table = [];
        for ( let latlongIndex = 0 ; latlongIndex < latLong.length; latlongIndex++) {
            let data = [0, "null"];
            table.push(data);
        }
        distTable[currentTurnpoint] = table;
    }
    return distTable;
}


// get the longest Path from distTable with given turnpoints
async function getLongestPath (distTable, turnpoints) {
    let endPoint =  await getEndpoint(turnpoints);
    let wayPoints = await getWaypoints(endPoint, turnpoints);
    let startPoint = await getStartpoint(turnpoints, endPoint, wayPoints);
    let points = await getAllPoints( startPoint, wayPoints, endPoint );
    let freeFlight ={
        type: "Free Flight",
        startP : latLong[startPoint],
        endP : latLong[endPoint],
        waypoints: await getLatlong(wayPoints),
        totalDistance: await getTotalDist(points),
        flightScore: await getFlightScore(await getTotalDist(points), 1.5),
        distanceBetweenPoints: await getAllDistancesBetweenPoints(points),
        points: points
    };

    return freeFlight;

}

/**
 * combines all given points and returns them as coordinates in an array
 * @param {number} startPoint index of the startpoint
 * @param {number[]} wayPoints index of the waypoints
 * @param {number} endPoint index of the endpoint
 * @returns {Promise<*[]>} array with the coordinates
 */
async function getAllPoints ( startPoint, wayPoints, endPoint ) {
    let points = [];
    points.push(startPoint);
    for ( let wayPoint = 0; wayPoint < wayPoints.length; wayPoint++ ){
        points.push(wayPoints[wayPoint]);
    }
    points.push(endPoint);

    return getLatlong(points);
}

/**
 * calculates the single distances between the given points
 * @param {number[]} points Coordinates - with lat and lon
 * @returns {Promise<number[]>} distances betweeen the points
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
 * @param {number} turnpoints number of turnpoints
 * @returns {Promise<number>} index of the endpoint
 */
async function getEndpoint ( turnpoints ) {
    let endpoint;
    let maxDistance = 0;
    for ( let i = 0; i < distTable[turnpoints].length; i++ ) {
        if ( distTable[turnpoints][i][1] > maxDistance ) {
            maxDistance = distTable[turnpoints][i][1];
            endpoint = i;
        }
    }
    return endpoint;
}

/**
 * gets the index of the waypoints
 * @param {number} endpoint index of the endpoint
 * @param {number} turnpoints number of turnpoints
 * @returns {Promise<*[]>} array with the index of the waypoints
 */
async function getWaypoints ( endpoint , turnpoints, ) {
    let waypoints = [];
    let successor = endpoint;
    for ( let turnpoint = turnpoints; turnpoint > 0 ; turnpoint-- ) {

        waypoints[turnpoint-1] = distTable[turnpoint][successor][0];
        successor = waypoints[turnpoint-1];
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
 * @param {number} turnpoints the number of turnpoints
 * @param {number} endPoint the index of the endpoint
 * @param {number[]} waypoints the index of the waypoints
 * @returns {Promise<*>} the index of the startpoint
 */
async function getStartpoint (turnpoints, endPoint, waypoints ) {
    if ( turnpoints == 0) return  distTable[0][endPoint][0];
    if ( turnpoints != 0) return distTable[0][waypoints[0]][0];
}

/**
 * calculates the total distance between the given points
 * @param {number[]}points latlong coordinates of the given points
 * @returns {Promise<number>} total distance between the points
 */
async function getTotalDist (points) {
    let distance = 0;
    for ( let point = 0; point < points.length-1; point++ ) {
        distance = distance + distanceBetweenCoordinates(points[point], points[point+1]);
    }
    return distance;
}
