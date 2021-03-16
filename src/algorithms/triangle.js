let _triangle = [];
let _optTriangle = [];
let count = 1;
let optCount = 1;
let tempmax;
let solutionIndex = [];
let endresult;


async function triangleDetection(){
    optLatLong = await getOptLatLong(triangleAlgorithm.value);
    setStartTime();

    if(triangleAlgorithmType.value == "standard"){
        _triangle = await findTriangle();
        return _triangle;

    }
    else if(triangleAlgorithmType.value == "optTest"){
        _optTriangle = await optTriangleSearch();
        return _optTriangle;
    }

}

async function optTriangleSearch(){
    var faiTriangle = [];
    let candSearchStart = window.performance.now();

    for(var i = 0; i < optLatLong.length-1;i++){
        if(getCurrentRuntimeMilliseconds() > domUpdateInterval*count) {
            await domUpdate();
            count++;
        }
        for(var j = i + 1; j < optLatLong.length; j++){
            let d = distanceBetweenCoordinates(optLatLong[i],optLatLong[j]);
            let maxPossible = d / 0.28;
            let maxTriangles = [i, j, d, maxPossible];
            // i index p1, j index p2, d distance between p1 and p2, maxpossible max possible triangle distance

            faiTriangle.push(maxTriangles);
        }
    }

    faiTriangle.sort(function(a, b) {
        return b[3] - a[3];
    });

    let optTriangle = await getOptFaiTriangle(faiTriangle);

    let finalMaxFai = {
        startP: optLatLong[optTriangle[0]],
        type: "Triangle",
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
    document.getElementById("cand-search").innerHTML = "Opt FAI detection finished in: " + candSearchEnd;

    return new Promise( resolve => {
        resolve(finalMaxFai);
    });
}

async function getOptFaiTriangle(triArray){
    let currOpt = 0;
    let currOptPoints = [];
    let maxFaiTriangle;

    let optStart, optW1, optW2, optW3, optEnd;

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

            let isFai = getTriangleType([d1, d2, triArray[i][2]], dsum);

            let pointOrder = [j, triArray[i][0], triArray[i][1]];
            pointOrder.sort((a, b) => a - b);

            let w1 = pointOrder[0];
            let w2 = pointOrder[1];
            let w3 = pointOrder[2];

            if(isFai){
                tempArr.push([w1,w3,dsum,w2]);
            }
        }

        if(tempArr.length != 0){
            if(tempArr[0][2] > currOpt){
                tempArr.sort(function(a, b) {
                    return b[2] - a[2];
                });

                let currTempOpt=0;
                for(let k = 0; k < tempArr.length; k++){
                    //alert("Schenkel: "+ i + " index k: " + k + " Curr Temp best: " + currTempOpt + " min Dist:" + tempArr[tempArr.length-1][2] + " max Dist: " + tempArr[0][2]);
                    if(currTempOpt > tempArr[k][2]){
                        break;
                    }

                    tempMax = await getStartEnd(tempArr[k][0],tempArr[k][1], tempArr[k][2]);
                    if(tempMax[1] > currTempOpt){
                        currTempOpt = tempMax[1];
                        solutionIndex = k;
                        //Start, W1, W2, W3, End, DistanceTotal, Leg1, Leg2, Leg3
                        //currOptPoints = [tempMax[0][0], tempArr[k][0],tempArr[k][1],tempArr[k][2], tempMax[0][1], tempArr[k][3], tempArr[k][4], tempArr[k][5], tempArr[k][6], tempMax[2]];

                    }
                }

                if(currTempOpt > currOpt){
                    currOpt = currTempOpt;
                    endresult = [tempArr[solutionIndex][0],tempArr[solutionIndex][1],tempMax[1],tempArr[solutionIndex][2],tempArr[solutionIndex][3]];
                    //maxFaiTriangle = getMaxFaiTriangleInfo(currOptPoints);

                }
            }
        }
    }

    return endresult;
}

