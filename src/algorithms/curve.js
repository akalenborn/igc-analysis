let _curve90 = [], _curve180 = [];
// Cache previous curve scores for optimization with Greedy Local Search (Hill Climbing).
// https://courses.cs.washington.edu/courses/cse573/12sp/lectures/04-lsearch.pdf
let _curve90PreviousScore = 0,
    _curve180PreviousScore = 0;

async function curveDetection(latLong, distances, radius) {
    setStartTime();
    console.time("curveDetection");
    let result;
    if (curveAlgorithm.value === "theta") {
        result = await findThetaCurves();
    } else {
        result = await findCurves(latLong, distances, 1, radius);
    }
    console.timeEnd("curveDetection");
    return result;
}

async function findCurves(latLong, distances, stepSize, radius) {
    for (let p0 = 0; p0 < distances.length; p0 += stepSize) {
        const p1 = getNextPointRecursive(radius, p0, distances),
            p2 = getNextPointRecursive(radius, p1, distances);

        if (p2 < 0) break; // no next point exists
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval) await domUpdate();

        const distP0P1 = distance(p1, p0),
            distP1P2 = distance(p2, p1),
            distP0P2 = distance(p2, p0);

        if (isCurve90(distP0P1, distP1P2, distP0P2, radius)) {
            onCurve90Detected([p0, p1, p2], distP0P1, distP1P2, distP0P2, radius);
        } else if (isCurve180(distP0P1, distP1P2, distP0P2, radius)) {
            onCurve180Detected([p0, p1, p2], distP0P1, distP1P2, distP0P2, radius);
        }

        // runtime optimization - skip points until distP0P1 might fulfill the straight-line criterion
        const skipIndices = Math.floor((radius - distP0P1 - radius * curveMaxDeviation) / maxPointDistance)
            - stepSize;
        if (skipIndices > 0) p0 += skipIndices;
    }
    return [_curve90, _curve180];
}

function onCurve90Detected(curve, distP0P1, distP1P2, distP0P2, radius) {
    const score = get90DegreeScore(distP0P1, distP1P2, distP0P2, radius);
    _curve90.push(curve);
    if (_curve90.length > 1) removeDuplicates(latLong, radius, _curve90PreviousScore, score, _curve90);
    _curve90PreviousScore = score;
}

function onCurve180Detected(curve, distP0P1, distP1P2, distP0P2, radius) {
    const score = get180DegreeScore(distP0P1, distP1P2, distP0P2, radius);
    _curve180.push(curve);
    if (_curve180.length > 1) removeDuplicates(latLong, radius, _curve180PreviousScore, score, _curve180);
    _curve180PreviousScore = score;
}

function isCurve90(distP0P1, distP1P2, distP0P2, radius) {
    return straightLineCondition(distP0P1, distP1P2, radius) &&
        distP0P2 > (1.44 * (1 - curveMaxDeviation)) * radius
        && distP0P2 < (1.44 * (1 + curveMaxDeviation)) * radius;
}

function isCurve180(distP0P1, distP1P2, distP0P2, radius) {
    return straightLineCondition(distP0P1, distP1P2, radius) &&
        radius && distP0P2 < curve180MaxGap * radius;
}

function straightLineCondition(distP0P1, distP1P2, radius) {
    return distP0P1 > (1 - curveMaxDeviation) * radius &&
        distP1P2 > (1 - curveMaxDeviation) * radius;
}

function get90DegreeScore(distP0P1, distP1P2, distP0P2, radius) {
    return distP0P1 ** 2 + distP1P2 ** 2
        - Math.abs(distP0P1 ** 2 + distP1P2 ** 2 - distP0P2 ** 2)
        - (radius - distP0P1) ** 2 - (radius - distP1P2) ** 2;
}

function get180DegreeScore(distP0P1, distP1P2, distP0P2, radius) {
    return Math.abs(distP0P1) + Math.abs(distP1P2) - Math.abs(distP0P2)
        - 2 * radius + Math.abs(distP0P1) + Math.abs(distP1P2);
}

function removeDuplicates(latLong, radius, previousScore, currentScore, curves) {
    const previousCurveEnd = curves[curves.length - 2][2];
    const currentCurveStart = curves[curves.length - 1][0];
    if (currentCurveStart >= previousCurveEnd) return "no duplicate";
    if (previousScore > currentScore) {
        curves.splice(-1, 1); // remove current element
    } else {
        curves.splice(-2, 1); // remove previous element
    }
    return "duplicate removed";
}

function calcDistances(latLong, stepSize = 1) {
    const distances = [];
    for (let i = stepSize; i < latLong.length; i += stepSize) {
        const dist = distance(i, i - stepSize);
        distances.push(dist);
    }
    return distances;
}
