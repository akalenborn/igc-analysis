let _triangle = [];
let _optTriangle = [];
let count = 1;
let solutionIndex = [];
let endresult;
let distTable = [];

async function triangleDetection(){
    optLatLong = await getOptLatLong(triangleAlgorithm.value);
    setStartTime();

    if(triangleAlgorithmType.value == "standard"){
        _triangle = await getFastTriangle();
        if(optTriangleCheckbox.checked){
            _triangle = await getAccurateFaiTriangle(_triangle, Math.min(latLong.length/10, 1000));
        }
        return _triangle;
    }
    else if(triangleAlgorithmType.value == "optTest"){
        _optTriangle = await getExperimentalFaiTriangle();
        return _optTriangle;
    }

}

//main detection
async function getFastTriangle(){

    let triangleType;
    let tempTriangle = [];
    let maxFaiTriangle;
    let maxNTriangle;
    let faiTriangle = [];
    let nTriangle = [];


    let candSearchStart = window.performance.now();

    for(let i = 0; i < optLatLong.length-2; i++){
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval*count){
            await domUpdate();
            count++;
        }
        for(let j = i + 1; j < optLatLong.length-1; j++){
            for(let k = j + 1; k < optLatLong.length;k++){

                let distanceSum = 0;
                let d1 = distanceBetweenCoordinates(optLatLong[i],optLatLong[j]);
                let d2 = distanceBetweenCoordinates(optLatLong[j],optLatLong[k]);
                let d3 = distanceBetweenCoordinates(optLatLong[k], optLatLong[i]);
                let distArray = [d1,d2,d3];

                distanceSum +=  d1 + d2 + d3;
                tempTriangle = [i,j,k, distanceSum,d1,d2,d3];
                triangleType = getTriangleType(distArray,distanceSum);

                if(triangleType){
                    faiTriangle.push(tempTriangle);
                }
                else{
                    nTriangle.push(tempTriangle);
                }
            }
        }
    }

    let candSearchEnd =(window.performance.now() - candSearchStart)/1000;
    document.getElementById("opt-points").innerHTML = "Points considered: " + triangleAlgorithm.value ;
    document.getElementById("cand-search").innerHTML = "Default triangle detection finished in: " + candSearchEnd + " <br />";

    let sortedArr =  await sortArr(faiTriangle);
    maxFaiTriangle = await getFastFaiTriangle(sortedArr);
    //maxNTriangle = await getMaxNTriangle(sortArr(nTriangle))

    return maxFaiTriangle;
}

//main detection
async function getFastFaiTriangle(faiArray){
    let minDistance = 10000000;
    let currMaxFaiTriangle = 0;
    let maxFai;
    let s;

    let optCandSearchStart = window.performance.now();

    for(s=0; s < faiArray.length; s++){
        if(getCurrentRuntimeMilliseconds() > domUpdateInterval*count) {
            await domUpdate();
            count++;
        }
        //loop stops when the current MaxTriangleScore is bigger or equal than the TotalDist of current loop entry
      if(faiArray[s][3]<currMaxFaiTriangle){
            break;
        }
        //checken ob index der betrachteten dreieckspunkte im vgl zu vorherigen durchlauf und gefundenem startend min unterscheiden
        //finds the shortest start-end Distance for the current loop triangle
        for(let i = faiArray[s][0]; i>=0;i--){

            for(let j = faiArray[s][2]; j<optLatLong.length; j++){
                let tempIJ = distanceBetweenCoordinates(optLatLong[i],optLatLong[j]);
                if(tempIJ < minDistance){
                    minDistance = tempIJ;
                    let tempScore = faiArray[s][3] - minDistance;
                    if(minDistance<=faiArray[s][3]*0.2 && tempScore > currMaxFaiTriangle){
                        currMaxFaiTriangle = tempScore;
                        maxFai = {
                            type: "FAI-Triangle",
                            startP: optLatLong[i],
                            w1: optLatLong[faiArray[s][0]],
                            w12: faiArray[s][4].toFixed(2),
                            w1prcnt: (faiArray[s][4]/faiArray[s][3]*100).toFixed(2),
                            w2: optLatLong[faiArray[s][1]],
                            w23: faiArray[s][5].toFixed(2),
                            w2prcnt: (faiArray[s][5]/faiArray[s][3]*100).toFixed(2),
                            w3: optLatLong[faiArray[s][2]],
                            w31: faiArray[s][6].toFixed(2),
                            w3prcnt: (faiArray[s][6]/faiArray[s][3]*100).toFixed(2),
                            endP: optLatLong[j],
                            distTotal: faiArray[s][3].toFixed(2),
                            distStartEnd: minDistance.toFixed(2),
                            flightScore: currMaxFaiTriangle * 2,
                            listIndex: s,
                            lastIndex: 0
                        };
                    }
                }
            }
        }

    }
    let optCandSearchEnd = (window.performance.now() - optCandSearchStart)/1000;
    document.getElementById("opt-cand-search").innerHTML = "Optimal Candidate found after: " + optCandSearchEnd;

    return maxFai;
}

