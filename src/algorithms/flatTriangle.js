let flatTriangles = [];
let sortedTriangles = [];
//let neighboursDetected = true;
//let checkedWaypointsTriple =[];
let startTuple = new Map;
let endTuple = new Map;
let sortedTriangleIndex;
async function flatTriangleDetection () {
    switch (flatTriangleAlgorithm.value) {
        case "fast search":
            return await fastFlatTriangleSearch();
            break;

        case "optimized":
            return await improvedFlatTriangleSearch();
            break;
    }
}

async function fastFlatTriangleSearch(){
    setStartTime();
    runtime = 0;
    count = 1;
    let triangleResult=[];
    triangleResult = await getInitFlatTriangle();
    triangleResult = await setFlatTrianglesAttributes(triangleResult);
    return triangleResult;
}
async function improvedFlatTriangleSearch() {
    setStartTime();
    runtime = 0;
    count = 1;
    let triangleResult = [];
    let currentBestFlatTriangle = [];
    triangleResult = await getInitFlatTriangle();
    triangleResult = await getAccurateFlatTriangle(triangleResult, 0.01); //0.01
    currentBestFlatTriangle = await getBestFlatTriangle(flatTriangles);
    //triangleResult = await getBestFlatTriangle(flatTriangles);
    maxRadiusFlatTriangle = 1;
    while (true){
        console.log("while part");
        triangleResult = await getAccurateFlatTriangle(currentBestFlatTriangle, 0.1);
        triangleResult = await getBestFlatTriangle(flatTriangles);
        if (triangleResult.totalDistance>currentBestFlatTriangle.totalDistance) currentBestFlatTriangle = triangleResult;
        else break;
    }
    currentBestFlatTriangle = await setFlatTrianglesAttributes(currentBestFlatTriangle);

    return currentBestFlatTriangle;
}


async function setFlatTrianglesAttributes (flatTriangle) {
    flatTriangle.points = await getLatlong(flatTriangle.index);
    flatTriangle.totalDistance =await getTotalTriangleDistance(flatTriangle);
    flatTriangle.flightScore = await getFlightScore(flatTriangle.totalDistance, flatTriangleScore);
    flatTriangle.startEndDistance = await getStartEndDistance(flatTriangle);
    flatTriangle.type = "Flat triangle";
    return flatTriangle;
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


async function getAccurateFlatTriangle ( triangleResult, radius) {
    if (triangleResult === undefined) return;
    if (radius<=maxRadiusFlatTriangle) {
        let waypoints1 = [];
        let waypoints2 = [];
        let waypoints3 = [];
        let triangles = [];
        let maxFlatTriangle = [];
        waypoints1 = await getLocalPoints(triangleResult.index[0], radius);
        waypoints2 = await getLocalPoints(triangleResult.index[1], radius);
        waypoints3 = await getLocalPoints(triangleResult.index[2], radius);
        triangles = await getTriangles(waypoints1, waypoints2, waypoints3);
        let sortedTriangles = await sortTriangles(triangles);
        maxFlatTriangle = await getFastFlatTriangleStartEnd(sortedTriangles);
        if (maxFlatTriangle === undefined) maxFlatTriangle = triangleResult;
        maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
        maxFlatTriangle.totalDistance = await getTotalTriangleDistance(maxFlatTriangle);
        flatTriangles.push(maxFlatTriangle);
        console.log(flatTriangles);
        if (radius < 0.1) return getAccurateFlatTriangle(maxFlatTriangle, radius+0.01);
        if (radius <=  1) return getAccurateFlatTriangle(maxFlatTriangle, radius+0.1);
        return getAccurateFlatTriangle(maxFlatTriangle, radius+0.1); // 0.1
    } else {
        return triangleResult;
    }
}

async function getTriangles (waypoints1, waypoints2, waypoints3){
    let triangles = [];
    for (let point1 = 0; point1 < waypoints1.length; point1++) {
        for (let point2 = 0; point2 < waypoints2.length; point2++) {
            for (let point3 = 0; point3 < waypoints3.length; point3++) {
                if (waypoints1[point1] < waypoints2[point2] && waypoints2[point2] < waypoints3[point3]) {
                    let distanceSum = await getTriangleDistance([waypoints1[point1], waypoints2[point2], waypoints3[point3]]);
                    let triangle = [waypoints1[point1], waypoints2[point2], waypoints3[point3], distanceSum];
                    if(distanceSum>0) triangles.push(triangle);
                }
            }
        }
    }
    return triangles;
}

async function optimizeWaypoints (waypoints,latlongIndex) {
    let optimizedWaypoints = [];
    let maxPoints = Math.min(20, waypoints.length);
    let latlongInt = Math.round(waypoints.length / maxPoints);
    for (let index  = 0; index<waypoints.length; index += latlongInt){
        optimizedWaypoints.push(waypoints[index]);
    }
    optimizedWaypoints.push(latlongIndex);
    return optimizedWaypoints.sort(function(a, b){return a - b});

}

async function getLocalPoints(latlongIndex, radius){
    let neighbourPoints = [];
    for (let index = 0; index < latLong.length; index++){
        let tempDistance = distance(index, latlongIndex);
        if (index == latlongIndex)neighbourPoints.push(index);
        else
        if(tempDistance <= radius && tempDistance>0) {
            neighbourPoints.push(index);
        }
    }
    return await optimizeWaypoints(neighbourPoints, latlongIndex);
}

async function getInitFlatTriangle() {
    let optimizedLatLong = [];
    let triangles = [];
    let maxFlatTriangle = [];

    optimizedLatLong = await getOptimizedLatLong(Math.min(130, latLong.length));
    triangles = await getTriangles(optimizedLatLong, optimizedLatLong, optimizedLatLong);
    if (triangles.length !== 0) {
        sortedTriangles = await sortTriangles(triangles);
        console.log(sortedTriangles);
        maxFlatTriangle = await getFastFlatTriangleStartEnd(sortedTriangles);
        maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
        //maxFlatTriangle = await getTotalTriangleDistance(maxFlatTriangle);
        //maxFlatTriangle.points = await getLatlong(maxFlatTriangle.index);
        return maxFlatTriangle;
    }
}

async function getFastStartEndReverse (sortedTriangles, steps, start, end){
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle ;
    let minDistance = Number.MAX_VALUE;
    let triangle;

    for ( triangle = start; triangle >= 0 && triangle>end ; triangle-=steps ){
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval*count){
            await domUpdate();
            count++;
        }
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        for ( let start = sortedTriangles[triangle][0] - 1; start>=0; start -= 10){
            for (let end = sortedTriangles[triangle][2] + 1; end <latLong.length; end+= 10){
                let tempStartEnd = distance(start, end);
                if (tempStartEnd < minDistance){
                    minDistance = tempStartEnd;
                    let distance = sortedTriangles[triangle][3] - minDistance;
                    if (minDistance<=sortedTriangles[triangle][3]*0.2 && distance>currentMaxFlatTriangle){
                        currentMaxFlatTriangle = distance;
                        maxFlatTriangle= {
                            points:[],
                            index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2],start, end],
                            totalDistance: distance
                        }
                    }
                }
            }
        }
    }
    sortedTriangleIndex=triangle;
    return maxFlatTriangle;
}

