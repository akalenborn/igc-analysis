let triangles = []; //
let optimizeFactor2 = 60;
let maxDistanceOfMissedPoints=0;
let maxTriangle = [] ; // [point1, point2, point3, start, end, startEndDistance, triangleDistance]
let currentOptTriangle =[];//[point1, point2, point3, start, end, startEndDistance, triangleDistance]
let latLongCoordinatesTriangle= [];



async function flatTriangleDetection () {
    switch (flatTriangleAlgorithm.value){
        case "fast search":
            let basicTriangle =[];
            let bestTriangle;
            let currentBestTriangle;
            await setParameter();
            await sortTriangles();
            bestTriangle = await getNextOptimalTriangle();
            bestTriangle.startEnd = await setStartEnd(bestTriangle);
            bestTriangle.distance =await setDistance(bestTriangle);
            let maxTriangle = {
                points : [ latLong[bestTriangle.point1], latLong[bestTriangle.point2], latLong[bestTriangle.point3],
                    latLong[bestTriangle.startEnd[0]], latLong[bestTriangle.startEnd[1]]]
            };
            console.log(bestTriangle);
            currentBestTriangle = bestTriangle;
            triangles.length = 0;
            latLongCoordinatesTriangle.length =0;
            latLongCoordinatesTriangle = await getNeighbourPointsTriangle([bestTriangle.point1, bestTriangle.point2,
                bestTriangle.point3]);
            console.log(latLongCoordinatesTriangle);
            await getTriangles();
            await sortTriangles();
            bestTriangle =await getNextOptimalTriangle();
            bestTriangle.startEnd = await setStartEnd(bestTriangle);
            bestTriangle.distance =await setDistance(bestTriangle);
            if(bestTriangle.distance < currentBestTriangle.distance){
                console.log("old");
                let maxTriangle2 = {
                    points : [ latLong[currentBestTriangle.point1], latLong[currentBestTriangle.point2], latLong[currentBestTriangle.point3],
                        latLong[currentBestTriangle.startEnd[0]], latLong[currentBestTriangle.startEnd[1]]]
                };
                return maxTriangle2;
            }
            console.log(bestTriangle);


            // await findOptimalTriangle();
            console.log(bestTriangle.distance);

            return maxTriangle;
    }


}

async function getNextOptimalTriangle(){
    let bestTriangle = await getNextOptimalTriangle();

}
async function getNeighbourPointsTriangle (points) {
    let puffer =  await getSkippedPoints();
    console.log(puffer);
    let neighbourPoints = [];
    for ( let pointIndex = 0; pointIndex < points.length; pointIndex++ ){
        // check if point has index 0
        let latlongIndex = points[pointIndex] -puffer - optimizeFactor;
        if (latlongIndex<=0) latlongIndex=0;
        for ( latlongIndex;
              latlongIndex <= (points[pointIndex] +puffer + optimizeFactor ) && latlongIndex >=0 && latlongIndex < latLong.length;
              latlongIndex++) {
            neighbourPoints.push(latlongIndex);
        }
    }


    return await sort(await removeDuplicates(neighbourPoints));


}

async function setParameter() {
    for (let latlong = 0; latlong < latLong.length; latlong += optimizeFactor2 ){
        latLongCoordinatesTriangle.push(latlong);
    }
    await getTriangles();
    //maxDistanceOfMissedPoints = await maxDistanceBetweenPoint()*optimizeFactor2;

    //first best triangle from array triangles
    //currentOptTriangle = await getNextOptimalTriangle ();
}

async function getTriangles () {
    for (let point1 = 0; point1 < latLongCoordinatesTriangle.length-2; point1++) {
        for (let point2 = point1 + 1; point2 < latLongCoordinatesTriangle.length-1; point2++) {
            for (let point3 = point2 + 1; point3 < latLongCoordinatesTriangle.length; point3++) {

                triangles.push([latLongCoordinatesTriangle[point1], latLongCoordinatesTriangle[point2], latLongCoordinatesTriangle[point3],
                    await getTriangleDistance([latLongCoordinatesTriangle[point1], latLongCoordinatesTriangle[point2], latLongCoordinatesTriangle[point3]])]);
            }
        }
    }
}

async function setStartEnd(bestTriangle){
    console.log(bestTriangle);
    let currentMinDistance = Number.MAX_VALUE;
    let startPoint;
    let endPoint;
    for (let start = bestTriangle.point1-1; start >=0; start-- ){
        for (let end = bestTriangle.point3+1; end < latLong.length; end ++){
            let tempDistance = distance(start, end);
            if (currentMinDistance > tempDistance){
                currentMinDistance = tempDistance;
                startPoint = start;
                endPoint = end;
            }
        }
    }
    return [startPoint, endPoint];
}

async function setDistance (bestTriangle) {
  bestTriangle.distance = await getDistance(bestTriangle);
  return bestTriangle.distance;
}

async function getDistance(bestTriangle) {
    let triangleDistance = 0;
    triangleDistance = distance(bestTriangle.point1, bestTriangle.point2);
    triangleDistance = triangleDistance + distance(bestTriangle.point2, bestTriangle.point3);
    triangleDistance = triangleDistance + distance(bestTriangle.point1, bestTriangle.point3);
    return triangleDistance - distance(bestTriangle.startEnd[0], bestTriangle.startEnd[1]);
}
//----------------------------------------------------------------------------------------------------------------------
async function findOptimalTriangle () {
    counter++;
    currentOptTriangle = await searchNeighbourPoints(currentOptTriangle);
    if (triangles.length!==0 && counter<5){
        if ( ((await getNextOptimalTriangle())[3] + (maxDistanceOfMissedPoints)) >= currentOptTriangle[3]){
            console.log(currentOptTriangle[3]);
            return await findOptimalTriangle(triangles);
        }

    }


    return currentOptTriangle;
}


// returns the current best triangle from the array
async function getNextOptimalTriangle () {
    let bestTriangle = {
        point1: triangles[triangles.length-1][0],
        point2: triangles[triangles.length-1][1],
        point3: triangles[triangles.length-1][2],
        startEnd: null, distance: null
    }
    triangles.pop();
    return bestTriangle;

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

async function sortTriangles (triangleArray) {
    return triangleArray.sort(function(a, b){return a[3] - b[3]});
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




