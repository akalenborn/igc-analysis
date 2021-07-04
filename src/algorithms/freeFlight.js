let optimizedTrackLogs = [];
let distanceTable =[];

async function freeFlightDetection() {

    let numberOfTurnpoints = 3;
    switch (freeFlightAlgorithm.value) {
        case "optimal":
            console.log(latLong.length);
            await initDistanceTable(numberOfTurnpoints);
            await getFreeFlight(numberOfTurnpoints, distanceTable);
            return await getLongestPath(distanceTable, numberOfTurnpoints);
            break;
        case "fast search":
           await  optimizeTrackLogs(20);
           console.log(optimizedTrackLogs);
           await fastInitDistanceTable(numberOfTurnpoints, optimizedTrackLogs);
           await fastGetFreeFlight(numberOfTurnpoints, distanceTable);
           let flight =await getLongestPath(distanceTable, numberOfTurnpoints);
           console.log(flight.indices);
           distanceTable =[];
           optimizedTrackLogs = [];
           await getNeighbourPoints(flight.indices, 20);
           console.log(optimizedTrackLogs);
           await fastInitDistanceTable(numberOfTurnpoints, optimizedTrackLogs );
           await fastGetFreeFlight(numberOfTurnpoints, distanceTable);
           flight= await getLongestPath(distanceTable, numberOfTurnpoints);
           console.log(flight.points);
            distanceTable =[];
            optimizedTrackLogs = [];
            await getNeighbourPoints(flight.indices, 20);
            console.log(optimizedTrackLogs);
            await fastInitDistanceTable(numberOfTurnpoints, optimizedTrackLogs );
            await fastGetFreeFlight(numberOfTurnpoints, distanceTable);
            flight= await getLongestPath(distanceTable, numberOfTurnpoints);
            console.log(flight.points);
           return flight;
           break;
    }
}

//---------------- Fast Search------------------------------------------------------------------------------
async function optimizeTrackLogs (optimizeFactor) {
    for ( let latlongIndex = 0; latlongIndex < latLong.length; latlongIndex = latlongIndex + optimizeFactor) {
        optimizedTrackLogs.push(latlongIndex);
    }

}


async function analyzeNeighbourPoints ( flight ){

}

async function fastInitDistanceTable(numberOfTurnpoints, latLong) {
    for (let currentTurnpoint = 0; currentTurnpoint <= numberOfTurnpoints; currentTurnpoint++){
        let table = [];
        for ( let latlongIndex = 0 ; latlongIndex < latLong.length; latlongIndex++) {
            let data = [0, "null"];
            table.push(data);
        }
        distanceTable[currentTurnpoint] = table;
    }

}

async  function fastGetFreeFlight(numberOfTurnpoints, distTable) {
    for (let currentTurnpoint = 0; currentTurnpoint <= numberOfTurnpoints; currentTurnpoint++ ){
        await fastCreateAllFreeFlights(currentTurnpoint, distTable, optimizedTrackLogs);
    }

}



async function getNeighbourPoints (points, optimizeFactor) {
    let optimizedPoints  = [];

    for ( let pointIndex = 0; pointIndex < points.length; pointIndex++ ){
        // check if point has index 0
        let latlongIndex = points[pointIndex] - optimizeFactor;
        if (latlongIndex<=0) latlongIndex=0;
        for ( latlongIndex;
              latlongIndex <= (points[pointIndex] + optimizeFactor ) && latlongIndex >=0 && latlongIndex < latLong.length;
              latlongIndex++) {
            optimizedPoints.push(latlongIndex);
        }
    }
    optimizedTrackLogs = optimizedPoints;

}




async function initDistanceTableForNeighbourPoints( numberOfTurnpoints, points ) {
    for (let currentTurnpoint = 0; currentTurnpoint <= numberOfTurnpoints; currentTurnpoint++) {
        let table = [];
        for (let latlongIndex = 0; latlongIndex < points.length; latlongIndex++) {
            let data = [points[latlongIndex], 0, "null"];
            table.push(data);
        }
        distTable[currentTurnpoint] = table;
    }
    return distTable;
}

async function fastCreateAllFreeFlights ( turnpoints, distTable, points) {
    for (let latlongIndex =0; latlongIndex < points.length; latlongIndex++) {
        let maxDistance = 0;
        let predecessor = "null";
        let tempDistance = -1;
        for ( let j = 0; j<latlongIndex; j++ ) {
            if ( turnpoints == 0 )   tempDistance= distance(points[latlongIndex],points[j]);
            if ( turnpoints != 0 )   tempDistance= distance(points[latlongIndex],points[j]) + distTable[turnpoints-1][j][1];
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

//----------------------------------------------------------------------------------------------------------


async  function getFreeFlight(numberOfTurnpoints, distTable) {
    for (let currentTurnpoint = 0; currentTurnpoint <= numberOfTurnpoints; currentTurnpoint++ ){
        await createAllFreeFlights(currentTurnpoint, distTable);
    }

}


// calculates the longest freeFlight with #turnpoints.
async function createAllFreeFlights ( turnpoints, distTable) {
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
    distanceTable[turnpoints][latlongIndex][0] = predecessor;
    distanceTable[turnpoints][latlongIndex][1] = maxDistance;
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
        distanceTable[currentTurnpoint] = table;
    }
    return distanceTable;
}


// get the longest Path from distTable with given turnpoints
async function getLongestPath (distTable, turnpoints) {
    let endPoint =  await getEndpoint(turnpoints);
    let wayPoints = await getWaypoints(endPoint, turnpoints);
    let startPoint = await getStartpoint(turnpoints, endPoint, wayPoints);
    let points = await getAllPoints( startPoint, wayPoints, endPoint );

    let freeFlight ={
        type: "Free Flight",
        startP : latLong[optimizedTrackLogs[startPoint]],
        endP : latLong[optimizedTrackLogs[endPoint]],
        waypoints: await getLatlong(wayPoints),
        totalDistance: await getTotalDist(points),
        flightScore: await getFlightScore(await getTotalDist(points), 1.5),
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
    points.push(optimizedTrackLogs[startPoint]);
    for ( let wayPoint = 0; wayPoint < wayPoints.length; wayPoint++ ){
        points.push(optimizedTrackLogs[wayPoints[wayPoint]]);
    }
    points.push(optimizedTrackLogs[endPoint]);

    return getLatlong(points);
}

async function getAllIndices (startPoint, wayPoints, endPoint) {
    let indices = [];
    indices.push(optimizedTrackLogs[startPoint]);
    for ( let wayPoint = 0; wayPoint < wayPoints.length; wayPoint++ ){
        indices.push(optimizedTrackLogs[wayPoints[wayPoint]]);
    }
    indices.push(optimizedTrackLogs[endPoint]);
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
