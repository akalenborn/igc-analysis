let curve90 = [],
    curve180 = [];


async function displayResults(results) {
    curve90 = results.shapeDetection.curve90;
    curve180 = results.shapeDetection.curve180;
    //setDisabledProperty();

    for (const algorithm of algorithms) {
        if (algorithm.result){
            if (algorithm.name != "triangle" && algorithm.name != "freeFlight" && algorithm.name != "flatTriangle") {
                displayShape(algorithm);
            } else {
                if (algorithm.name == "triangle") displayTriangle(algorithm);
                if (algorithm.name == "freeFlight") displayFreeFlight(algorithm);
                if (algorithm.name == "flatTriangle") displayFlatTriangle(algorithm);
            }
        }
    }
}

function setDisabledProperty() {
    for (const algorithm of algorithms) {
        if(algorithm.name!="triangle") {
            algorithm.checkbox.disabled = arrayIsEmpty(algorithm.result);
        }
    }
}

function displayTriangle(algorithm){
    if(!isNaN(algorithm.result.distTotal)){
    mapControl.addMarkerTo(algorithm.name, algorithm.result.startP);
    mapControl.addMarkerTo(algorithm.name, algorithm.result.endP);
    mapControl.addTriangle(algorithm, algorithm.color);
    }

    displayTriangleInfo();
    displayRuntimeInfo();
}

//display markers for startpoint, endpoint and waypoints
//display a line between all the points
function displayFreeFlight (algorithm){
    displayMarkers(algorithm.name, algorithm.result.points);
    mapControl.addLine(algorithm, algorithm.color);
    displayFreeFlightInfo();
}

function displayFlatTriangle(algorithm){
    displayMarkers(algorithm.name, algorithm.result.points);
    mapControl.addFlachesDreieck(algorithm, algorithm.color);
    displayFlatTriangleInfo();

}

// displays the markers for the given points
function displayMarkers ( name , points ) {
    for ( let point = 0; point < points.length; point++ ) {
        mapControl.addMarkerTo(name, points[point]);
    }
}



function displayFlatTriangleInfo(){
    flatTriangleInfoContainer.innerHTML =
        '<table id="flatTriangleInfo" class="table table-sm">' +
        '<tbody>'+
        displayFlightscore(results.shapeDetection.flatTriangle.flightScore)+
        displayFlightType(results.shapeDetection.flatTriangle.type)+
        displayTotalDistance(results.shapeDetection.flatTriangle.totalDistance)+
        '</tbody>' +'</table>';
    // }
    flatTriangleInfoContainer.style.display = "block";
    flatTriangleResultContainer.style.display = "flex";
}
function displayFreeFlightInfo(){
    // if (results.shapeDetection.freeFlight.waypoints.length == 0) {
    freeFlightInfoContainer.innerHTML =
        '<table id="freeFlightInfo" class="table table-sm">' +
        '<tbody>'+
        displayFlightscore(results.shapeDetection.freeFlight.flightScore)+
        displayFlightType(results.shapeDetection.freeFlight.type)+
        displayTotalDistance(results.shapeDetection.freeFlight.totalDistance)+
        displayDistanceBetweenPoints(results.shapeDetection.freeFlight)+
        '</tbody>' +'</table>';
    // }
    freeFlightInfoContainer.style.display = "block";
    freeFlightResultContainer.style.display = "flex";

}

function displayDistanceBetweenPoints (flightParameters) {
    if ( flightParameters.waypoints.length == 0){
        return ('<tr><th>Distance between start and end:</th>' +
            '<td>' + flightParameters.distanceBetweenPoints[0] + '</td>'+
            '</tr>');
    }

    if (flightParameters.waypoints.length != 0) {

        let output ="";
        output = '<tr><th>Distance between start and waypoint1:</th>' +
            '<td>' + flightParameters.distanceBetweenPoints[0] + '</td>'+
            '</tr>';
        for (let waypoint = 1; waypoint < flightParameters.waypoints.length; waypoint++) {
            output = output + '<tr><th>Distance between waypoint'+(waypoint)+
                ' and waypoint'+(waypoint+1)+':</th>' +
                '<td>' + flightParameters.distanceBetweenPoints[waypoint] + '</td>'+
                '</tr>';
        }
        output = output + '<tr><th>Distance between waypoint'+flightParameters.waypoints.length+
            ' and end:</th>' +
            '<td>' + flightParameters.distanceBetweenPoints[flightParameters.distanceBetweenPoints.length-1] + '</td>'+
            '</tr>';
        return output;
    }
}


function displayFlightscore (score) {
    return ('<tr><th>Flight Score:</th>' +
        '<td>' + score + '</td>'+
        '</tr>');
}

function displayFlightType (type) {
    return ('<tr><th>Type:</th>' +
        '<td>' + type + '</td>'+
        '</tr>');
}

