let flatTriangles = [];
let sortedTriangles = [];
let waypoints = [];
let wayPoints1 = [];
let wayPoints2 = [];
let wayPoints3 = [];
let optRadius;
waypoints.push(wayPoints1, wayPoints2, wayPoints3);
let optimizedLatLong;

async function flatTriangleDetection () {
    setStartTime();
    runtime = 0;
    switch (flatTriangleAlgorithm.value) {
        case "fast search":
            //wenn dreieck nur mithilfe des Puffer die 0.2 grenze schafft , prüfe ob nachbar punkte gehen
            //ansonsten gehe zurück und suche neue
            //optradius nutzen um zu prüfen ob lokales Dreieck besser ist als die in Sorted triangles -> sind die dreieckspunkte weiter weg als radius
            //falls kein Dreieck vorhanden ist, entsprechend nachricht ausgeben
            await resetParametersFlatTriangle();
            let triangle = await fastFlatTriangleSearch();
            let localTriangle = await getAccurateFlatTriangle(triangle, 0.1);
            localTriangle = await setFlatTrianglesAttributes(localTriangle);
            console.log(localTriangle);
            return localTriangle;

        case "optimized":
            break;
    }
}

async function resetParametersFlatTriangle(){

    flatTriangles.length= 0;
    sortedTriangles.length = 0;
    waypoints[0].length = 0;
    waypoints[1].length = 0;
    waypoints[2].length = 0;
    optRadius = 0.01;

}

async function fastFlatTriangleSearch(){

    let triangleResult=[];
    triangleResult = await getInitFlatTriangle();
    triangleResult = await setFlatTrianglesAttributes(triangleResult);
    return triangleResult;

}

async function getInitFlatTriangle() {

    let triangles = [];
    let maxFlatTriangle = [];
    optimizedLatLong = await getOptimizedLatLongs();
    console.log(optimizedLatLong);
    triangles = await getTriangles(optimizedLatLong, optimizedLatLong, optimizedLatLong);
    if (triangles.length !== 0) {
        sortedTriangles = await sortTriangles(triangles);
        console.log(sortedTriangles);
        maxFlatTriangle = await getFlatTriangle( sortedTriangles, optimizedLatLong );
        maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
        console.log(maxFlatTriangle);
        return maxFlatTriangle;

    }
}

async function getOptimizedLatLongs(){

    let tempOptimizedLatLong =[];
    while(true) {
        tempOptimizedLatLong.length=0;
        tempOptimizedLatLong = await getOptimizedLatLongInRadius(optRadius);
        tempOptimizedLatLong = await getOptimizedLatLong(Math.min(flatTriangleMaxSearchpoints, tempOptimizedLatLong.length), tempOptimizedLatLong);
        if(tempOptimizedLatLong.length<=200){
            console.log(optRadius);
            break;
        }
        optRadius+=0.01;
    }

    return tempOptimizedLatLong;

}