async function findTriangle(){

    let triangleType;
    let tempTriangle = [];
    let maxFaiTriangle;
    let maxNTriangle;
    let maxFreeTrack;
    let faiTriangle = [];
    let nTriangle = [];
    //let freeTrack = [];

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
                //freeTrack.push(tempTriangle);
            }
        }
    }

    let candSearchEnd =(window.performance.now() - candSearchStart)/1000;
    document.getElementById("opt-points").innerHTML = "Points considered: " + triangleAlgorithm.value ;
    document.getElementById("cand-search").innerHTML = "Default triangle detection finished in: " + candSearchEnd + " <br />";

    let sortedArr =  await sortArr(faiTriangle);
    maxFaiTriangle = await getMaxFaiTriangle(sortedArr);
    //maxNTriangle = await getMaxNTriangle(sortArr(nTriangle));
    //maxFreeTrack = await getMaxFreeTrack(sortArr(freeTrack));

    return maxFaiTriangle;
}

async function getMaxFaiTriangle(faiArray){
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

/*function getMaxFaiTriangleInfo(faiResultArr){
    return {
        type: "FAI-Triangle",
        startP: optLatLong[faiResultArr[0]],
        w1: optLatLong[faiResultArr[1]],
        w12: faiResultArr[6],
        w1prcnt: (faiResultArr[6]/faiResultArr[5]*100).toFixed(2),
        w2: optLatLong[faiResultArr[2]],
        w23: faiResultArr[7],
        w2prcnt: (faiResultArr[7]/faiResultArr[5]*100).toFixed(2),
        w3: optLatLong[faiResultArr[3]],
        w31: faiResultArr[8],
        w3prcnt: (faiResultArr[8]/faiResultArr[5]*100).toFixed(2),
        endP: faiResultArr[4],
        distTotal: faiResultArr[5].toFixed(2),
        distStartEnd: faiResultArr[9].toFixed(2),
        flightScore: faiResultArr[5] * 2
    };
}*/

async function getOptLatLong(maxPoints){
    let latlongInt = Math.round(latLong.length/maxPoints);
    let tempOptLatLong = [];

    for(let i = 0; i < latLong.length; i+=latlongInt){
        tempOptLatLong.push(latLong[i]);
    }

    return tempOptLatLong;
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

/*function drawTriangle(trilatLong){
    let faiStart= L.marker(trilatLong[0].startP).addTo(mymap).bindPopup("Start");
    let p2 = L.marker(trilatLong[1]).addTo(mymap).bindPopup("W1");
     let p3= L.marker(trilatLong[2]).addTo(mymap).bindPopup("W2");
     let p4= L.marker(trilatLong[3]).addTo(mymap).bindPopup("W3");
    let faiEnd= L.marker(trilatLong[0].endP).addTo(mymap).bindPopup("End");

    let triStart= L.marker(trilatLong[1].startP).addTo(mymap).bindPopup("Start");
    let triEnd= L.marker(trilatLong[1].startP).addTo(mymap).bindPopup("Start");


    let faiPoly = L.polygon([trilatLong[0].w1,trilatLong[0].w2,trilatLong[0].w3], {color:"green"}).addTo(mymap);
    let trianglePoly = L.polygon([trilatLong[1].w1,trilatLong[1].w2,trilatLong[1].w3], {color:"yellow"}).addTo(mymap);
    let freeTrack = L.polyline([trilatLong[2].startP,trilatLong[2].w1,trilatLong[2].w2,trilatLong[2].w3,trilatLong[2].endP], {color:"red"}).addTo(mymap);

    document.getElementById("calcStatus").innerHTML = "Triangle Calculation ended after: " + after + " sec";
    document.getElementById("maxDistance").innerHTML = "Triangle Total Distance: " + trilatLong[0].distTotal + " at List index: " + trilatLong[0].lastIndex;
    document.getElementById("aufgabentyp").innerHTML = "Aufgabentyp: " + trilatLong[0].type;
    document.getElementById("distStartEnd").innerHTML = "Distance Start to End latLong: " + trilatLong[0].distStartEnd;
    document.getElementById("flightscore").innerHTML = "Total Flight Score: " + trilatLong[0].flightScore;
    document.getElementById("w12").innerHTML = "Schenkel1: " + trilatLong[0].w12 + " - " + trilatLong[0].w1prcnt + "%";
    document.getElementById("w23").innerHTML = "Schenkel2: " + trilatLong[0].w23 + " - " + trilatLong[0].w2prcnt + "%";
    document.getElementById("w31").innerHTML = "Schenkel3: " + trilatLong[0].w31 + " - " + trilatLong[0].w3prcnt + "%";


    return [faiStart, faiEnd, triStart, triEnd, faiPoly, trianglePoly];
}*/