async function getFastStartEndForward (sortedTriangles, steps, start , end) {
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle ;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    let triangleDetected = false;

    for ( triangle = start;  triangle<sortedTriangles.length; triangle+=steps ){
        triangleDetected = false;
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval*count){
            await domUpdate();
            count++;
        }
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        for ( let start = sortedTriangles[triangle][0] - 1; start>=0; start -= 10){
            for (let end = sortedTriangles[triangle][2] + 1; end <latLong.length; end+= 10){
                let tempStartEnd = distance(start, end);
                if (tempStartEnd < minDistance){
                    minDistance = tempStartEnd;
                    let distance = sortedTriangles[triangle][3] - minDistance;
                    if (minDistance<=sortedTriangles[triangle][3]*0.2 && distance>currentMaxFlatTriangle){
                        triangleDetected = true;
                        currentMaxFlatTriangle = distance;
                        maxFlatTriangle= {
                            points:[],
                            index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2],start, end],
                            totalDistance: distance
                        }
                    }
                }
            }
        }
        if(triangleDetected === false && triangle>=end) break;
    }

    return maxFlatTriangle;
}

async function getFastFlatTriangleStartEnd(sortedTriangles){

    let amountOfSkippedTriangles = 2;
    let end = Math.round(sortedTriangles.length/1.1);
    let start = 0;
    let startingSearchPoint = sortedTriangles.length-1;
    let flatTriangle = [];
    while(true) {

        flatTriangle = await getFastStartEndReverse(sortedTriangles, amountOfSkippedTriangles, startingSearchPoint, end);
        console.log(flatTriangle);
        if (flatTriangle === undefined) return await getFastStartEndForward(sortedTriangles, 1, 0, 1000);
        startingSearchPoint = sortedTriangleIndex;
        end -= Math.round(end/10);;//Math.round(end/3);
        if(flatTriangle!==undefined) break;
        amountOfSkippedTriangles+=1;
    }
    console.log(end);
    console.log(flatTriangle);

    return flatTriangle;
    
}