async function getTriangles (waypoints1, waypoints2, waypoints3){

    let triangles = [];
    for (let point1 = 0; point1 < waypoints1.length; point1++) {
        for (let point2 = 0; point2 < waypoints2.length; point2++) {
            for (let point3 = 0; point3 < waypoints3.length; point3++) {
                if (waypoints1[point1] < waypoints2[point2] && waypoints2[point2] < waypoints3[point3]) {
                    let distanceSum = await getTriangleDistance([waypoints1[point1], waypoints2[point2], waypoints3[point3]]);
                    let triangle = [waypoints1[point1], waypoints2[point2], waypoints3[point3], distanceSum, point1, point2, point3];
                    if(distanceSum>0) triangles.push(triangle);
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

    for (triangle = sortedTriangles.length - 1; triangle >= 0; triangle = sortedTriangles.length-1)  {
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * count) {
            await domUpdate();
            count++;
        }
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        let startEnd = await getBestStartAndEnd(sortedTriangles[triangle], optimizedLatLong);
        let tempStartEnd = distance( startEnd[0], startEnd[1]);
            if (tempStartEnd < minDistance) {
                minDistance = tempStartEnd;
                let distance = sortedTriangles[triangle][3] - minDistance;
                if (minDistance<=(sortedTriangles[triangle][3]+(0.5))*0.2 && distance > currentMaxFlatTriangle) {
                    currentMaxFlatTriangle = distance;
                    maxFlatTriangle = {
                        points: [],
                        index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], startEnd[0], startEnd[1]],
                        totalDistance: distance
                    }
                    console.log(maxFlatTriangle);
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

async function setFlatTrianglesAttributes (flatTriangle) {

    flatTriangle.points = await getLatlong(flatTriangle.index);
    flatTriangle.totalDistance =await getTotalTriangleDistance(flatTriangle);
    flatTriangle.flightScore = await getFlightScore(flatTriangle.totalDistance, flatTriangleScore);
    flatTriangle.startEndDistance = await getStartEndDistance(flatTriangle);
    flatTriangle.type = "Flat triangle";
    return flatTriangle;

}


async function getAccurateFlatTriangle ( triangleResult, radius) {

    if (radius<=maxRadiusFlatTriangle) {
        let triangles = [];
        let maxFlatTriangle = [];
        let waypoints1 = await getLocalPoints(triangleResult.index[0], radius);
        let waypoints2 = await getLocalPoints(triangleResult.index[1], radius);
        let waypoints3 = await getLocalPoints(triangleResult.index[2], radius);
        let startpoints = await getLocalPoints(triangleResult.index[3], 0.2);
        let endpoints = await getLocalPoints(triangleResult.index[4], 0.2);
        triangles = await getTriangles(waypoints1, waypoints2, waypoints3);
        let sortedTriangles = await sortTriangles(triangles);
        maxFlatTriangle = await getLocalFlatTriangle(triangleResult.totalDistance, sortedTriangles, startpoints, endpoints);
        if(maxFlatTriangle.index.length!=0) maxFlatTriangle.totalDistance = await getTotalTriangleDistance(maxFlatTriangle);
        flatTriangles.push(maxFlatTriangle);
        console.log(triangleResult, maxFlatTriangle);
        if(triangleResult.totalDistance<=maxFlatTriangle.totalDistance) return await getAccurateFlatTriangle(maxFlatTriangle, radius+0.1);
        else return await getAccurateFlatTriangle(triangleResult, radius+0.1);
    } else {

        return triangleResult;
    }

}


async function getLocalPoints(latlongIndex, radius){

    let neighbourPoints = [];
    for (let index = 0; index < latLong.length; index++){
        let tempDistance = distance(index, latlongIndex);
        if (index == latlongIndex)neighbourPoints.push(index);
        else
        if(tempDistance <= radius && tempDistance>0  ) {
            neighbourPoints.push(index);
        }
    }
    return await optimizeWaypoints(neighbourPoints, latlongIndex);

}


async function optimizeWaypoints (waypoints,latlongIndex) {

    let optimizedWaypoints = [];
    let maxPoints = Math.min(100, waypoints.length);
    let latlongInt = Math.round(waypoints.length / maxPoints);
    for (let index  = 0; index<waypoints.length-1; index += latlongInt){
        optimizedWaypoints.push(waypoints[index]);
    }
    optimizedWaypoints.push(latlongIndex);
    optimizedWaypoints.push(waypoints[waypoints.length-1]);
    return optimizedWaypoints.sort(function(a, b){return a - b});

}

async function getLocalFlatTriangle (currentBestDistance, sortedTriangles, startpoints, endpoints) {

    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle;
    let minDistance = Number.MAX_VALUE;
    let triangle;

    for (triangle = sortedTriangles.length - 1; triangle >= 0; triangle = sortedTriangles.length-1)  {
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * count) {
            await domUpdate();
            count++;
        }

        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle || sortedTriangles[triangle][3]<currentBestDistance) break;
        if(maxFlatTriangle!=undefined)break;
        let startEnd = await getLocalBestStartAndEnd(sortedTriangles[triangle], startpoints, endpoints);

        let tempStartEnd = distance( startEnd[0], startEnd[1]);
        if (tempStartEnd < minDistance) {
            minDistance = tempStartEnd;
            let distance = sortedTriangles[triangle][3] - minDistance;
            if (minDistance<=sortedTriangles[triangle][3]*0.2 && distance > currentMaxFlatTriangle) {
                currentMaxFlatTriangle = distance;
                maxFlatTriangle = {
                    points: [],
                    index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], startEnd[0], startEnd[1]],
                    totalDistance: distance
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


async function getLocalBestStartAndEnd (triangle, startpoints, endpoints){

    let minDistance = Number.MAX_VALUE;
    let bestStart;
    let bestEnd;

    for ( let start = 0 ; start<startpoints.length; start++){
        for (let end = 0 ; end <endpoints.length; end ++){
            if(startpoints[start]>=triangle[0])break;
            if(endpoints[end]>=triangle[2]){
                let tempStartEnd = distance(startpoints[start], endpoints[end]);
                if (tempStartEnd < minDistance){
                    minDistance = tempStartEnd;
                    bestStart = startpoints[start];
                    bestEnd = endpoints[end];
                }
            }
        }
        if(minDistance == 0) break;
    }
    if(bestStart==undefined) bestStart = triangle[0];
    if(bestEnd==undefined) bestEnd = triangle[2];

    return [ bestStart, bestEnd];

}


async function getStartEndDistance (flatTriangle) {
    return distance(flatTriangle.index[3], flatTriangle.index[4]);
}

async function getBestFlatTriangle(triangles){
    let maxDistance = Number.MIN_VALUE;
    let bestTriangle = [];
    for ( let triangle = 0; triangle < triangles.length; triangle++ ){
        if (triangles[triangle].totalDistance > maxDistance) {
            maxDistance = triangles[triangle].totalDistance;
            bestTriangle = triangles[triangle];
        }
    }
    return bestTriangle;
}



async function getOptimizedLatLongInRadius (radius) {
    let tempOptLatLong = [];
    let currentLatLong = 0;
    let pointsLeft = true;
    tempOptLatLong.push(currentLatLong);

    while (pointsLeft){
        for (let latLongIndex = currentLatLong+1; latLongIndex<latLong.length; latLongIndex++){
            let tempDistance = distance(currentLatLong, latLongIndex);
            if (latLongIndex==latLong.length-1)pointsLeft = false;
            if(tempDistance>radius) {
                currentLatLong=latLongIndex;
                tempOptLatLong.push(latLongIndex);
                break;
            }
            //tempOptLatLong.pop();
            //tempOptLatLong.push(latLongIndex);
        }
    }
    return tempOptLatLong;
}


async function getOptimizedLatLong (maxPoints, points) {
    let latlongInt = Math.round(points.length/maxPoints);
    let tempOptLatLong = [];

    for(let i = 0; i < points.length; i+=latlongInt){
        tempOptLatLong.push(points[i]);
    }

    return tempOptLatLong;
}

async function getTriangleDistance (points) {
    let triangleDistance = 0;
    triangleDistance = distance(points[0],points[1]);
    triangleDistance = triangleDistance + distance(points[1], points[2]);
    triangleDistance = triangleDistance + distance(points[0], points[2]);

    return triangleDistance;
}

async function sortTriangles (triangleArray) {
    return triangleArray.sort(function(a, b){return a[3] - b[3]});

}


async function getTotalTriangleDistance(triangle) {
    let totalDistance = 0;
    totalDistance =  distance(triangle.index[0], triangle.index[1]);
    totalDistance = totalDistance + distance(triangle.index[1], triangle.index[2]);
    totalDistance = totalDistance + distance(triangle.index[0], triangle.index[2]);
    totalDistance = totalDistance - distance(triangle.index[3], triangle.index[4]);
    //triangle.totalDistance = totalDistance;

    return totalDistance;
}