let flatTriangles = [];
let sortedTriangles = [];
let waypoints = [];
let wayPoints1 = [];
let wayPoints2 = [];
let wayPoints3 = [];
let flatTrianglesCandidates = [];
let optRadius;
waypoints.push(wayPoints1, wayPoints2, wayPoints3);

async function flatTriangleDetection () {

    switch (flatTriangleAlgorithm.value) {
        case "fast search":
            await resetParametersFlatTriangle();
            let triangle = await fastFlatTriangleSearch();
            console.log(triangle);
            return triangle;


        case "optimized":

            await resetParametersFlatTriangle();
            let currentBestFlatTriangle = await fastFlatTriangleSearch();
            console.log(currentBestFlatTriangle);
            flatTrianglesCandidates.push(currentBestFlatTriangle);
            //console.log(sortedTriangles);

            await saveWaypoints(currentBestFlatTriangle.index[0], 0);
            await saveWaypoints(currentBestFlatTriangle.index[1], 1);
            await saveWaypoints(currentBestFlatTriangle.index[2], 2);
            await searchForDifferentWaypoints(0, currentBestFlatTriangle.index[0], currentBestFlatTriangle.totalDistance);
            await searchForDifferentWaypoints(1, currentBestFlatTriangle.index[1], currentBestFlatTriangle.totalDistance);
            await searchForDifferentWaypoints(2, currentBestFlatTriangle.index[2], currentBestFlatTriangle.totalDistance);
            console.log(waypoints);
            let triangles = (await sortTriangles(await getTriangles(waypoints[0], waypoints[1], waypoints[2])));
            console.log(triangles);

            let currentDistance =0 ;
            let maxFlatTriangle;

            //maxFlatTriangle = await getFastStartEndReverse(triangles);
            maxFlatTriangle = await getBestStartEnd(currentBestFlatTriangle);
            maxFlatTriangle = await getAccurateFlatTriangle(maxFlatTriangle, 0.1);
            console.log(maxFlatTriangle);

            currentDistance = maxFlatTriangle.totalDistance;
            let bestDistance  = (await getBestPossibleStartEndDistance(triangles, maxFlatTriangle))
            console.log(bestDistance);
           // let checkedTripled = [];
            console.log(triangles);

            while (triangles.length!=0 && currentDistance<triangles[triangles.length-1][3]-bestDistance+(2)) {

                let tempTriangle = triangles[triangles.length-1];
                console.log(tempTriangle, currentDistance);
                //if(tempTriangle[3]<=currentDistance){
                let tempFlatTriangle = await getFastStartEndReverse(triangles);
                if(tempFlatTriangle.totalDistance!=0){
                    tempFlatTriangle = await getBestStartEnd(tempFlatTriangle);
                    //tempFlatTriangle = await getLocalFlatTriangle(tempFlatTriangle);
                    tempFlatTriangle = await getAccurateFlatTriangle(tempFlatTriangle, 0.1);
                    //tempFlatTriangle = await getBestFlatTriangle(flatTriangles);
                    if (tempFlatTriangle.totalDistance!=undefined && currentDistance<=tempFlatTriangle.totalDistance){
                        currentDistance = tempFlatTriangle.totalDistance;
                        maxFlatTriangle = tempFlatTriangle;
                    }
                }
                //triangles.pop();
            }
            maxRadiusFlatTriangle = 1;
            console.log("!");
            await getAccurateFlatTriangle(maxFlatTriangle, 0.1);
            maxFlatTriangle = await getBestFlatTriangle(flatTriangles);

            console.log(maxFlatTriangle);
            maxFlatTriangle = await setFlatTrianglesAttributes(maxFlatTriangle);
            console.log(maxFlatTriangle);
            console.log(flatTriangles);
            return maxFlatTriangle;
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


async function checkTriples(triangle, checkedTriples, radius){

    for (let i = 0; i < checkedTriples.length; i++){
        if (distance(checkedTriples[i][0], triangle[0])<radius && distance(checkedTriples[i][1], triangle[1])<radius && distance(checkedTriples[i][2], triangle[2])<radius) {

            return false;
        }
    }
    return true;
}


async function searchLocal (triangle){
    let wayPoints3 = [];
    wayPoints3 = await getLocalPoints(triangle.index[2],1);
    console.log(wayPoints3);
    let triangles = (await sortTriangles(await getTriangles([triangle.index[0]], [triangle.index[1]], wayPoints3)));
    console.log(triangles);
    let maxFlatTriangle = await getFastStartEndReverse3(triangles);
    maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
    console.log(maxFlatTriangle);
}

async function getBestPossibleStartEndDistance(triangles, bestFlatTriangle) {

    let biggestStart = Number.MIN_VALUE;
    let biggestEnd = Number.MAX_VALUE;
    for(let triangleIndex = triangles.length-1; triangleIndex>=0; triangleIndex--){
        let triangle= triangles[triangleIndex];
        if (biggestStart < triangle[0]) biggestStart = triangle[0];
        if (biggestEnd>triangle[2]) biggestEnd = triangle[2];
        if(bestFlatTriangle.totalDistance> triangle[3]+0.6) break;
    }
    console.log(biggestStart, biggestEnd);
    let bestDistance = Number.MAX_VALUE;
    for (let start = biggestStart; start>=0; start--){
        for (let end = biggestEnd; end<latLong.length; end++ ){
            let tempDistance = distance(start, end);
            if (bestDistance>tempDistance) bestDistance = tempDistance;
            if(bestDistance === 0) break;
        }
    }
    console.log(bestDistance);
    return bestDistance;
}


async function getLocalFlatTriangle (flatTriangle) {
    let wayPoints1 = await getLocalPoints(flatTriangle.index[0], optRadius);
    let wayPoints2 = await getLocalPoints(flatTriangle.index[1], optRadius);
    let wayPoints3 = await getLocalPoints(flatTriangle.index[2], optRadius);

    let triangles = await getTriangles(wayPoints1, wayPoints2, wayPoints3);
    if (triangles.length !== 0) {
        let sortedTriangles = await sortTriangles(triangles);
        console.log(sortedTriangles);
        console.log("---------------------------------------------------------------------------")
        let maxFlatTriangle = await getFastStartEndReverse3(sortedTriangles);
        console.log(maxFlatTriangle);
        if(maxFlatTriangle.totalDistance!=0) maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
        if(maxFlatTriangle.totalDistance==0) return flatTriangle;
        return maxFlatTriangle;

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

async function searchForDifferentWaypoints( waypointNumber, waypoint, triangleDistance ) {
    for ( let triangleIndex = sortedTriangles.length-1; triangleIndex>=0; triangleIndex--){
        if((sortedTriangles[triangleIndex][3]+(optRadius*3))<= triangleDistance)break;
        let newWaypoint = sortedTriangles[triangleIndex][waypointNumber];
        //if(distance(newWaypoint, waypoint) > optRadius) { // maxRadiusFlatTriangle
        if(await reduceWaypoints(newWaypoint, waypointNumber)) {
            await saveWaypoints(newWaypoint, waypointNumber);
            flatTrianglesCandidates.push(sortedTriangles[triangleIndex]);
        }
        //}
    }
    sortedTriangles.pop();
}

async function reduceWaypoints (waypoint, bucket) {
    let newWaypoint = true;
    for (let pointer = 0; pointer<waypoints[bucket].length; pointer++){
        if(bucket==2 && distance(waypoint, waypoints[bucket][pointer])<1 && waypoint<=waypoints[bucket][pointer]){

            waypoints[bucket][pointer]= waypoint;
            newWaypoint = false;
            break;
        }else
        if(bucket==0 && distance(waypoint, waypoints[bucket][pointer])<1 && waypoint>=waypoints[bucket][pointer]) {
            waypoints[bucket][pointer]= waypoint;
            newWaypoint = false;
            break;
        }else
        if (distance(waypoint, waypoints[bucket][pointer])<1){
            newWaypoint = false;
            break;

        }
    }
    return newWaypoint;

}


async function saveWaypoints (point, bucket) {
    waypoints[bucket].push(point);
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
    if (triangleResult === undefined) return triangleResult;
    if(triangleResult.totalDistance==0)return triangleResult;
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
        // console.log(waypoints1, waypoints2, waypoints3);
        let sortedTriangles = await sortTriangles(triangles);
        //console.log(sortedTriangles);
        maxFlatTriangle = await getFastStartEndReverse3(sortedTriangles, triangleResult);
        if (maxFlatTriangle.totalDistance==0) maxFlatTriangle = triangleResult;
        maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
        maxFlatTriangle.totalDistance = await getTotalTriangleDistance(maxFlatTriangle);
        flatTriangles.push(maxFlatTriangle);
        //console.log(flatTriangles);
        if(triangleResult.totalDistance<=maxFlatTriangle.totalDistance && radius<0.1) return await getAccurateFlatTriangle(maxFlatTriangle, radius+0.01);
        return await getAccurateFlatTriangle(maxFlatTriangle, radius+0.1);
        //else if(radius<1.2) return getAccurateFlatTriangle(maxFlatTriangle, 0.01);
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
    for (let index  = 0; index<waypoints.length-1; index += latlongInt){
        optimizedWaypoints.push(waypoints[index]);
    }
    optimizedWaypoints.push(latlongIndex);
    optimizedWaypoints.push(waypoints[waypoints.length-1]);
    return optimizedWaypoints.sort(function(a, b){return a - b});

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

async function optimizeLatLongIndex(points){

    let optimizedLatLongs=[];
    console.log(points);
    let checkedIndexes=[points.length];
    for (let index=0; index<points.length-1; index++){
        let latestIndex=points[index];
        if(checkedIndexes[index]===undefined){
            for (let currentIndex=index+1; currentIndex<points.length;currentIndex++){
                if(distance(points[index], points[currentIndex])<0.2){
                    checkedIndexes[currentIndex]=true;
                    latestIndex=points[currentIndex];
                }
            }
            optimizedLatLongs.push(latestIndex);
        }

    }

    return optimizedLatLongs;
}



async function getInitFlatTriangle() {
    let optimizedLatLong = [];
    let triangles = [];
    let maxFlatTriangle = [];
    let optimzedPoints;
    optRadius = 0.01;
    while(true) {
        optimizedLatLong.length=0;
        optimzedPoints = await getOptimizedLatLongInRadius(optRadius);
        optimizedLatLong = await getOptimizedLatLong(Math.min(200, optimzedPoints.length), optimzedPoints);
        if(optimizedLatLong.length<=200){

            console.log(optRadius);
            maxRadiusFlatTriangle=1;
            break;

        }
        optRadius+=0.01;
    }

    triangles = await getTriangles(optimizedLatLong, optimizedLatLong, optimizedLatLong);
    if (triangles.length !== 0) {

        sortedTriangles = await sortTriangles(triangles);
        console.log(sortedTriangles);
        maxFlatTriangle = await getFastStartEndReverse(sortedTriangles);
        maxFlatTriangle = await getBestStartEnd(maxFlatTriangle);
        //maxFlatTriangle = await getTotalTriangleDistance(maxFlatTriangle);
        //maxFlatTriangle.points = await getLatlong(maxFlatTriangle.index);
        return maxFlatTriangle;

    }
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

async function getFastStartEndReverse2 (sortedTriangles, currentBestFlatTriangle) {
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle;
    let minDistance = Number.MAX_VALUE;
    let noStartEnd = false;
    let triangle;
    let currentBestStart;
    let currentBestEnd;
    let currentTrianglePoint1 = -1;
    let currentTrianglePoint3 = Number.MAX_VALUE;
    for (triangle = sortedTriangles.length - 1; triangle >= 0; triangle -= 1) {

        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * count) {
            await domUpdate();
            count++;
        }
        let start;
        let end;
        if (sortedTriangles[triangle][3]<=currentBestFlatTriangle)break;
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        //if(maxFlatTriangle!==undefined && currentMaxFlatTriangle>=currentBestFlatTriangle.totalDistance)break;
        if(sortedTriangles[triangle][0] <= currentTrianglePoint1 && sortedTriangles[triangle][2] >= currentTrianglePoint3
            && currentBestStart<sortedTriangles[triangle][0] && currentBestEnd>sortedTriangles[triangle][2]){

        } else{
            if(noStartEnd===true && sortedTriangles[triangle][0]<=currentTrianglePoint1 && sortedTriangles[triangle][2]>=currentTrianglePoint3){}
            else{
                let startEnd = await getBestStartAndEnd(sortedTriangles[triangle]);
                start = startEnd[0];
                end = startEnd[1];
                let tempStartEnd = distance(start, end);
                if (tempStartEnd < minDistance) {
                    minDistance = tempStartEnd;
                    let distance = sortedTriangles[triangle][3] - minDistance;
                    if (minDistance<=sortedTriangles[triangle][3]*0.2 && distance > currentMaxFlatTriangle) {
                        currentMaxFlatTriangle = distance;
                        maxFlatTriangle = {
                            points: [],
                            index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], start, end],
                            totalDistance: distance
                        }
                        currentTrianglePoint1 = sortedTriangles[triangle][0];
                        currentTrianglePoint3 = sortedTriangles[triangle][2];
                        currentBestEnd = end;
                        currentBestStart = start;
                        noStartEnd= false;
                    }else{
                        noStartEnd = true;
                    }
                }
            }

        }
    }

    return maxFlatTriangle;
}

async function getFastStartEndReverse (sortedTriangles) {
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    let noStartEnd = false;
    let currentBestStart;
    let currentBestEnd;
    let currentTrianglePoint1 = -1;
    let currentTrianglePoint3 = Number.MAX_VALUE;
    let searchCount =0;
    for (triangle = sortedTriangles.length - 1; triangle >= 0; triangle = sortedTriangles.length-1)  {
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * count) {
            await domUpdate();
            count++;
        }
        if (searchCount>10000000)break;
        searchCount++;

        let start;
        let end;
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        if(maxFlatTriangle!==undefined)break;

        if(noStartEnd===true && sortedTriangles[triangle][0]<=currentTrianglePoint1 && sortedTriangles[triangle][2]>=currentTrianglePoint3){}
        else{
            let startEnd = await getBestStartAndEnd(sortedTriangles[triangle]);
            start = startEnd[0];
            end = startEnd[1];
            let tempStartEnd = distance(start, end);
            if (tempStartEnd < minDistance) {
                minDistance = tempStartEnd;
                let distance = sortedTriangles[triangle][3] - minDistance;
                if (minDistance<=(sortedTriangles[triangle][3]+(1))*0.2 && distance > currentMaxFlatTriangle) {
                    currentMaxFlatTriangle = distance;
                    maxFlatTriangle = {
                        points: [],
                        index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], start, end],
                        totalDistance: distance
                    }
                    console.log(maxFlatTriangle);
                    currentTrianglePoint1 = sortedTriangles[triangle][0];
                    currentTrianglePoint3 = sortedTriangles[triangle][2];
                    currentBestEnd = end;
                    currentBestStart = start;
                    noStartEnd=false;

                }else {
                    noStartEnd = true;
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

async function getFastStartEndReverse3 (sortedTriangles) {
    let currentMaxFlatTriangle = 0;
    let maxFlatTriangle;
    let minDistance = Number.MAX_VALUE;
    let triangle;
    let noStartEnd = false;
    let currentBestStart;
    let currentBestEnd;
    let currentTrianglePoint1 = -1;
    let currentTrianglePoint3 = Number.MAX_VALUE;
    let searchCount =0;

    let checkedTriple = [];
    for (triangle = sortedTriangles.length - 1; triangle >= 0; triangle = sortedTriangles.length-1)  {

        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * count) {
            await domUpdate();
            count++;
        }
        if (sortedTriangles[triangle][3] < currentMaxFlatTriangle) break;
        if(await checkTriples(sortedTriangles[triangle], checkedTriple, 0.05)){
            checkedTriple.push(sortedTriangles[triangle]);
            let start;
            let end;

            //if(maxFlatTriangle!==undefined)break;

            let startEnd = await getBestStartAndEnd(sortedTriangles[triangle]);
            start = startEnd[0];
            end = startEnd[1];
            let tempStartEnd = distance(start, end);
            if (tempStartEnd < minDistance) {
                minDistance = tempStartEnd;
                let distance = sortedTriangles[triangle][3] - minDistance;
                if (minDistance<=(sortedTriangles[triangle][3])*0.2 && distance > currentMaxFlatTriangle) {
                    currentMaxFlatTriangle = distance;
                    maxFlatTriangle = {
                        points: [],
                        index: [sortedTriangles[triangle][0], sortedTriangles[triangle][1], sortedTriangles[triangle][2], start, end],
                        totalDistance: distance
                    }
                    //console.log(maxFlatTriangle);
                    currentTrianglePoint1 = sortedTriangles[triangle][0];
                    currentTrianglePoint3 = sortedTriangles[triangle][2];
                    currentBestEnd = end;
                    currentBestStart = start;
                    noStartEnd=false;

                }else {
                    noStartEnd = true;
                }
            }
            sortedTriangles.pop();
        }
        if (searchCount>100)break;
        searchCount++;
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


async function getBestStartAndEnd (triangle){
    let minDistance = Number.MAX_VALUE;
    let bestStart;
    let bestEnd;
    for ( let start = triangle[0] ; start>=0; start -=10){
        for (let end = triangle[2] ; end <latLong.length; end +=10){
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