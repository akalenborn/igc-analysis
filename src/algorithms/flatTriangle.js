let flatTriangles = [];
let sortedTriangles = [];
let optRadius;
let optimizedLatLong;
let flatTriangleConditionPuffer;
let improved;

async function flatTriangleDetection () {
    let flatTriangle;
    timeStamp1 = performance.now();
    setStartTime();
    runtime = 0;
    count = 0;
    switch (flatTriangleAlgorithm.value) {
        case "fast search":
            improved = false;
            await setParametersFlatTriangle();
            flatTriangle = await fastFlatTriangleSearch();
            if(flatTriangle.index.length==0) return flatTriangle;
            flatTriangle = await localSearch(flatTriangle);
            flatTriangle = await getBestStartEnd(flatTriangle);
            flatTriangle = await setFlatTriangleResults(flatTriangle);
            timeStamp2 = performance.now();
            console.log("Time: " + (timeStamp2-timeStamp1) + "milliseconds");
            return flatTriangle;

        case "improved search":
            improved = true;
            await setParametersFlatTriangle();
            flatTriangle = await fastFlatTriangleSearch();
            if(flatTriangle.index.length==0) return flatTriangle;
            flatTriangle = await localSearch(flatTriangle);
            flatTriangle = await getBestStartEnd(flatTriangle);
            flatTriangle = await setFlatTriangleResults(flatTriangle);
            timeStamp2 = performance.now();
            console.log("Time: " + (timeStamp2-timeStamp1) + "milliseconds");
            return flatTriangle;
            break;

    }
}

/**
 * look for better triangles in local area
 * @param flatTriangle
 * @returns {Promise<*>}
 */
async function localSearch (flatTriangle) {

    if(flatTriangle.searchedLocalPoints == false) flatTriangle = await getAccurateFlatTriangle(flatTriangle, 0.1, 0.1);
    maxRadiusFlatTriangle = 0.1;
    return await getAccurateFlatTriangle(flatTriangle, 0.01, 0.01);

}


async function setParametersFlatTriangle(){

    flatTriangles.length= 0;
    sortedTriangles.length = 0;
    optRadius =0;
    optimizedLatLong = await getOptimizedLatLongs( flatTriangleMaxSearchpoints );
    if(improved==false) flatTriangleImprovedPuffer = 0;


}

async function fastFlatTriangleSearch(){

    let triangleResult=[];
    triangleResult = await getInitFlatTriangle();
    if(triangleResult.index.length!=0)triangleResult = await setFlatTrianglesAttributes( triangleResult );
    return triangleResult;

}

async function getInitFlatTriangle() {

    let triangles = [];
    let maxFlatTriangle = [];
    triangles = await getTriangles( optimizedLatLong, optimizedLatLong, optimizedLatLong, 0 );
    if ( triangles.length !== 0 ) {
        sortedTriangles = await sortTriangles( triangles );
        maxFlatTriangle = await getFlatTriangle( sortedTriangles, optimizedLatLong );
        maxFlatTriangle = await getBestStartEnd( maxFlatTriangle );
        return maxFlatTriangle;
    }

}

async function getOptimizedLatLongs( maxSearchPoints ){

    let tempOptimizedLatLong =[];
    while( true ) {
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * count) {
            await domUpdate();
            count++;
        }
        tempOptimizedLatLong.length=0;
        tempOptimizedLatLong = await getOptimizedLatLongInRadius( optRadius, maxSearchPoints );
        if( tempOptimizedLatLong.length <= maxSearchPoints ){
            maxRadiusFlatTriangle = ( optRadius*flatTriangleRadiusFactor );
            flatTriangleConditionPuffer = optRadius*5;
            break;
        }
        if(tempOptimizedLatLong.length>maxSearchPoints ) optRadius+=0.001;
    }

    return tempOptimizedLatLong;

}

async function getTriangles ( waypoints1, waypoints2, waypoints3, distanceLimit ){

    let triangles = [];
    for (let point1 = 0; point1 < waypoints1.length; point1++) {
        for (let point2 = 0; point2 < waypoints2.length; point2++) {
            for (let point3 = 0; point3 < waypoints3.length; point3++) {
                if (waypoints1[point1] < waypoints2[point2] && waypoints2[point2] < waypoints3[point3]) {
                    let distanceSum = await getTriangleDistance([waypoints1[point1], waypoints2[point2], waypoints3[point3]]);
                    let triangle = [waypoints1[point1], waypoints2[point2], waypoints3[point3], distanceSum, point1, point2, point3];
                    if(distanceSum>distanceLimit) triangles.push(triangle);
                }
            }
        }
    }
    return triangles;

}



