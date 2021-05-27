'use strict';

document.getElementById("startAnalysis").addEventListener("click", async () => {
    await resetMap();
    await resetResults();

    await displayIgc(mapControl);
    hideTriangleContainer();

    await runAlgorithms(igcFile, getAnalysisPreferences());
});

async function runAlgorithms(track, activeAlgorithms) {
    showPendingBox();
    let curves;

    for(let i = 0; i < activeAlgorithms.length; i++){
        switch (activeAlgorithms[i].name) {
            case "curve90":
            case "curve180":
                if(curves == null){
                    curves = await curveDetection(track.latLong, distances, 0.3);
                    getResultObject(curves);
                }
                break;
            case "circle":
                results.shapeDetection.circle = await circleDetection();
                setCircleDetectionOutput(getCurrentRuntime(), _circles.length);
                algorithms[2].result = results.shapeDetection.circle;
                break;
            case "eight":
                results.shapeDetection.eight = await eightDetection();
                algorithms[3].result = results.shapeDetection.eight;
                break;
            case "triangle":
                results.shapeDetection.triangle = await triangleDetection();
                algorithms[4].result = results.shapeDetection.triangle;
                break;
            default:
        }
    }

    results.igcHeader = getIGCHeader();
    results.additionalData = getKeyFigures();
    await displayResults(results, mapControl);
    initCheckboxes(algorithms);
    closePendingBox(results);
    closeRuntimeInfoModal();

    return results;
}

function getResultObject(curves) {
    results.shapeDetection.curve90 = curves[0];
    results.shapeDetection.curve180 = curves[1];
    algorithms[0].result = curves[0];
    algorithms[1].result = curves[1];
}

async function initAlgorithmVariables(track) {
    _curve90 = [];
    _curve180 = [];
    _circles = [];
    latLong = track.latLong;
    distances = calcDistances(latLong);
    bearings = await getBearings();
    maxPointDistance = Math.max(...distances);
    modalWasOpened = false;
}

function getIGCHeader() {
    const igcHeader = getIGCHeaderFrame();
    return setHeaderData(igcHeader);
}

function getIGCHeaderFrame() {
    return {
        date: moment(igcFile.recordTime[0]).format('LL'),
        pilotName: null,
        gliderType: null,
        gliderID: null,
        gpsDatum: null,
        firmwareVersion: null,
        hardwareVersion: null,
        flightRecorderType: null,
        gpsTracker: null,
        pressureSensor: null
    };
}

function setHeaderData(igcHeader) {
    for (let headerIndex = 0; headerIndex < igcFile.headers.length; headerIndex++) {
        const name = igcFile.headers[headerIndex].name;
        const value = igcFile.headers[headerIndex].value;
        switch (name) {
            case "Pilot":
                igcHeader.pilotName = value;
                break;
            case "Glider type":
                igcHeader.gliderType = value;
                break;
            case "Glider ID":
                igcHeader.gliderID = value;
                break;
            case "GPS Datum":
                igcHeader.gpsDatum = value;
                break;
            case "Firmware version":
                igcHeader.firmwareVersion = value;
                break;
            case "Hardware version":
                igcHeader.hardwareVersion = value;
                break;
            case "Flight recorder type":
                igcHeader.flightRecorderType = value;
                break;
            case "GPS":
                igcHeader.gpsTracker = value;
                break;
            case "Pressure sensor":
                igcHeader.pressureSensor = value;
                break;
        }
    }
    return igcHeader;
}