//optimizes main detection result
async function getAccurateFaiTriangle(initTriangleResult, radius){
    let higherAccRoute = await getOptLatLong(Math.min(5000,latLong.length));
    let accTriangle = await getPointsInRadius(initTriangleResult, higherAccRoute, radius);
    let finalFaiTriangle = [];

    for(let i = 0; i < accTriangle[1].length; i++){
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval*count){
            await domUpdate();
            count++;
        }

        for(let j = i + 1; j < accTriangle[2].length; j++){
            for(let k = j + 1; k < accTriangle[3].length; k++){

                //Check chronological order of indices
                if(accTriangle[1][i].index < accTriangle[2][j].index < accTriangle[3][k].index){
                    let distanceSum = 0;
                    let d1 = distanceBetweenCoordinates(accTriangle[1][i].point,accTriangle[2][j].point);
                    let d2 = distanceBetweenCoordinates(accTriangle[2][j].point,accTriangle[3][k].point);
                    let d3 = distanceBetweenCoordinates(accTriangle[3][k].point, accTriangle[1][i].point);
                    let distArray = [d1,d2,d3];
                    distanceSum +=  d1 + d2 + d3;

                    let tempTriangle = [i,j,k, distanceSum,d1,d2,d3];
                    let triangleType = getTriangleType(distArray,distanceSum);

                    if(triangleType){
                        finalFaiTriangle.push(tempTriangle);
                    }
                }
            }
        }
    }

    let sortedArr =  await sortArr(finalFaiTriangle);
    let currMin = 10000000000000;
    let currStartEnd;

    for(let z = 0; z < accTriangle[0].length; z++){
        for(let x = 0; x < accTriangle[4].length; x++){
            if(accTriangle[0][z].index < accTriangle[1][sortedArr[0][0]].index && accTriangle[4][x].index > accTriangle[3][sortedArr[0][2]].index){
                let startEnd = distanceBetweenCoordinates(accTriangle[0][z].point, accTriangle[4][x].point);
                if(startEnd < currMin){
                    currMin = startEnd;
                    currStartEnd = [z,x];
                }
            }
        }
    }

    let resultTriangle = {
        type: "FAI-Triangle",
        startP: accTriangle[0][currStartEnd[0]].point,
        w1: accTriangle[1][sortedArr[0][0]].point,
        w12: sortedArr[0][4],
        w1prcnt: (sortedArr[0][4]/sortedArr[0][3]*100).toFixed(2),
        w2: accTriangle[2][sortedArr[0][1]].point,
        w23: sortedArr[0][5],
        w2prcnt: (sortedArr[0][5]/sortedArr[0][3]*100).toFixed(2),
        w3: accTriangle[3][sortedArr[0][2]].point,
        w31: sortedArr[0][6],
        w3prcnt: (sortedArr[0][6]/sortedArr[0][3]*100).toFixed(2),
        endP: accTriangle[4][currStartEnd[1]].point,
        distTotal: sortedArr[0][3].toFixed(2),
        distStartEnd: currMin.toFixed(2),
        flightScore: (sortedArr[0][3] - currMin) * 2
    };

    return resultTriangle;
}

