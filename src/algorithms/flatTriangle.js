let start, end;
let flatTriangles = [];
let sortedTriangles = [];
let neighboursDetected = true;
let checkedWaypoints1 =[];
let checkedWaypoints2 = [];
let checkedWaypoints3 = [];
async function flatTriangleDetection () {
    let triangleResult = [];
    switch (flatTriangleAlgorithm.value) {
        case "fast search":
            triangleResult = await getInitFlatTriangle();
            console.log(triangleResult);
            start = triangleResult.index[3]; end = triangleResult.index[4];
            triangleResult = await getAccurateFlatTriangle(triangleResult, 3);
            console.log(triangleResult);
            return triangleResult;
            break;
        case "optimized":
            let triangles = [];
            let currentBestTriangle = [];
            triangleResult = await getInitFlatTriangle();
            console.log(triangleResult);
            triangleResult = await getAccurateFlatTriangle(triangleResult, 3);
            currentBestTriangle = triangleResult;
            let count = 0;
            while (true) {

                let nextTriangleCandidate =  await getNextPossibleTriangleCandidate(currentBestTriangle);
                if (neighboursDetected === false ) break;
                let nextTriangleCandidateResult = await getAccurateFlatTriangle(nextTriangleCandidate, 3);
                if (nextTriangleCandidateResult.totalDistance >= currentBestTriangle.totalDistance){
                    currentBestTriangle = nextTriangleCandidateResult;
                    flatTriangles.push(currentBestTriangle);
                }
                if (nextTriangleCandidateResult.totalDistance < currentBestTriangle.totalDistance ) {
                    flatTriangles.push(currentBestTriangle);
                    currentBestTriangle = nextTriangleCandidate;
                }
            }
            currentBestTriangle = await getBestFlatTriangle(flatTriangles);
            currentBestTriangle = await getAccurateFlatTriangle(currentBestTriangle, 1);
            console.log(flatTriangles);
            return currentBestTriangle;
            break;
    }
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
async function getNextPossibleTriangleCandidate (currentTriangle) {
    console.log("---------------------------------------------------------------------")
    while (sortedTriangles.length !==0){
        let tempTriangle = sortedTriangles.pop();
        if(tempTriangle[3]< (await getBestFlatTriangle(flatTriangles)).totalDistance) break;
        let nextTriangle = {index: [tempTriangle[4], tempTriangle[5], tempTriangle[6]]};
        if (distance(currentTriangle.index[0], nextTriangle.index[0]) >= 4) {
            if (await checkWaypoint(nextTriangle.index[0], checkedWaypoints1)){
                checkedWaypoints1.push(nextTriangle.index[0]);
                return nextTriangle;
            }
        }
        if (distance(currentTriangle.index[1], nextTriangle.index[1]) >= 3){
            if (await checkWaypoint(nextTriangle.index[1], checkedWaypoints2)){
                checkedWaypoints2.push(nextTriangle.index[1]);
                return nextTriangle;
            }
        }
        if (distance(currentTriangle.index[2], nextTriangle.index[2]) >= 3){
            if (await checkWaypoint(nextTriangle.index[2], checkedWaypoints3)) {
                checkedWaypoints3.push(nextTriangle.index[2]);
                return nextTriangle;
            }
        }

    }
    neighboursDetected=false;
}
async function checkWaypoint (wayPoint , wayPoints) {
    if (wayPoints.length!==0){
        for ( let waypointIndex =0 ; waypointIndex<wayPoints.length; waypointIndex++){
            if (distance(wayPoint, wayPoints[waypointIndex]) < 3) {
                return false;
            }
        }
    }
    return true;
}
async function getAccurateFlatTriangle ( triangleResult, radius) {
   if (radius>0) {
       let waypoints1 = [];
       let waypoints2 = [];
       let waypoints3 = [];
       let triangles = [];
       let maxFlatTriangle = [];
       waypoints1 = await getLocalPoints(triangleResult.index[0], radius);
       waypoints2 = await getLocalPoints(triangleResult.index[1], radius);
       waypoints3 = await getLocalPoints(triangleResult.index[2], radius);
       for ( let i = 0 ; i < waypoints1.length; i++){
           checkedWaypoints1.push(waypoints1[i]);
       }
       for ( let i = 0 ; i < waypoints2.length; i++){
           checkedWaypoints2.push(waypoints2[i]);
       }
       for ( let i = 0 ; i < waypoints3.length; i++){
           checkedWaypoints3.push(waypoints3[i]);
       }
       for (let point1 = 0; point1 < waypoints1.length; point1++) {
           for (let point2 = 0; point2 < waypoints2.length; point2++) {
               for (let point3 = 0; point3 < waypoints3.length; point3++) {
                   if (waypoints1[point1] < waypoints2[point2] && waypoints2[point2] < waypoints3[point3]) {
                       let distanceSum = await getTriangleDistance([waypoints1[point1], waypoints2[point2], waypoints3[point3]]);
                       let triangle = [waypoints1[point1], waypoints2[point2], waypoints3[point3], distanceSum];
                       triangles.push(triangle);
                   }

               }
           }
       }

       let sortedTriangles = await sortTriangles(triangles);
       console.log(sortedTriangles);
       maxFlatTriangle = await getFastFlatTriangleEndStart(sortedTriangles);
       maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
       maxFlatTriangle = await getTotalTriangleDistance(maxFlatTriangle);
       flatTriangles.push(maxFlatTriangle);
       if (radius <= 0.1) return getAccurateFlatTriangle(maxFlatTriangle, radius-0.01);
       if (radius <= 0.6) return getAccurateFlatTriangle(maxFlatTriangle, radius-0.1);
       return getAccurateFlatTriangle(maxFlatTriangle, radius-0.3);
   } else {
       triangleResult.points = await getLatlong(triangleResult.index);
       console.log(flatTriangles);
       triangleResult.flightScore = await getFlightScore(triangleResult.totalDistance, 1.4);
       return triangleResult;
   }
   // maxFlatTriangle = await getTotalTriangleDistance(maxFlatTriangle);





}
async function optimizeWaypoints (waypoints,latlongIndex) {
    let optimizedWaypoints = [];
    let maxPoints = Math.min(100, waypoints.length);
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

    optimizedLatLong = await getOptimizedLatLong(Math.min(230, latLong.length));
    await getTriangles(optimizedLatLong, triangles);
    if (triangles.length !== 0) {
        sortedTriangles = await sortTriangles(triangles);
        console.log(sortedTriangles);
        maxFlatTriangle = await getFastFlatTriangleStartEnd(sortedTriangles, optimizedLatLong);
        maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
        maxFlatTriangle = await getTotalTriangleDistance(maxFlatTriangle);
        maxFlatTriangle.points = await getLatlong(maxFlatTriangle.index);
        return maxFlatTriangle;
    }
}

async function getOptimizedLatLong (maxPoints) {
    let latlongInt = Math.round(latLong.length/maxPoints);
    let tempOptLatLong = [];

    for(let i = 0; i < latLong.length; i+=latlongInt){
        tempOptLatLong.push(i);
    }

    return tempOptLatLong;
}

async function getFastFlatTriangle(initTriangle){
    let optimizedLatLong = [];
    let triangles = [];
    let maxFlatTriangle = [];
    let sortedTriangles = [];

    optimizedLatLong = await getOptimizedLatLong(Math.min(600, latLong.length));
    for (let point1 = 0; point1 < optimizedLatLong.length - 2; point1++) {
        for (let point2 = point1 + 1; point2 < optimizedLatLong.length - 1; point2++) {
            for (let point3 = point2 + 1; point3 < optimizedLatLong.length; point3++) {
                let distanceSum = await getTriangleDistance([optimizedLatLong[point1], optimizedLatLong[point2], optimizedLatLong[point3]]);
                let triangle = [point1, point2, point3, distanceSum];
                if (distanceSum > initTriangle.totalDistance) triangles.push(triangle);
            }
        }
    }
    console.log(triangles);
    if (triangles.length !== 0){
        sortedTriangles = await sortTriangles(triangles);
    }
    else {
        return initTriangle;
    }
    console.log(sortedTriangles);
    maxFlatTriangle = await getFastFlatTriangleStartEnd(sortedTriangles, optimizedLatLong);
    return maxFlatTriangle;
}

async function getTriangles(latLongIndexes, triangles) {
    for (let point1 = 0; point1 < latLongIndexes.length - 2; point1++) {
        for (let point2 = point1 + 1; point2 < latLongIndexes.length - 1; point2++) {
            for (let point3 = point2 + 1; point3 < latLongIndexes.length; point3++) {
                let distanceSum = await getTriangleDistance([latLongIndexes[point1], latLongIndexes[point2], latLongIndexes[point3]]);
                let triangle = [ point1, point2, point3, distanceSum, latLongIndexes[point1], latLongIndexes[point2], latLongIndexes[point3]];
                triangles.push(triangle);
            }
        }
    }
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
async function getFastFlatTriangleEndStart(sortedTriangles){
    console.log(sortedTriangles);
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle ;
    let minDistance = Number.MAX_VALUE;
    let count = 0;
    for ( let triangle = sortedTriangles.length-1; triangle >= 0; triangle -= 2 ){
        count++;
        if (maxFlatTriangle !== undefined) break;
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        //if (maxFlatTriangle !== undefined) break;
            for ( let start = sortedTriangles[triangle][0] - 1; start>=0; start -=5){
                if (triangle< sortedTriangles.length-2){
                    if (sortedTriangles[triangle][0] < sortedTriangles[triangle+1][0]
                        && sortedTriangles[triangle][2] > sortedTriangles[triangle+1][2]){
                        break;
                    }
                }
                for (let end = sortedTriangles[triangle][2] + 1; end <latLong.length; end += 5){
                    let tempStartEnd = distance(start, end);
                    if (tempStartEnd < minDistance){
                        minDistance = tempStartEnd;
                        let distance = sortedTriangles[triangle][3] - minDistance;
                        if (minDistance<=sortedTriangles[triangle][3]*0.2 && distance>currentMaxFlatTriangle){
                            currentMaxFlatTriangle = distance;
                            maxFlatTriangle= {
                                points:[],
                                index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2],start, end],
                                totalDistance: distance,
                                type: "flat triangle"
                            }

                        }
                    }
                }
            }

    }
    console.log(maxFlatTriangle);
    return maxFlatTriangle;
}


