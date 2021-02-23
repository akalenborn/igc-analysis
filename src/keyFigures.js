function getKeyFigures() {
    return {
        flightTime: getFlightTime(),
        totalDistance: getTotalDistance(),
        maxSpeed: getMaxSpeed(),
        minAltitude: getMinAltitude(),
        maxAltitude: getMaxAltitude(),
        maxAltitudeAboveStart: getMaxAltitudeAboveStart(),
        totalAltitudeGain: getTotalAltitudeGain(),
        startLocation: getStartLocation(),
        landingLocation: getLandingLocation(),
        startLandingDistance: getStartLandingDistanceKM()
    }
}

function getFlightTime() {
    const firstRecord = igcFile.recordTime[0];
    const lastRecord = igcFile.recordTime[igcFile.recordTime.length-1];
    const flightTimeMS = moment(lastRecord).diff(moment(firstRecord));

    return moment(flightTimeMS).format('HH:mm:ss');
}

function getTotalDistance() {
    return twoDigitsFixed(
        distances.reduce((a, b) => a + b)
    );
}

function getMaxSpeed() {
    if(igcFile.recordTime.length < 1) return null;
    let maxSpeed = 0;
    let moments = [ moment(igcFile.recordTime[0]) ];
    for (let i = 0; i < distances.length; i++) {
        moments.push(moment(igcFile.recordTime[i+1])); // recordTime[i+1] corresponds to distances[i]
        const h = moments[i+1].diff(moments[i]) / 1000 / 60 / 60;
        const km = distances[i];
        if ((km/h) > maxSpeed) maxSpeed = km/h;
    }
    return twoDigitsFixed(maxSpeed);
}

function getMinAltitude() {
    let minAltitude = Number.MAX_VALUE;
    for (let i = 0; i < igcFile.gpsAltitude.length; i++) {
        const altitude = igcFile.gpsAltitude[i];
        if (altitude < minAltitude) minAltitude = altitude;
    }
    return minAltitude;
}

function getMaxAltitude() {
    let maxAltitude = Number.MIN_VALUE;
    for (let i = 0; i < igcFile.gpsAltitude.length; i++) {
        const altitude = igcFile.gpsAltitude[i];
        if (altitude > maxAltitude) maxAltitude = altitude;
    }
    return maxAltitude;
}

function getMaxAltitudeAboveStart() {
    return getMaxAltitude() - igcFile.gpsAltitude[0];
}

function getTotalAltitudeGain(){
    let totalAltitude = 0;
    let altitudeDiff;
    for (let i = 1; i < igcFile.gpsAltitude.length; i++) {
        altitudeDiff = igcFile.gpsAltitude[i] - igcFile.gpsAltitude[i-1];
        if (altitudeDiff > 0) totalAltitude += altitudeDiff;
    }
    return totalAltitude;
}

function getStartLocation() {
    return latLong[0];
}

function getLandingLocation() {
    return latLong[latLong.length-1];
}

function getStartLandingDistanceKM() {
    return twoDigitsFixed(distance(0, distances.length));
}

function twoDigitsFixed(value){
    return +value.toFixed(2)
}