//experimental optimization attempt
async function getExperimentalFaiTriangle(){
    var faiTriangle = [];
    let legDistances = [];

    let candSearchStart = window.performance.now();

    for(var i = 0; i < optLatLong.length-1;i++){
        if(getCurrentRuntimeMilliseconds() > domUpdateInterval*count) {
            await domUpdate();
            count++;
        }
        for(var j = i + 1; j < optLatLong.length; j++){
            let d = distanceBetweenCoordinates(optLatLong[i],optLatLong[j]);
            let maxPossible = d / 0.28;
            // i index p1, j index p2, d distance between p1 and p2, maxpossible max possible triangle distance
            let maxTriangles = [i, j, d, maxPossible];


            faiTriangle.push(maxTriangles);
            legDistances.push(d);
        }
        distTable.push(legDistances);
    }

    faiTriangle.sort(function(a, b) {
        return b[3] - a[3];
    });

    let optTriangle = await contExperimentalFaiTriangle(faiTriangle);
    let finalMaxFai = {
        startP: optLatLong[optTriangle[0]],
        type: "FAI Triangle",
        w1: optLatLong[optTriangle[0]],
        w12: distanceBetweenCoordinates(optLatLong[optTriangle[0]], optLatLong[optTriangle[4]]),
        w1prcnt: (distanceBetweenCoordinates(optLatLong[optTriangle[0]], optLatLong[optTriangle[4]])/optTriangle[3]*100).toFixed(2),
        w2: optLatLong[optTriangle[4]],
        w23: distanceBetweenCoordinates(optLatLong[optTriangle[4]], optLatLong[optTriangle[1]]),
        w2prcnt: (distanceBetweenCoordinates(optLatLong[optTriangle[4]], optLatLong[optTriangle[1]])/optTriangle[3]*100).toFixed(2),
        w3: optLatLong[optTriangle[1]],
        w31: distanceBetweenCoordinates(optLatLong[optTriangle[0]], optLatLong[optTriangle[1]]),
        w3prcnt: (distanceBetweenCoordinates(optLatLong[optTriangle[0]], optLatLong[optTriangle[1]])/optTriangle[3]*100).toFixed(2),
        endP: optLatLong[optTriangle[1]],
        distTotal: optTriangle[2],
        distStartEnd: optTriangle[3]-optTriangle[2],
        flightScore: optTriangle[2] * 2
    }
    let candSearchEnd =(window.performance.now() - candSearchStart)/1000;
    document.getElementById("cand-search").innerHTML = "Experimental Method finished detection in: " + candSearchEnd;

    return new Promise( resolve => {
        resolve(finalMaxFai);
    });
}

