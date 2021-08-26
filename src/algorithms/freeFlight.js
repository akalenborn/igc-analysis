let latLongCoordinates = [];
let distanceTable =[];
let freeFlightOptimizeFactor;

async function freeFlightDetection() {
    setStartTime();
    runtime = 0;

    switch (freeFlightAlgorithm.value) {
        case "optimal":

            await resetParameters();
            await setParameter();
            await getFreeFlight();
            return await getLongestPath();
            break;

        case "fast search":

            await resetParameters();
            await setOptimizedParameter();
            await getFreeFlight();
            return await getOptimalPath();
            break;

    }
}


/**
 * get neighbour points and search for a better flight
 * @returns {Promise<{flightScore: number, indices: *[], startP: *, distanceBetweenPoints: number[], endP: *, type: string, totalDistance: number, waypoints: *[], points: *[]}|*>}
 */
async function getOptimalPath() {


    let flight = await getLongestPath();
    if(freeFlightOptimizeFactor==1) return flight;
    await resetParameters();
    latLongCoordinates = await getNeighbourPoints(flight.indices);
    await initDistanceTable();
    await getFreeFlight();
    if (flight.totalDistance < (await getLongestPath()).totalDistance) return await getOptimalPath();
    return flight;

}

/**
 * set freeFlightOptimizeFactor, optimized latLongCoordinates and the distance Table
 */
async function setOptimizedParameter () {

    freeFlightOptimizeFactor = Math.ceil(latLong.length/(Math.min(freeFlightMaxSearchpoints, latLong.length)));
    for ( let latlongIndex = 0; latlongIndex < latLong.length; latlongIndex = latlongIndex + freeFlightOptimizeFactor) {
        latLongCoordinates.push(latlongIndex);
    }
    await initDistanceTable();

}


async function getSkippedPoints(){

    return freeFlightOptimizeFactor*2;

}


/**
 * get all local points from the flight
 * @param points indexes of the freeflight points
 * @returns {Promise<number[]>} array of new local points
 */
async function getNeighbourPoints (points) {

    let puffer =  await getSkippedPoints();
    let neighbourPoints = [];
    for ( let pointIndex = 0; pointIndex < points.length; pointIndex++ ){
        // check if point has index 0
        let latlongIndex = points[pointIndex] -puffer;
        if (latlongIndex<=0) latlongIndex=0;
        for ( latlongIndex;
              latlongIndex <= (points[pointIndex] +puffer ) && latlongIndex >=0 && latlongIndex < latLong.length;
              latlongIndex++) {
            neighbourPoints.push(latlongIndex);
        }
    }



    return await sort(await removeDuplicates(neighbourPoints));


}

async  function getFreeFlight() {
    let candSearchStart = window.performance.now();
    for (let currentTurnpoint = 0; currentTurnpoint <= freeFlightTurnpoints; currentTurnpoint++ ){
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval*count){
            await domUpdate();
        }
        await createAllFreeFlights(currentTurnpoint);
        runtime +=(window.performance.now() - candSearchStart)/1000;
    }

}


// calculates the longest freeFlight with #turnpoints.
async function createAllFreeFlights ( turnpoints ) {

    for (let latlongIndex =0; latlongIndex < latLongCoordinates.length; latlongIndex++) {
        let maxDistance = 0;
        let predecessor = "null";
        let tempDistance = -1;
        for ( let j = 0; j<latlongIndex; j++ ) {
            if ( turnpoints == 0 )   tempDistance= distance(latLongCoordinates[latlongIndex],latLongCoordinates[j]);
            if ( turnpoints != 0 )   tempDistance= distance(latLongCoordinates[latlongIndex],latLongCoordinates[j]) + distanceTable[turnpoints-1][j][1];
            if (maxDistance < tempDistance) {
                maxDistance = tempDistance;
                predecessor = j;
            }
        }
        if (maxDistance != 0) {
            await updateTable(turnpoints, latlongIndex, predecessor, maxDistance );
        }
    }

}


// update distTable with predecessor and maxDistance
async function updateTable(turnpoints, latlongIndex, predecessor, maxDistance ) {

    distanceTable[turnpoints][latlongIndex][0] = predecessor;
    distanceTable[turnpoints][latlongIndex][1] = maxDistance;

}


/**
 * for every Turnpoint create a table which is stored in distTable, starting with zero turnpoints
 * a table contains entrys for every latlong with currently data = (predecessor, distance)
 * distTable[i] contains a table for free flights with i turnpoints
 */
async function initDistanceTable() {

    for (let currentTurnpoint = 0; currentTurnpoint <= freeFlightTurnpoints; currentTurnpoint++){
        let table = [];
        for ( let latlongIndex = 0 ; latlongIndex < latLongCoordinates.length; latlongIndex++) {
            let data = [0, "null"];
            table.push(data);
        }
        distanceTable[currentTurnpoint]= table;
    }

}


// get the longest Path from distTable with given turnpoints
async function getLongestPath () {

    let endPoint =  await getEndpoint(freeFlightTurnpoints);
    let wayPoints = await getWaypoints(endPoint, freeFlightTurnpoints);
    let startPoint = await getStartpoint(freeFlightTurnpoints, endPoint, wayPoints);
    let points = await getAllPoints( startPoint, wayPoints, endPoint );
    let freeFlight ={
        type: "Free Flight",
        startP : latLongCoordinates[startPoint],
        endP : latLongCoordinates[endPoint],
        waypoints: await getLatlong(wayPoints),
        totalDistance: await getTotalDist(points),
        flightScore: await getFlightScore(await getTotalDist(points), freeFlightScore),
        distanceBetweenPoints: await getAllDistancesBetweenPoints(points),
        points: points,
        indices: await getAllIndices ( startPoint, wayPoints, endPoint )
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
    points.push(latLongCoordinates[startPoint]);
    for ( let wayPoint = 0; wayPoint < wayPoints.length; wayPoint++ ){
        points.push(latLongCoordinates[wayPoints[wayPoint]]);
    }
    points.push(latLongCoordinates[endPoint]);
    return getLatlong(points);

}

async function getAllIndices (startPoint, wayPoints, endPoint) {

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
    for ( let i = 0; i < distanceTable[turnpoints].length; i++ ) {
        if ( distanceTable[turnpoints][i][1] > maxDistance ) {
            maxDistance = distanceTable[turnpoints][i][1];
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

        waypoints[turnpoint-1] = distanceTable[turnpoint][successor][0];
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

    if ( turnpoints == 0) return  distanceTable[0][endPoint][0];
    if ( turnpoints != 0) return distanceTable[0][waypoints[0]][0];

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

async function resetParameters() {

    latLongCoordinates.length = 0;
    distanceTable.length = 0;

}


async function removeDuplicates (points) {

    return points.filter((value,index) => points.indexOf(value)===index);

}


async function sort(points){

    return points.sort(function(a, b){return a - b});

}



async function setParameter () {

    for (let latlong = 0; latlong < latLong.length; latlong++ ){
        latLongCoordinates.push(latlong);
    }
    await initDistanceTable();

}