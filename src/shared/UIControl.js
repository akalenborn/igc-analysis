function setCircleDetectionOutput(timeSpent, circlesCount) {
    let msg;
    if (circlesCount > 1) {
        msg = circlesCount + " circles found!";
    } else if (circlesCount === 1) {
        msg = "1 circle found!";
    } else {
        msg = "no circles were detected";
    }

    circlesTimeSpent.textContent = "circle detection finished in " + timeSpent + " seconds: " + msg;
    showProgress(latLong.length);
}

function applyCircleDetectionProgress(value) {
    circleAlgorithmProgressBar.value = value;
    circleDetectionContainer.style.display = 'block';
}

function setCheckboxValue(checkbox, value) { checkbox.checked = value; }

function getTimeLineValue() {
    return parseInt(timeSliderElement.value, 10);
}

function showCheckboxes() {
    checkboxContainer.style.display = "block";
}

function showInfoContainers() {
    igcInfoContainer.style.display = "block";
    outputContainer.style.display = "block";
    dragAndDropParagraph.style.display = "none";
}

function setTimelineValue(timeIndex) {
    if(timeIndex < 0) return;
    updateTimeline(timeIndex, mapControl);
    timeSliderElement.value = timeIndex;
}

/* Initialisiert Ausgabe zusätzlicher Flug Informationen */
function initFlightInformation(){
    displayIGCHeader();
    displayKeyFigures(results.additionalData);
}

function displayIGCHeader(){
    showInfoContainers();
    const displayDate = moment(igcFile.recordTime[0]).format('LL');
    headerTableElement.innerHTML = '<tr></tr>' + '<th>Date</th>'
        + '<td>' + displayDate + '</td>';
    addToTable(igcFile.headers);
}

function addToTable(elementsArray) {
    for (const item of elementsArray) {
        headerTableElement.innerHTML += '<tr></tr>' + '<th>' + item.name + '</th>'
            + '<td>' + item.value + '</td>';
    }
}

function displayKeyFigures(keyFigures){
    addToTable([
        {name: "Total flight time", value: keyFigures.flightTime + " hours"},
        {name: "Total distance", value: getDistanceString(keyFigures.totalDistance)},
        {name: "Maximum speed", value: getSpeedString(keyFigures.maxSpeed)},
        {name: "Maximum altitude", value: getAltitudeString(keyFigures.maxAltitude)},
        {name: "Minimum altitude", value: getAltitudeString(keyFigures.minAltitude)},
        {name: "Maximum altitude above start", value: getAltitudeString(keyFigures.maxAltitudeAboveStart)},
        {name: "Total altitude gain", value: getAltitudeString(keyFigures.gainInAltitude)},
        {name: "Start location", value: getPositionString(keyFigures.startLocation)},
        {name: "Landing location", value: getPositionString(keyFigures.landingLocation)},
        {name: "Distance from start to landing", value: getDistanceString(keyFigures.startLandingDistance)}
    ]);
}

function getSpeedString(speed){
    if(altitudeUnits.value === "feet") return twoDigitsFixed(speed * 0.621371) + " mph";
    return speed + "km/h";
}

function getAltitudeString(altitude){
    if(altitudeUnits.value === "feet") return (altitude * altitudeConversionFactor).toFixed(0) + " feet";
    return altitude + "m";
}

function getDistanceString(distance){
    if(altitudeUnits.value === "feet") return twoDigitsFixed(distance * 0.621371) + " miles";
    return distance + "km";
}

function showIGCTasks(){
    // Show the task declaration if it is present.
    if (igcFile.task.coordinates.length > 0) {
        //eliminate anything with empty start line coordinates
        if (igcFile.task.coordinates[0][0] !== 0) {
            taskElement.style.display = 'block';
            //Now add TP numbers.  Change to unordered list
            if (igcFile.task.takeoff.length > 0) {
                taskListElement.innerHTML = '<li>' + 'Takeoff: ' + igcFile.task.takeoff + '</li>';
            }
            for (let j = 0; j < igcFile.task.names.length; j++) {
                switch (j) {
                    case 0:
                        taskListElement.innerHTML += '<li>' + 'Start: ' + igcFile.task.names[j] + '</li>';
                        break;
                    case (igcFile.task.names.length - 1):
                        taskListElement.innerHTML += '<li>' + 'Finish: ' + igcFile.task.names[j] + '</li>';
                        break;
                    default:
                        taskListElement.innerHTML += '<li>' + 'TP' + (j).toString() + ": " + igcFile.task.names[j] + '</li>';
                }
            }
            if (igcFile.task.landing.length > 0) {
                taskListElement.innerHTML += '<li>' + 'Landing: ' + igcFile.task.landing + '</li>';
            }
            mapControl.addTask(igcFile.task.coordinates, igcFile.task.names);
        }
    } else {
        taskElement.style.display = 'none';
    }

}