//experimental optimization attempt
async function contExperimentalFaiTriangle(triArray){
    let currOpt = 0;
    let tempMax;

    for(let i = 0; i < triArray.length; i++){
        let tempArr = [];
        if(getCurrentRuntimeMilliseconds() > domUpdateInterval*count) {
            await domUpdate();
            count++;
        }

        if(currOpt > triArray[i][3]){
            break;
        }

        for(let j = 0; j < optLatLong.length; j++){
            let d1 = distanceBetweenCoordinates(optLatLong[j], optLatLong[triArray[i][0]]);
            let d2 = distanceBetweenCoordinates(optLatLong[j], optLatLong[triArray[i][1]]);
            let dsum = d1 + d2 + triArray[i][2];

            let pointOrder = [j, triArray[i][0], triArray[i][1]];
            pointOrder.sort((a, b) => a - b);

            let w1 = pointOrder[0];
            let w2 = pointOrder[1];
            let w3 = pointOrder[2];

            let isFai = await getTriangleType([d1, d2, triArray[i][2]], dsum);

            if(isFai){
                if(dsum > currOpt){
                    tempArr.push([w1,w3,dsum,w2]);
                }
            }
        }

        if(tempArr.length != 0){
            tempArr.sort(function(a, b) {
                return b[2] - a[2];
            });

            let currTempOpt=0;
            for(let k = 0; k < tempArr.length; k++){
                if(currTempOpt > tempArr[k][2]){
                    break;
                }
                tempMax = await getStartEnd(tempArr[k][0],tempArr[k][1], tempArr[k][2]);
                if(tempMax[1] > currTempOpt){
                    currTempOpt = tempMax[1];
                    solutionIndex = k;
                }
            }
            if(currTempOpt > currOpt){
                currOpt = currTempOpt;
                endresult = [tempArr[solutionIndex][0],tempArr[solutionIndex][1],currOpt,tempArr[solutionIndex][2],tempArr[solutionIndex][3]];
            }
        }
    }
    return endresult;
}

function sortArr(triangleArr){
    return new Promise(resolve => {
        setTimeout(function() {
            triangleArr.sort(function(a, b){return b[3]-a[3]});
            resolve(triangleArr);
        }, 0);
    });
}

async function getStartEnd(p1,p3, currTriDist){
    let currMin = Number.MAX_VALUE;
    let currStartEnd = [];

    for(let i = 0; i<=p1;i++){
        for(let j = p3; j<optLatLong.length; j++){
            let startEnd = distanceBetweenCoordinates(optLatLong[i], optLatLong[j]);
            if(startEnd <= currTriDist*0.2 && startEnd < currMin){
                currMin = startEnd;
                currStartEnd = [i,j];
            }
        }
    }

    return [currStartEnd, currTriDist - currMin];
}

function getTriangleType(distAll, triangleDistance){
    let faiCond = triangleDistance * 0.28;
    let isFai = true;

    distAll.forEach(function(dist){
        if(dist <= faiCond){
            isFai = false;
        }
    });

    return isFai;
}

async function getOptLatLong(maxPoints){
    let latlongInt = Math.round(latLong.length/maxPoints);
    let tempOptLatLong = [];

    for(let i = 0; i < latLong.length; i+=latlongInt){
        tempOptLatLong.push(latLong[i]);
    }

    return tempOptLatLong;
}

async function getPointsInRadius(initTriangleResult, higherAccRoute, radius){
    let start = [];
    let w1 = [];
    let w2 = [];
    let w3 = [];
    let end = [];

    //anpassen, sodass die zuweisung zu jeweiligem Punktepool besser wird, Überlappungen handlen
    for(let i = 0; i < higherAccRoute.length; i++){
        if(distanceBetweenCoordinates(higherAccRoute[i], initTriangleResult.startP) <= radius/1000){
            start.push(await getBucketItem(higherAccRoute[i],i));
        }
        if(distanceBetweenCoordinates(higherAccRoute[i], initTriangleResult.w1) <= radius/1000){
            w1.push(await getBucketItem(higherAccRoute[i],i));
        }
        if(distanceBetweenCoordinates(higherAccRoute[i], initTriangleResult.w2) <= radius/1000){
            w2.push(await getBucketItem(higherAccRoute[i],i));
        }
        if(distanceBetweenCoordinates(higherAccRoute[i], initTriangleResult.w3) <= radius/1000){
            w3.push(await getBucketItem(higherAccRoute[i],i));
        }
        if(distanceBetweenCoordinates(higherAccRoute[i], initTriangleResult.endP) <= radius/1000){
            end.push(await getBucketItem(higherAccRoute[i],i));
        }
    }

    return [start, w1, w2, w3, end];
}

async function getBucketItem(point, index){
    return {
        point: point,
        index: index
    }
}

