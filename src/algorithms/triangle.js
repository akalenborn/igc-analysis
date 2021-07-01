let triangles = []; //
let skippedPoints = 70;
let maxDistanceOfMissedPoints=0;
let counter = 0; // only to stop the search , better solution has to be found.
let maxTriangle = [] ; // [point1, point2, point3, start, end, startEndDistance, triangleDistance]
let currentOptTriangle =[];//[point1, point2, point3, start, end, startEndDistance, triangleDistance]

async function triangleDetection () {
    await initializeParameter();
    await findOptimalTriangle(triangles);
    let maxTriangleS = {
        points : [ latLong[maxTriangle[0]], latLong[maxTriangle[1]], latLong[maxTriangle[2]],
            latLong[maxTriangle[3]], latLong[maxTriangle[4]] ]
    };
    console.log(maxTriangle);

    return maxTriangleS;

}

async function initializeParameter() {
    maxDistanceOfMissedPoints = await maxDistanceBetweenPoint()*skippedPoints;
    //Sorted array with all triangles
    triangles = await sortTriangles(await getTriangles( await optimizePoints(skippedPoints)));
    //first best triangle from array triangles
    currentOptTriangle = await getNextOptimalTriangle ();
}

async function findOptimalTriangle (triangles) {
    counter++;
    currentOptTriangle = await searchNeighbourPoints(currentOptTriangle);
    if (triangles.length!=0 && counter<5){
        if ( ((await getNextOptimalTriangle())[3] + (maxDistanceOfMissedPoints)) >= currentOptTriangle[3]){
            console.log(currentOptTriangle[3]);
            return await findOptimalTriangle(triangles);
        }

    }


    return currentOptTriangle;
}


// returns the current best triangle from the array
async function getNextOptimalTriangle () {
    let triangle = triangles[triangles.length-1];
    triangles.pop();

    return triangle;
}


async function searchNeighbourPoints (currentOptTriangle) {
    // reduce the startEnd distance from the currentOptTriangle
    if (currentOptTriangle.length < 5) {
        let startEnd = await getStartAndEnd(currentOptTriangle);
        currentOptTriangle[3] = startEnd[0];
        currentOptTriangle[4] = startEnd[1];
        currentOptTriangle[5] = startEnd[2];
        currentOptTriangle[6] = await getTriangleDistance([currentOptTriangle[0], currentOptTriangle[1], currentOptTriangle[2]]) -
            currentOptTriangle[5];
    }
    console.log(currentOptTriangle);
    let currentDistance = currentOptTriangle[6];
    let possibleTriangleCandidate = [];
    for (let point1 = currentOptTriangle[0]; point1 < currentOptTriangle[0]+skippedPoints && point1 < latLong.length; point1++ ){
        for (let point2 = currentOptTriangle[1]; point2 < currentOptTriangle[1]+skippedPoints && point2 < latLong.length; point2++ ){
            for (let point3= currentOptTriangle[2]; point3 < currentOptTriangle[2]+skippedPoints && point3 < latLong.length; point3++ ){
                let tempDistance = await getTriangleDistance([point1, point2, point3]);
                if ( currentOptTriangle[6] < tempDistance) {
                    possibleTriangleCandidate[0] = point1;
                    possibleTriangleCandidate[1] = point2;
                    possibleTriangleCandidate[2] = point3;
                    possibleTriangleCandidate[3] = tempDistance;
                    currentDistance = tempDistance;
                }
            }
        }
    }
    return compareTriangles(currentOptTriangle, possibleTriangleCandidate);
    /**
    // let possibleDistance = (possibleTriangleCandidate[3] - (await getStartAndEnd(possibleTriangleCandidate))[2]);
    if ( possibleDistance >= distanceMinusStartEnd){
        possibleTriangleCandidate[3] = possibleDistance;
        maxTriangle = possibleTriangleCandidate;
        return possibleTriangleCandidate;
    }

    currentOptTriangle[3]= distanceMinusStartEnd;
    maxTriangle = currentOptTriangle;
    return currentOptTriangle;
**/


}

async function compareTriangles (triangle, triangleCandidate) {
    let triangleCandidateStartEnd = await getStartAndEnd(triangleCandidate);
    triangleCandidate[3] = triangleCandidate[3] - triangleCandidateStartEnd[2];
    if ( triangleCandidate[3] >= triangle[3] ) {
        maxTriangle[0] = triangleCandidate[0];
        maxTriangle[1] = triangleCandidate[1];
        maxTriangle[2] = triangleCandidate[2];
        maxTriangle[3] = triangleCandidateStartEnd[0];
        maxTriangle[4] = triangleCandidateStartEnd[1];
        maxTriangle[5] = triangleCandidateStartEnd[2];
        maxTriangle[6] = triangleCandidate[3];
        return triangleCandidate
    }
    maxTriangle[0] = triangle[0];
    maxTriangle[1] = triangle[1];
    maxTriangle[2] = triangle[2];
    maxTriangle[3] = triangle[3];
    maxTriangle[4] = triangle[4];
    maxTriangle[5] = triangle[5];
    maxTriangle[6] = triangle[6];
    return triangle;
}