function displayTotalDistance (distance) {
    return ('<tr><th>Total Distance:</th>' +
        '<td>' + distance + "km" + '</td>'+
        '</tr>');
}

function displayTriangleInfo(){
    triangleInfoContainer.innerHTML =
        '<table id="triangleInfo" class="table table-sm">' +
        '<tbody>' +
        '<tr>' +
        '<th>Flight Score:</th>' +
        '<td>' + results.shapeDetection.triangle.flightScore + '</td>'+
        '</tr>'+
        '<tr>' +
        '<tr>' +
        '<th>Type:</th>' +
        '<td>' + results.shapeDetection.triangle.type + '</td>'+
        '</tr>'+
        '<tr>' +
        '<th>Total Distance:</th>' +
        '<td>' + results.shapeDetection.triangle.distTotal + "km" + '</td>'+
        '</tr>'+
        '<tr>' +
        '<tr>'
        +'<th>Leg 1:</th>' +
        '<td>' +  + results.shapeDetection.triangle.w12+ "km" +
        " - " + results.shapeDetection.triangle.w1prcnt+ "%" + '</td>'+
        '</tr>'+
        '<tr>'
        +'<th>Leg 2:</th>' +
        '<td>' +  results.shapeDetection.triangle.w23 + "km" +
        " - " + results.shapeDetection.triangle.w2prcnt+ "%" + '</td>'+
        '</tr>'+
        '<tr>'
        +'<th>Leg 3:</th>' +
        '<td>' + results.shapeDetection.triangle.w31  + "km" +
        " - " + results.shapeDetection.triangle.w3prcnt+ "%" + '</td>'+
        '</tr>'+
        '<tr>'
        +'<th>Start to End Distance:</th>' +
        '<td>' + results.shapeDetection.triangle.distStartEnd + "km" + '</td>'+
        '</tr>'+
        '</tbody>' +'</table>';

    triangleInfoContainer.style.display = "block";

}

function displayRuntimeInfo(){
    triangleRuntimeContainer.innerHTML =
        '<table id="triangleInfo" class="table table-sm">' +
        '<tbody>' +
        '<tr>' +
        '<th>Detection finished in:</th>' +
        '<td>' + results.shapeDetection.triangle.runtimeInfo + '</td>'+
        '</tr>'+
        '<tr>' +
        '<tr>' +
        '<th>Points considered:</th>' +
        '<td>' + results.shapeDetection.triangle.consideredPoints + '</td>'+
        '</tr>'+
        '<tr>' +
        '<th>Total Track Points:</th>' +
        '<td>' + results.shapeDetection.triangle.totalPoints + '</td>'+
        '</tr>'+
        '<tr>' +
        '<th>Radius Accuracy:</th>' +
        '<td>' + results.shapeDetection.triangle.radiusAcc  + '</td>'+
        '</tr>'+
        '</tbody>' +'</table>';

    triangleResultContainer.style.display = "flex";
}


function displayShape(algorithm) {
        for (const shape of algorithm.result) {
            mapControl.addMarkerTo(algorithm.name, latLong[shape[0]]);
            const points = latLong.slice(shape[0], lastElementOfArray(shape) + 1);
            mapControl.addShape(points, algorithm.color);
        }
}

function initCheckboxes(algorithms){
    let eventFn;

    for (let i = 0; i < algorithms.length; i++) {
        algorithms[i].checkbox.addEventListener('change', eventFn = handleCheckboxes.bind(algorithms[i].checkbox, algorithms[i]));
        eventListeners[i] = {
            elem: algorithms[i].checkbox,
            fn: eventFn
        };
    }

    checkboxContainer.style.display = "block";
}

function handleCheckboxes(algorithm){
    storePreference(algorithm.name, algorithm.checkbox.checked);
    if (!mapControl) return;

    if (algorithm.checkbox.checked) {
        if(algorithm.result){
            if (algorithm.name != "triangle" && algorithm.name != "freeFlight" && algorithm.name != "flatTriangle") {
                displayShape(algorithm);
            } else {
                if (algorithm.name == "triangle") displayTriangle(algorithm);
                if (algorithm.name == "freeFlight") displayFreeFlight(algorithm);
                if (algorithm.name == "flatTriangle") displayFlatTriangle(algorithm);
            }
        }
    } else {
        mapControl.clearLayer(algorithm.name);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    curveAlgorithm.addEventListener('change', () => {
        storePreference("curveAlgorithm", curveAlgorithm.value);
    });

    circleAlgorithm.addEventListener('change', () => {
        storePreference("circleAlgorithm", circleAlgorithm.value);
    });

    triangleAlgorithm.addEventListener('change', () => {
        storePreference("triangleAlgorithm", triangleAlgorithm.value);
    });

});