/*async function getMaxNTriangle(nArray){
    let minNDistance = 10000000;
    let currMaxNTriangle = 0;
    let maxNTriangle;
    let n;


    for(n=0; n < nArray.length; n++){
        //loop stops when the current MaxTriangleScore is bigger or equal than the TotalDist of current loop entry
        if(nArray[n][3]<currMaxNTriangle){
            break;
        }
        //checken ob index der betrachteten dreieckspunkte im vgl zu vorherigen durchlauf und gefundenem startend min unterscheiden
        //finds the shortest start-end Distance for the current loop triangle
        for(let i = nArray[n][0]; i>=0;i--){
            for(let j = nArray[n][2]; j<alllatLong.length; j++){
                let tempDist = distanceBetween(alllatLong[i],alllatLong[j]);
                if(tempDist < minNDistance){
                    minNDistance = tempDist;
                    let tempScore = nArray[n][3] - minNDistance;
                    if(minNDistance<=nArray[n][3]*0.2 && tempScore > currMaxNTriangle){
                        currMaxNTriangle = tempScore;
                        maxNTriangle = {
                            type: "Triangle",
                            startP: alllatLong[i],
                            w1: alllatLong[nArray[n][0]],
                            w12: nArray[n][4],
                            w1prcnt: (nArray[n][4]/nArray[n][3]*100).toFixed(2),
                            w2: alllatLong[nArray[n][1]],
                            w23: nArray[n][5],
                            w2prcnt: (nArray[n][5]/nArray[n][3]*100).toFixed(2),
                            w3: alllatLong[nArray[n][2]],
                            w31: nArray[n][6],
                            w3prcnt: (nArray[n][6]/nArray[n][3]*100).toFixed(2),
                            endP: alllatLong[j],
                            distTotal: nArray[n][3],
                            distStartEnd: minNDistance,
                            flightScore: currMaxNTriangle * 2,
                            listIndex: n,
                            lastIndex: 0
                        };
                    }
                }
            }
        }

    }
    maxNTriangle.lastIndex = n;

    return new Promise( resolve => {
        resolve(maxNTriangle);
    });
}*/

/*async function getMaxFreeTrack(frTrArr){
    let tempMaxFreeTrack = 0;
    let tempStartIndex = 0;
    let tempEndIndex = 0;
    let tempMaxStart=0;
    let tempMaxEnd=0;
    let currMaxFreeTrack = 0;
    let maxTrack;

    let now = Date.now();
    for(let i = 0; i<frTrArr.length; i++){
        tempMaxFreeTrack=0;
        tempMaxStart=0;
        tempMaxEnd=0;

        for(let j = frTrArr[i][0]; j>=0; j--){
            let tempJ = distanceBetween(alllatLong[frTrArr[i][0]], alllatLong[j]);
            if(tempJ > tempMaxStart){
                tempMaxStart = tempJ;
                tempStartIndex = j;
            }
        }
        for(let k = frTrArr[i][2]; k<alllatLong.length; k++){
            let tempK = distanceBetween(alllatLong[frTrArr[i][2]], alllatLong[k]);
            if(tempK > tempMaxEnd){
                tempMaxEnd = tempK;
                tempMaxFreeTrack = tempMaxStart + frTrArr[i][3] + tempMaxEnd;
                tempEndIndex = k;
            }
        }

        if(tempMaxFreeTrack>currMaxFreeTrack){
            currMaxFreeTrack = tempMaxFreeTrack;
            maxTrack = {
                type: "Free Track",
                startP: alllatLong[tempStartIndex],
                w1: alllatLong[frTrArr[i][0]],
                w2: alllatLong[frTrArr[i][1]],
                w3: alllatLong[frTrArr[i][2]],
                endP: alllatLong[tempEndIndex],
                distTotal: currMaxFreeTrack,
                flightScore: currMaxFreeTrack * 1.5
            };
        }

    }

    return new Promise( resolve => {
        alert((Date.now()-now)/1000);
        resolve(maxTrack);
    });
}*/






