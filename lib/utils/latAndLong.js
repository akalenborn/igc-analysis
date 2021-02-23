/**
 * Generates a string representation for a given latitude.
 */
function getLatitudeString(position){
    const positionLatitude = getDegreeMinutes(Math.abs(position[0]));
    if (position[0] > 0) {
        return positionLatitude + "N";
    } else {
        return positionLatitude + "S";
    }
}

/**
 * Generates a string representation for a given longitude.
 */
function getLongitudeString(position){
    const positionLongitude = getDegreeMinutes(Math.abs(position[1]));
    if (position[1] > 0) {
        return positionLongitude + "E";
    } else {
        return positionLongitude + "W";
    }
}

/**
 * Generates a string representation for a given position
 * @param {number[]} position latitude and longitude
 * @returns {string}
 */
function getPositionString(position) {
    return getLatitudeString(position) + ",   " + getLongitudeString(position);
}

/**
 * Calculates the bearing from p0 to p1 in degrees.
 * 0° bearing is north, 90° east, 180° south, 270° west
 * Formula from: http://www.movable-type.co.uk/scripts/latlong.html.
 * Use radians (1 radian is about 57.2958 degrees);
 */
function getBearing(p0, p1) {
    const degreeToRadians = Math.PI / 180.0;
    const lat1 = p0[0] * degreeToRadians;
    const lon1 = p0[1] * degreeToRadians;
    const lat2 = p1[0] * degreeToRadians;
    const lon2 = p1[1] * degreeToRadians;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    let bearing = Math.atan2(y, x) / degreeToRadians;
    bearing = (bearing + 360.0) % 360.0;
    return bearing;
}

/**
 * Calculates all bearings once.
 */
function getBearings(){
    bearings = [];
    for (let i = 0; i < latLong.length - 1; i++) {
        bearings.push(getBearing(latLong[i], latLong[i+1]))
    }
    return bearings;
}

/**
 * Calculates the sum of all angles between subsequent vectors of a turn.
 */
function totalTurningAngle(p0){
    let angle = 0;
    while (validTurningAngle(p0, p0+1) && p0 < latLong.length - 2) {
        angle += Math.abs(getAngle(p0, p0+1));
        p0++;
    }
    return angle;
}

/**
 * Calculates the angle between the bearing of two points:
 * The calculation does not take into account the impact of the earth's curvature (which is very little).
 */
function getAngle(p0, p1) {
    return bearings[p0] - bearings[p1];
}

/**
 * Calculates a degree value with minutes for a given degree value.
 */
function getDegreeMinutes(degreeValue) {
    const wholeDegrees = Math.floor(degreeValue);
    const minuteValue = (60 * (degreeValue - wholeDegrees)).toFixed(3);
    return wholeDegrees + '\u00B0\u00A0' + minuteValue + '\u00B4';
}