async function getFlatTriangle (sortedTriangles, optimizedLatLong) {

    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    let startEnd;
    for (triangle = sortedTriangles.length - 1; triangle >= 0; triangle = sortedTriangles.length-1)  {
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * count) {
            await domUpdate();
            count++;
        }
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        startEnd = await getBestStartAndEnd(sortedTriangles[triangle], optimizedLatLong);
        let tempStartEnd = distance( startEnd[0], startEnd[1]);
        if (maxFlatTriangle==undefined || (distance(maxFlatTriangle.index[0], sortedTriangles[triangle][0]) > optRadius || distance(maxFlatTriangle.index[1], sortedTriangles[triangle][1]) >  optRadius || distance(maxFlatTriangle.index[2], sortedTriangles[triangle][2]) >  optRadius)) {
            if (tempStartEnd <= minDistance) {
                minDistance = tempStartEnd;
                let triangleDistance = sortedTriangles[triangle][3] - minDistance;
                if (minDistance <= (sortedTriangles[triangle][3] + (flatTriangleConditionPuffer)) * 0.2 && triangleDistance + flatTriangleImprovedPuffer > currentMaxFlatTriangle) {
                    if (minDistance <= sortedTriangles[triangle][3] * 0.2 && triangleDistance > currentMaxFlatTriangle) {
                        currentMaxFlatTriangle = triangleDistance;
                        maxFlatTriangle = {
                            searchedLocalPoints: false,
                            points: [],
                            index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], startEnd[0], startEnd[1]],
                            totalDistance: triangleDistance
                        }
                    } else {
                        let tempMaxFlatTriangle = {
                            searchedLocalPoints: true,
                            points: [],
                            index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], startEnd[0], startEnd[1]],
                            totalDistance: triangleDistance
                        }
                        tempMaxFlatTriangle = await getAccurateFlatTriangle(tempMaxFlatTriangle, 0.1, 0.1);
                        if (distance(tempMaxFlatTriangle.index[3], tempMaxFlatTriangle.index[4]) <= (distance(tempMaxFlatTriangle.index[3], tempMaxFlatTriangle.index[4]) + tempMaxFlatTriangle.totalDistance) * 0.2) {
                            if (maxFlatTriangle == undefined || tempMaxFlatTriangle.totalDistance > maxFlatTriangle.totalDistance) {
                                currentMaxFlatTriangle = triangleDistance;
                                maxFlatTriangle = tempMaxFlatTriangle;
                            }

                        }
                        if (maxFlatTriangle.totalDistance == 0) maxFlatTriangle = {
                            points: [],
                            index: [],
                            totalDistance: 0
                        }
                    }
                }
            }
        }
        sortedTriangles.pop();
    }

    if(maxFlatTriangle === undefined){
        return maxFlatTriangle = {
            points: [],
            index: [],
            totalDistance: 0
        }
    }
    return maxFlatTriangle;

}

async function checkWaypoint (triangle , wayPointsTriple, startEnd) {
    if (wayPointsTriple.length!==0){
        for ( let waypointIndex =0 ; waypointIndex < wayPointsTriple.length; waypointIndex++){
            if (distance(triangle[0], wayPointsTriple[waypointIndex][0]) <= optRadius && distance(triangle[1], wayPointsTriple[waypointIndex][1]) <= optRadius && distance(triangle[2], wayPointsTriple[waypointIndex][2]) <= optRadius
            ) {
                return false;
            }
        }
    }
    return true;
}

async function getBestStartEnd (triangle){

    let minDistance = Number.MAX_VALUE;
    for ( let start = triangle.index[0]; start>=0; start--){
        for ( let end = triangle.index[2]; end < latLong.length; end++ ) {
            let tempDistance = distance(start, end);
            if (tempDistance < minDistance) {
                minDistance = tempDistance;
                triangle.index[3] = start;
                triangle.index[4] = end;
            }

        }
    }
    return triangle;
}