async function optimizePoints (skippedPoints) {
    let latLongs = [];
    for ( let latLongIndex = 0; latLongIndex < latLong.length ; latLongIndex += skippedPoints){
        latLongs.push(latLongIndex);
    }
    return latLongs;
}



async function getTriangles (latLong) {
    for ( let point1 = 0; point1 < latLong.length-2; point1++) {
        for ( let point2 = point1 + 1; point2 < latLong.length-1; point2++) {
            for ( let point3 = point2 + 1; point3 < latLong.length; point3++) {

                triangles.push([latLong[point1], latLong[point2], latLong[point3],
                   await getTriangleDistance([latLong[point1], latLong[point2], latLong[point3]])]);
            }
        }
    }

    return triangles;
}

async function getStartAndEnd ( triangle ) {
    let currentMinDistance = Number.MAX_VALUE;
    let startPoint;
    let endPoint;
    for (let start = triangle[0]+1; start >=0; start-- ){
        for (let end = triangle[2]+1; end < latLong.length; end ++){
            let tempDistance = distance(start, end);
            if (currentMinDistance > tempDistance){
                currentMinDistance = tempDistance;
                startPoint = start;
                endPoint = end;
            }

        }
    }
    return [startPoint, endPoint, currentMinDistance];
}



async function getFlightScore (score, distance) {
    return score*distance;
}


async function sortTriangles () {
    return triangles.sort(function(a, b){return a[3] - b[3]});
}


async function maxDistanceBetweenPoint() {
    let maxDistance = 0;
    for (let i = 0; i < distances.length; i++) {
        if( maxDistance < distances[i]) maxDistance = distances[i];
    }

    return maxDistance;
}



async function getTriangleDistance (points) {
    let triangleDistance = 0;
    triangleDistance = distance(points[0],points[1]);
    triangleDistance = triangleDistance + distance(points[1], points[2]);
    triangleDistance = triangleDistance + distance(points[0], points[2]);

    return triangleDistance;
}









//--------------------------------------------------------------------------------------------------------------------//





//only for testing

async function printTriangles (triangles) {
    console.log("print");
    for ( let i = 0; i < triangles.length; i++ ) {
        console.log(triangles[i]);
    }
}



async function getMaxTriangle () {
    let triangleCandidate;
    let longestDistance = 0;
    for ( let triangle = 0; triangle < triangles.length; triangle++ ){
        let possibleDistance =  await getTriangleDistance(triangles[triangle]);
        if (longestDistance < possibleDistance ) {
            longestDistance = possibleDistance;
            triangleCandidate = triangle;
        }
    }
    console.log(longestDistance);
    let maxTriangle = {

        points : [ triangles[triangleCandidate][0], triangles[triangleCandidate][1],triangles[triangleCandidate][2]]
    }

    return maxTriangle;
}


async function getOptStartAndEnd ( triangle, optStart, optEnd ) {
    let currentMinDistance = distance(optStart, optEnd);
    let startPoint = optStart;
    let endPoint = optEnd;

    for (let start = optStart-1; start >=0; start-- ){
        for (let end = triangle[2]+2 ; end < latLong.length; end ++){
            let tempDistance = distance(start, end);
            if (currentMinDistance > tempDistance){
                currentMinDistance = tempDistance;
                startPoint = start;
                endPoint = end;
            }

        }
    }
    let startEndPoint = {
        startEndDistance : currentMinDistance,
        startPoint : startPoint,
        endPoint : endPoint
    }
    return startEndPoint;
}


/**
 *
 *

 async function searchNeighbourPoints (points) {
    let currentMax = triangles[triangles.length-1][3] - (await getStartAndEnd(points)).startEndDistance;
    triangles.pop();
    for (let point1 = points[0]; point1 < points[0]+skippedPoint; point1++ ){
        for (let point2 = points[1]; point2 < points[1]+skippedPoint; point2++ ){
            for (let point3= points[2]; point3 < points[2]+skippedPoint; point3++ ){
                let startEndDistance = (await getStartAndEnd([point1, point2, point3])).startEndDistance;
                let tempDistance = await getTriangleDistance([point1, point2, point3]) - startEndDistance;
                if ( currentMax < tempDistance) currentMax = tempDistance;
            }
        }
    }

    if (await getFlightScore(1.5, triangles[triangles.length-1][3]+(maxDistanceOfMissedPoints*3)) > await
        getFlightScore(1.5*currentMax)) {
        return searchNeighbourPoints([triangles[triangles.length-1][0],
            triangles[triangles.length-1][1], triangles[triangles.length-1][2]]);
    }

    return currentMax;
}

 */