async function getFastFlatTriangleStartEnd(sortedTriangles, latLongs){
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle ;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    for ( triangle = sortedTriangles.length-1; triangle >= 0; triangle-- ){
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        for ( let start = sortedTriangles[triangle][0] - 1; start>=0; start -= 1){
            for (let end = sortedTriangles[triangle][2] + 1; end <latLongs.length; end+= 1){
                let tempStartEnd = distance(latLongs[start], latLongs[end]);
                if (tempStartEnd < minDistance){
                    minDistance = tempStartEnd;
                    let distance = sortedTriangles[triangle][3] - minDistance;
                    if (minDistance<=sortedTriangles[triangle][3]*0.2 && distance>currentMaxFlatTriangle){
                        currentMaxFlatTriangle = distance;
                        maxFlatTriangle= {
                            points:[],
                            index: [latLongs[sortedTriangles[triangle][0]], latLongs[sortedTriangles[triangle][1]], latLongs[sortedTriangles[triangle][2]],latLongs[start], latLongs[end]],
                            totalDistance: distance
                        }
                    }
                }
            }
        }
        sortedTriangles.pop();
    }
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
    console.log(distance(triangle.index[3], triangle.index[4]));
    return triangle;
}

async function getTotalTriangleDistance(triangle) {
    let totalDistance = 0;
    totalDistance =  distance(triangle.index[0], triangle.index[1]);
    totalDistance = totalDistance + distance(triangle.index[1], triangle.index[2]);
    totalDistance = totalDistance + distance(triangle.index[0], triangle.index[2]);
    totalDistance = totalDistance - distance(triangle.index[3], triangle.index[4]);
    triangle.totalDistance = totalDistance;

    return triangle;
}


