async function getOptimizedLatLong (maxPoints) {
    let latlongInt = Math.round(latLong.length/maxPoints);
    let tempOptLatLong = [];

    for(let i = 0; i < latLong.length; i+=latlongInt){
        tempOptLatLong.push(i);
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

async function getStartPoint (triangleStartIndex) {
    let bestStartIndex = undefined;
    let temp = startTuple.get(triangleStartIndex);
    if (temp !== undefined ) bestStartIndex = temp;
    return bestStartIndex;
}

async function getEndPoint (triangleEndIndex) {
    let bestEndIndex = undefined;
    let temp = startTuple.get(triangleEndIndex);
    if (temp !== undefined ) bestEndIndex = temp;
    return bestEndIndex;
}

async function getBestStartAndEnd (triangle){
    let minDistance = Number.MAX_VALUE;
    let bestStart;
    let bestEnd;
    for ( let start = triangle[0] - 1; start>=0; start -=2){
        for (let end = triangle[2] + 1; end <latLong.length; end +=2){
            let tempStartEnd = distance(start, end);
            if (tempStartEnd < minDistance){
                minDistance = tempStartEnd;
                bestStart = start;
                bestEnd = end;
            }
        }
    }
    return [ bestStart, bestEnd];
}

async function getBestStartPoint (triangle, endpoint) {
    let minDistance = Number.MAX_VALUE;
    let bestStartPoint;
    for ( let start = triangle[0] - 1; start>=0; start -=2){
        let tempStartEnd = distance(start, endpoint);
        if (tempStartEnd < minDistance){
            minDistance = tempStartEnd;
            bestStartPoint = start;
            }

    }
    return bestStartPoint;
}

async function getBestEndPoint (triangle, startPoint) {
    let minDistance = Number.MAX_VALUE;
    let bestEndPoint;
    for ( let end = triangle[2] + 1; end<latLong.length; end +=2){
        let tempStartEnd = distance(startPoint, end);
        if (tempStartEnd < minDistance){
            minDistance = tempStartEnd;
            bestEndPoint = end;
        }

    }
    return bestEndPoint;
}


async function getFastFlatTriangleEndStart(sortedTriangles){
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle ;
    let candSearchStart = window.performance.now();

    for ( let triangle = sortedTriangles.length-1; triangle >= 0; triangle -- ){
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval*count){
            await domUpdate();
        }
        if (maxFlatTriangle !== undefined) break;
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        let startpoint =await getStartPoint(sortedTriangles[0]);
        let endpoint = await getEndPoint(sortedTriangles[2]);
        if (startpoint === undefined && endpoint === undefined) {
            let startEnd = [];
            startEnd = await getBestStartAndEnd(sortedTriangles[triangle],currentMaxFlatTriangle);
            startpoint = startEnd[0];
            endpoint = startEnd[1];
        }
        if (startpoint === undefined && endpoint !== undefined) startpoint = await getBestStartPoint (sortedTriangles[triangle], endpoint, currentMaxFlatTriangle);
        if (startpoint !== undefined && endpoint === undefined) endpoint =await getBestEndPoint(sortedTriangles[triangle], startpoint);
        startTuple.set(sortedTriangles[triangle][0], startpoint);
        endTuple.set(sortedTriangles[triangle][2], endpoint);
        if (startpoint !== undefined && endpoint !== undefined){
            let minDistance =  distance(startpoint, endpoint);
            let totalDistance = sortedTriangles[triangle][3] - minDistance;
            if (minDistance<=sortedTriangles[triangle][3]*0.2 && totalDistance>currentMaxFlatTriangle){
                currentMaxFlatTriangle = totalDistance;
                maxFlatTriangle= {
                    points:[],
                    index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2],startpoint, endpoint],
                    totalDistance: totalDistance,
                    type: "flat triangle"
                }
            }
        }
    }
    runtime +=(window.performance.now() - candSearchStart)/1000;
    return maxFlatTriangle;
}

async function getBestStartEnd (triangle){
    let minDistance = Number.MAX_VALUE;
    for ( let start = triangle.index[0]-1; start>=0; start--){
        for ( let end = triangle.index[2]+1; end < latLong.length; end++ ) {
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

async function getTotalTriangleDistance(triangle) {
    let totalDistance = 0;
    totalDistance =  distance(triangle.index[0], triangle.index[1]);
    totalDistance = totalDistance + distance(triangle.index[1], triangle.index[2]);
    totalDistance = totalDistance + distance(triangle.index[0], triangle.index[2]);
    totalDistance = totalDistance - distance(triangle.index[3], triangle.index[4]);
    //triangle.totalDistance = totalDistance;

    return totalDistance;
}
