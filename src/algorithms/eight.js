let _customCircles = [];

async function eightDetection() {
    console.time("eightDetection");
    const eights = await findEights(latLong, distances);
    console.timeEnd("eightDetection");
    return eights;
}

async function findEights() {
    _customCircles = await runCircleDetectionWithCustomParameters();
    // _customCircles = results.shapeDetection.circle;
    const eights = [];
    for (let i = 0; i < _customCircles.length - 1; i++) {
        // One circle must be a right, the other a left turn
        if (!eightGapCondition(i, i+1) || sameTurningDirection(i, i+1)) continue;

        if (noCircleIntersection(_customCircles[i], _customCircles[i+1]) && noEightIntersection(eights, _customCircles[i])) {
            eights.push([_customCircles[i][0], _customCircles[i+1][1]])
        }

    }
    return eights;
}

async function runCircleDetectionWithCustomParameters() {
    const previousCircleDiameterMaxDeviation = circleDiameterMaxDeviation;
    circleDiameterMaxDeviation = eightDiameterMaxDeviation;
    const circles = await circleDetection(false);
    circleDiameterMaxDeviation = previousCircleDiameterMaxDeviation;
    return circles;
}

function noCircleIntersection(circle1, circle2) {
    const center1 = getCenterPoint(circle1[0], circle1[1]);
    const radius1 = getRadius(circle1, center1);

    const center2 = getCenterPoint(circle2[0], circle2[1]);
    const radius2 = getRadius(circle2, center2);

    const centerDistance = distanceBetweenCoordinates(center1, center2);
    return centerDistance >= (radius1 + radius2);
}

function noEightIntersection(eights, circle) {
    if (eights.length === 0) return true;
    const lastEight = eights[eights.length - 1];
    const lastEndPoint = lastEight[1];
    const newStartPoint = circle[0];
    return newStartPoint >= lastEndPoint;
}

function getRadius(circle, center) {
    return distanceBetweenCoordinates(latLong[circle[0]], center);
}

function getCenterPoint(p0, pn) {
    const px = p0 + Math.floor((pn - p0) / 2);
    return [(latLong[p0][0] + latLong[px][0]) / 2, (latLong[p0][1] + latLong[px][1]) / 2];
}

function eightGapCondition(i, j){
    return eightGap(i, j) / combinedPathLength(i, j) < maxEightGapPercentage;
}

function combinedPathLength(i, j) {
    const circles = _customCircles;
    return pathLength(circles[i][0], circles[j][1]);
}

function eightGap(i, j) {
    return pathLength(_customCircles[i][1], _customCircles[j][0]);
}

function sameTurningDirection(i, j){
    const circleI = _customCircles[i];
    const circleJ = _customCircles[j];
    return getTurningDirection(circleI[0], circleI[1]) === getTurningDirection(circleJ[0], circleJ[1]);
}