/*
let optimizeFactorFlatTriangle = 10;
let maxWaypoint1= Number.MAX_VALUE, maxWaypoint2=Number.MIN_VALUE;
async function flatTriangleDetection () {
    let initialTriangles = [];
    let optimizedLatLong = [];
    let _flatTriangle;
    let result;
    let resultPoints;
    let neighbourPoints =[];let optimizedNeighbourTriangles = [];

    optimizedLatLong = await setLatLongs();
    initialTriangles = await getTriangles(optimizedLatLong);
    switch (flatTriangleAlgorithm.value) {
        case "fast search":
            if (initialTriangles.length !== 0) {
                await sortTriangles(initialTriangles);
                console.log(initialTriangles);
                _flatTriangle = await getFastFlatTriangleEndStart(initialTriangles);
                neighbourPoints = await getNeighbourPointsTriangle(_flatTriangle.points);  // [ [wendepunkt1],[wendepunkt2],[wendepunkt3] ]
                optimizedNeighbourTriangles = await getNeighbourTriangles(neighbourPoints);
                await sortTriangles(optimizedNeighbourTriangles);
                _flatTriangle = await getFastFlatTriangleEndStart(optimizedNeighbourTriangles);
                resultPoints = await getLatlong(_flatTriangle.points);
                result = {points: resultPoints}
                console.log(_flatTriangle);
                return result;
            }
            break;
        case "optimized":
            //let neighbourPoints = [];
            // let optimizedNeighbourTriangles = [];
            let maxOptimizedTriangle;
            let count =0;
            await sortTriangles(initialTriangles);
            _flatTriangle = await getTriangle(initialTriangles);
            console.log(_flatTriangle);
            neighbourPoints = await getNeighbourPointsTriangle(_flatTriangle.points);  // [ [wendepunkt1],[wendepunkt2],[wendepunkt3] ]
            optimizedNeighbourTriangles = await getNeighbourTriangles(neighbourPoints);
            await sortTriangles(optimizedNeighbourTriangles);
            _flatTriangle = await getFastFlatTriangleEndStart(optimizedNeighbourTriangles);
            resultPoints = await getLatlong(_flatTriangle.points);
            result = {points: resultPoints}
            console.log(_flatTriangle);
            if (initialTriangles.length !== 0) {
                while (true) {
                    count++;
                    optimizedNeighbourTriangles.length = 0;
                    maxOptimizedTriangle = await getTriangle(initialTriangles);
                    neighbourPoints = await getNeighbourPointsTriangle(maxOptimizedTriangle.points);  // [ [wendepunkt1],[wendepunkt2],[wendepunkt3] ]
                    optimizedNeighbourTriangles = await getNeighbourTriangles(neighbourPoints);
                    await sortTriangles(optimizedNeighbourTriangles);
                    console.log(optimizedNeighbourTriangles);
                    maxOptimizedTriangle = await getFastFlatTriangleEndStart(optimizedNeighbourTriangles);
                    if (maxOptimizedTriangle !== undefined && maxOptimizedTriangle.distance < _flatTriangle.distance && count > 6){
                        resultPoints = await getLatlong(maxOptimizedTriangle.points);
                        result = {points: resultPoints}
                        console.log(maxOptimizedTriangle);
                        _flatTriangle = maxOptimizedTriangle;
                        break;
                    }
                    if (maxOptimizedTriangle !== undefined && maxOptimizedTriangle.distance < _flatTriangle.distance){
                        resultPoints = await getLatlong(maxOptimizedTriangle.points);
                        result = {points: resultPoints}
                        console.log(maxOptimizedTriangle);
                        _flatTriangle = maxOptimizedTriangle;
                    }

                }
                console.log(resultPoints);
                console.log(maxOptimizedTriangle);
                return result;
            }






            let optimizedNeighbourPoints = [];
            let flatTriangle = [];
            _flatTriangle = await getInitFlatTriangle(initialTriangles);
            console.log(_flatTriangle);

            neighbourPoints = await getNeighbourPointsTriangle(_flatTriangle);
            optimizedNeighbourPoints = await setLatLongIndex(neighbourPoints[0]);
            console.log(optimizedNeighbourPoints);
            optimizedNeighbourTriangles = await getNeighbourTriangles(optimizedNeighbourPoints);
            flatTriangle = await getInitFlatTriangle(optimizedNeighbourTriangles);
            console.log(possibleTriangles);
            while (true){
                neighbourPoints = await getNeighbourPoints(possibleTriangles.pop());
                console.log(neighbourPoints);
                optimizedNeighbourPoints = await setLatLongIndex(neighbourPoints[0]);
                console.log(optimizedNeighbourPoints);
                optimizedNeighbourTriangles = await getNeighbourTriangles(optimizedNeighbourPoints);
                _flatTriangle = await getInitFlatTriangle(optimizedNeighbourTriangles);
                if (_flatTriangle.distance>=flatTriangle.distance) flatTriangle = _flatTriangle;
                if (possibleTriangles.length==1) break;
            }



            resultPoints = await getLatlong(flatTriangle.points);
            result = {points: resultPoints}
            return result;
            break;



    }
}
async function getNeighbourPointsTriangle (points){
    let waypoints1 = [];
    let waypoints2 = [];
    let waypoints3 = [];
    let collectedPoints = [];
    waypoints1 = await getLocalPoints(points[0]);
    waypoints2 = await getLocalPoints(points[1]);
    waypoints3 = await getLocalPoints(points[2]);
    console.log(waypoints1, waypoints2, waypoints3);
    collectedPoints.push(waypoints1);collectedPoints.push(waypoints2);collectedPoints.push(waypoints3);
    return collectedPoints;

}

async function collectPoints(pointsArray){
    let points = [];
    for (let i = 0; i <pointsArray.length; i++ ){
        for ( let j = 0; j<pointsArray[i].length; j++){
            points.push(pointsArray[i][j]);
        }
    }
    return points;
}






async function getOptimizedFlatTriangle(flatTriangle) {
    let points = [];
    let tempTriangle = [];
    let waypoints1 = [];
    let waypoints2 = [];
    let waypoints3 = [];
    let start = [];
    let end = [];
    let triangles = [];
    points = flatTriangle.indexes;
    console.log(points);
    waypoints1 = await getLocalPoints(points[0]);
    waypoints2 = await getLocalPoints(points[1]);
    waypoints3 = await getLocalPoints(points[2]);
    start = await getLocalPoints(points[3]);
    end = await getLocalPoints(points[4]);
    console.log(waypoints1, waypoints2, waypoints3, start, end);
    for (let point1 = 0; point1 < waypoints1.length; point1++) {
        for (let point2 = 0; point2 < waypoints2.length; point2++) {
            for (let point3 = 0; point3 < waypoints3.length; point3++) {
                if (point1 !== point2 && point1 !== point3 && point2 !== point3) {
                    let distanceSum = await getTriangleDistance([latLong[waypoints1[point1]], latLong[waypoints2[point2]], latLong[waypoints3[point3]]]);
                    tempTriangle = [waypoints1[point1], waypoints2[point2], waypoints3[point3], distanceSum];
                    triangles.push(tempTriangle);
                }
            }
        }
    }
    console.log(waypoints1, waypoints2, waypoints3, start, end);
    if (triangles.length !== 0) {
        let sortedTriangles = await sortTriangles(triangles);
        console.log(sortedTriangles);
        let maxFlatTriangle = await getBestFlatTriangle(sortedTriangles, start, end);
        console.log(maxFlatTriangle);
        return maxFlatTriangle;
    }
}


async function getLocalPoints (point) {
    let searchRadius =50// await getSkippedPoints();
    console.log(searchRadius);
    let points = [];
    let index = point;
    if (index<=0) index = 0;
    for ( index; index < point + searchRadius; index++){
        if (index > latLong.length)  break;
        points.push(index);
    }

    return points;
}

async function getInitFlatTriangle(initialTriangles) {
    let maxFlatTriangle;
    if (initialTriangles.length !== 0) {
        let sortedTriangles = await sortTriangles(initialTriangles);
        console.log(sortedTriangles);
        maxFlatTriangle = await getFastFlatTriangle(sortedTriangles);
        console.log(maxFlatTriangle);
        return maxFlatTriangle;
    }
}

async function getTriangles(latLongs){
    let triangles = [];
    for (let point1 = 0; point1 < latLongs.length - 2; point1++) {
        for (let point2 = point1 + 1; point2 < latLongs.length - 1; point2++) {
            for (let point3 = point2 + 1; point3 < latLongs.length; point3++) {
                let distanceSum = await getTriangleDistance([latLongs[point1], latLongs[point2], latLongs[point3]]);
                let triangle = [latLongs[point1], latLongs[point2], latLongs[point3], distanceSum];
                triangles.push(triangle);
            }
        }
    }
    return triangles;
}

async function getNeighbourTriangles(points){
    let waypoints1 = points[0];
    let waypoints2 = points[1];
    let waypoints3 = points[2]
    let triangles = [];

    for (let point1 = 0; point1 < waypoints1.length; point1++) {
        for (let point2 = 0; point2 < waypoints2.length; point2++) {
            for (let point3 = 0; point3 < waypoints3.length; point3++) {
                if (waypoints1[point1] < waypoints2[point2] && waypoints2[point2] < waypoints3[point3]) {
                    let distanceSum = await getTriangleDistance([ waypoints1[point1], waypoints2[point2], waypoints3[point3] ]);
                    let triangle = [waypoints1[point1], waypoints2[point2], waypoints3[point3], distanceSum ];
                    triangles.push(triangle);
                }
            }
        }
    }
    return triangles;
}

async function getBestFlatTriangle(sortedTriangles, start, end) {
    console.log("getbestFlatTriangle");
    let count=0;
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle;
    let minDistance = Number.MAX_VALUE;
    console.log(sortedTriangles);
    for ( let triangle = sortedTriangles.length-1; triangle > 0; triangle-- ){
        count++;
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle){
            console.log("count" + triangle);
            break;
        }
       // if (count>30 && maxFlatTriangle!==undefined) break;

        for ( let startIndex = 0; startIndex<start.length; startIndex++){
            for (let endIndex = 0; endIndex<end.length; endIndex++){
                if (start[startIndex]<= sortedTriangles[triangle][0] && end[endIndex]>= sortedTriangles[triangle][2] && start[startIndex]!==end[endIndex]){
                    let tempStartEnd = distanceBetweenCoordinates(latLong[start[startIndex]], latLong[end[endIndex]]);
                    if (tempStartEnd < minDistance){
                        minDistance = tempStartEnd;
                        let distance = sortedTriangles[triangle][3] - minDistance;
                        if (minDistance<=sortedTriangles[triangle][3]*0.2){

                            currentMaxFlatTriangle = distance;
                            maxFlatTriangle= {
                                points: [latLong[sortedTriangles[triangle][0]], latLong[sortedTriangles[triangle][1]], latLong[sortedTriangles[triangle][2]], latLong[start[startIndex]], latLong[end[endIndex]]],
                                distance: distance,
                                indexes :  [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], start[startIndex], end[endIndex]]
                            }

                        }

                }


                }
            }
        }

    }

    return maxFlatTriangle;

}


async function getFastFlatTriangleEndStart(sortedTriangles){
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle ;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    let currentStart = Number.MIN_VALUE;
    let currentEnd = Number.MAX_VALUE;
    for ( triangle = sortedTriangles.length-1; triangle > 0; triangle-- ){
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        for ( let start = sortedTriangles[triangle][0]; start>=0; start--){
            if (sortedTriangles[triangle][2] > currentEnd && sortedTriangles[triangle][0] < currentStart) {
                break;
            }
            if (sortedTriangles[triangle][2] < currentEnd) currentEnd = sortedTriangles[triangle][2];
            if (sortedTriangles[triangle][0] > currentStart) currentStart = sortedTriangles[triangle][0];
           // currentEnd = sortedTriangles[triangle][2]; currentStart = sortedTriangles[triangle][0];
            for (let end = sortedTriangles[triangle][2]; end <latLong.length; end++){
                let tempStartEnd = distance(start, end);
                if (tempStartEnd < minDistance){
                    minDistance = tempStartEnd;
                    let distance = sortedTriangles[triangle][3] - minDistance;
                    if (minDistance<=sortedTriangles[triangle][3]*0.2){
                        currentMaxFlatTriangle = distance;
                        maxFlatTriangle= {
                            points: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], start, end],
                            distance: distance
                        }
                    }
                }
            }
        }
        sortedTriangles.pop();
    }
    return maxFlatTriangle;
}

async function getOptimizedFastFlatTriangleEndStart(sortedTriangles){
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle ;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    let currentStart = Number.MIN_VALUE;
    let currentEnd = Number.MAX_VALUE;
    for ( triangle = sortedTriangles.length-1; triangle > 0; triangle-- ){
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        for ( let start = sortedTriangles[triangle][0]; start>=0; start--){
            if (sortedTriangles[triangle][2] > currentEnd && sortedTriangles[triangle][0] < currentStart) {
                break;
            }
            if (sortedTriangles[triangle][2] < currentEnd) currentEnd = sortedTriangles[triangle][2];
            if (sortedTriangles[triangle][0] > currentStart) currentStart = sortedTriangles[triangle][0];
            // currentEnd = sortedTriangles[triangle][2]; currentStart = sortedTriangles[triangle][0];
            for (let end = sortedTriangles[triangle][2]; end <latLong.length; end++){
                let tempStartEnd = distance(start, end);
                if (tempStartEnd < minDistance){
                    minDistance = tempStartEnd;
                    let distance = sortedTriangles[triangle][3] - minDistance;
                    if (minDistance<=sortedTriangles[triangle][3]*0.2){
                        currentMaxFlatTriangle = distance;
                        maxFlatTriangle= {
                            points: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], start, end],
                            distance: distance
                        }
                    }
                }
            }
        }
    }
    return maxFlatTriangle;
}


async function setLatLongsIndexes() {
    let optimizedlatLongs = [];
    for (let latlong = 0; latlong < latLong.length; latlong += optimizeFactorFlatTriangle ){
        optimizedlatLongs.push(latlong);
    }
    return optimizedlatLongs

}

async function setLatLongs () {
    let optimizedlatLongs = [];
    for (let latlong = 0; latlong < latLong.length; latlong += optimizeFactorFlatTriangle ){
        optimizedlatLongs.push(latlong);
    }
    return optimizedlatLongs;
}
async function setLatLongIndex (latLongIndexes) {
    let optimizedlatLongs = [];
    for (let latlong = 0; latlong < latLongIndexes.length && latlong <= latLong.length; latlong++ ){
        optimizedlatLongs.push(latLongIndexes[latlong]);
    }
    return optimizedlatLongs;
}




async function setStartEnd(bestTriangle){

    let currentMinDistance = Number.MAX_VALUE;
    let startPoint;
    let endPoint;
    for (let start = bestTriangle.point1-1; start >=0; start-- ){
        for (let end = bestTriangle.point3+1; end < latLong.length; end ++){
            console.log("test");
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
    console.log(bestTriangle);
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





async function getStartAndEnd ( point1, point3, triangleDistance) {
    let currentMinDistance = Number.MAX_VALUE;
    let startPoint;
    let endPoint;
    for (let start = point1+1; start >=0; start-- ){
        for (let end = point3+1; end < latLong.length; end ++){
            let tempDistance = distance(start, end);
            if (currentMinDistance > tempDistance && tempDistance/triangleDistance<0.2){
                currentMinDistance = tempDistance;
                startPoint = start;
                endPoint = end;
            }

        }
    }
    return [startPoint, endPoint];
}



async function getFlightScore (score, distance) {
    return score*distance;
}

async function sortTriangles (triangleArray) {
     triangleArray.sort(function(a, b){return a[3] - b[3]});
;
}




async function maxDistanceBetweenPoint() {
    let maxDistance = 0;
    for (let i = 0; i < distances.length; i++) {
        if( maxDistance < distances[i]) maxDistance = distances[i];
    }

    return maxDistance;
}


async function getTriangle(triangles){
    let arrayItem = [];
    arrayItem = triangles.pop();
    console.log(arrayItem);
    let triangle = {points:[arrayItem[0], arrayItem[1], arrayItem[2]], distance:arrayItem[3]};
    return triangle;
}



async function getTriangleDistance (points) {
    let triangleDistance = 0;
    triangleDistance = distance(points[0],points[1]);
    triangleDistance = triangleDistance + distance(points[1], points[2]);
    triangleDistance = triangleDistance + distance(points[0], points[2]);

    return triangleDistance;
}
*/