async function getBestStartAndEnd (triangle, optimizedLatLong){

    let minDistance = Number.MAX_VALUE;
    let bestStart;
    let bestEnd;
    for ( let start = triangle[4] ; start>=0; start--){
        for (let end = triangle[6] ; end <optimizedLatLong.length; end ++){
            let tempStartEnd = distance(optimizedLatLong[start], optimizedLatLong[end]);
            if (tempStartEnd < minDistance){
                minDistance = tempStartEnd;
                bestStart = start;
                bestEnd = end;
            }
        }
    }
    return [ optimizedLatLong[bestStart], optimizedLatLong[bestEnd]];
}

async function setFlatTriangleResults (flatTriangle) {

    flatTriangle = {
        type: "Flat Triangle",
        startP: latLong[flatTriangle.index[3]],
        endP: latLong[flatTriangle.index[4]],
        waypoints: [latLong[flatTriangle.index[0]], latLong[flatTriangle.index[1]], latLong[flatTriangle.index[4]]],
        points: [latLong[flatTriangle.index[3]],latLong[flatTriangle.index[0]],latLong[flatTriangle.index[1]],latLong[flatTriangle.index[2]],latLong[flatTriangle.index[4]]],
        totalDistance: await getTotalTriangleDistance(flatTriangle),
        flightScore: await getFlightScore(flatTriangle.totalDistance, flatTriangleScore),
        startEndDistance : await getStartEndDistance(flatTriangle),
        leg1: distance(flatTriangle.index[0], flatTriangle.index[1]),
        leg2: distance(flatTriangle.index[1], flatTriangle.index[2]),
        leg3: distance(flatTriangle.index[0], flatTriangle.index[2])

    }

    return flatTriangle;
}

async function setFlatTrianglesAttributes (flatTriangle) {

    flatTriangle.points = await getLatlong(flatTriangle.index);
    flatTriangle.totalDistance =await getTotalTriangleDistance(flatTriangle);
    flatTriangle.flightScore = await getFlightScore(flatTriangle.totalDistance, flatTriangleScore);
    flatTriangle.startEndDistance = await getStartEndDistance(flatTriangle);
    flatTriangle.type = "Flat triangle";
    return flatTriangle;

}


async function getAccurateFlatTriangle ( triangleResult, radius, steps) {

    if (radius<=maxRadiusFlatTriangle) {
        let triangles = [];
        let maxFlatTriangle = [];
        let waypoints1 = await getLocalPoints( triangleResult.index[0], radius );
        let waypoints2 = await getLocalPoints( triangleResult.index[1], radius );
        let waypoints3 = await getLocalPoints( triangleResult.index[2], radius );
        let startpoints = await getLocalPoints( triangleResult.index[3], radius );
        let endpoints = await getLocalPoints( triangleResult.index[4], radius );
        triangles = await getTriangles( waypoints1, waypoints2, waypoints3, triangleResult.totalDistance );
        let sortedTriangles = await sortTriangles( triangles );
        maxFlatTriangle = await getLocalFlatTriangle( triangleResult.totalDistance, sortedTriangles, startpoints, endpoints );
        if( maxFlatTriangle.index.length!=0 ) maxFlatTriangle.totalDistance = await getTotalTriangleDistance( maxFlatTriangle );
        if(triangleResult.totalDistance < maxFlatTriangle.totalDistance ) return await getAccurateFlatTriangle( maxFlatTriangle, radius, steps );
        else return await getAccurateFlatTriangle( triangleResult, radius+steps,steps );
    } else {
        return triangleResult;
    }

}


async function getLocalPoints( latlongIndex, radius ){

    let neighbourPoints = [];
    for ( let index = 0; index < latLong.length; index++ ){
        let tempDistance = distance( index, latlongIndex );
        if (index == latlongIndex) neighbourPoints.push(index);
        if(index != latlongIndex && tempDistance <= radius && tempDistance>0  ) neighbourPoints.push(index);
    }
    return await optimizeWaypoints( neighbourPoints, latlongIndex );

}


async function optimizeWaypoints ( waypoints, latlongIndex ) {

    let optimizedWaypoints = [];
    let maxPoints = Math.min(flatTriangleMaxLocalSearchpoints, waypoints.length);
    let latlongInt = Math.round(waypoints.length / maxPoints);
    for (let index  = 0; index<waypoints.length-1; index += latlongInt){
        optimizedWaypoints.push(waypoints[index]);
    }
    optimizedWaypoints.push(latlongIndex);
    optimizedWaypoints.push(waypoints[waypoints.length-1]);
    return optimizedWaypoints.sort(function(a, b){return a - b});

}

async function getLocalFlatTriangle ( currentBestDistance, sortedTriangles, startpoints, endpoints ) {

    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    for ( triangle = sortedTriangles.length - 1; triangle >= 0; triangle = sortedTriangles.length-1 )  {
        if ( getCurrentRuntimeMilliseconds() > domUpdateInterval * count ) {
            await domUpdate();
            count++;
        }
        if ( sortedTriangles[triangle][3] <= currentMaxFlatTriangle || sortedTriangles[triangle][3] <= currentBestDistance ) break;
        let startEnd = await getLocalBestStartAndEnd( sortedTriangles[triangle], startpoints, endpoints );
        let tempStartEnd = distance( startEnd[0], startEnd[1] );
        if ( tempStartEnd < minDistance ) {
            minDistance = tempStartEnd;
            let distance = sortedTriangles[triangle][3] - minDistance;
            if ( minDistance <= sortedTriangles[triangle][3]*0.2 && distance > currentMaxFlatTriangle ) {
                currentMaxFlatTriangle = distance;
                maxFlatTriangle = {
                    searchedLocalPoints:true,
                    points: [],
                    index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], startEnd[0], startEnd[1]],
                    totalDistance: distance
                }
            }
        }
        sortedTriangles.pop();
    }

    if( maxFlatTriangle === undefined ){
        return maxFlatTriangle = {
            points: [],
            index: [],
            totalDistance: 0
        }
    }
    return maxFlatTriangle;

}


async function getLocalBestStartAndEnd( triangle, startpoints, endpoints ){

    let minDistance = Number.MAX_VALUE;
    let bestStart;
    let bestEnd;
    for ( let start = 0 ; start < startpoints.length; start++ ){
        for ( let end = 0 ; end < endpoints.length; end ++ ){
            if( startpoints[start] >= triangle[0] )break;
            if( endpoints[end] >= triangle[2] ){
                let tempStartEnd = distance( startpoints[start], endpoints[end] );
                if ( tempStartEnd < minDistance ){
                    minDistance = tempStartEnd;
                    bestStart = startpoints[start];
                    bestEnd = endpoints[end];
                }
            }
        }
        if( minDistance == 0 ) break;
    }
    if( bestStart==undefined ) bestStart = triangle[0];
    if( bestEnd==undefined ) bestEnd = triangle[2];
    return [ bestStart, bestEnd ];

}


async function getStartEndDistance ( flatTriangle ) {

    return distance( flatTriangle.index[3], flatTriangle.index[4] );

}


async function getOptimizedLatLongInRadius ( radius, maxSearchpoints ) {

    let tempOptLatLong = [];
    let currentLatLong = 0;
    let pointsLeft = true;
    tempOptLatLong.push( currentLatLong );
    while( pointsLeft ){
        for( let latLongIndex = currentLatLong+1; latLongIndex<latLong.length; latLongIndex++ ){
            let tempDistance = distance( currentLatLong, latLongIndex );
            if( latLongIndex == latLong.length-1 )pointsLeft = false;
            if( tempDistance >= radius ) {
                currentLatLong = latLongIndex;
                tempOptLatLong.push( latLongIndex );
                break;
            }

        }
        if(tempOptLatLong.length>maxSearchpoints)break;
    }
    return tempOptLatLong;

}


async function getTriangleDistance ( points ) {

    let triangleDistance = 0;
    triangleDistance = distance( points[0],points[1] );
    triangleDistance = triangleDistance + distance( points[1], points[2] );
    triangleDistance = triangleDistance + distance( points[0], points[2] );
    return triangleDistance;

}

async function sortTriangles ( triangleArray ) {

    return triangleArray.sort( function( a, b ){ return a[3] - b[3] });

}


async function getTotalTriangleDistance( triangle ) {

    let totalDistance = 0;
    totalDistance =  distance( triangle.index[0], triangle.index[1] );
    totalDistance = totalDistance + distance( triangle.index[1], triangle.index[2] );
    totalDistance = totalDistance + distance( triangle.index[0], triangle.index[2] );
    totalDistance = totalDistance - distance( triangle.index[3], triangle.index[4] );
    return totalDistance;
}