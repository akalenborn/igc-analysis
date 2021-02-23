let _circles = [],
    domUpdateCount = 0;

async function circleDetection(useTheta = true) {
    setStartTime();
    _circles = [];
    // if circleDetection is called with useTheta=false, run the optimal circle detection
    if (useTheta && circleAlgorithm.value === "theta") {
        _circles = await findThetaCircles();
    } else {
        _circles = await findCircles();
    }
    return _circles;
}

async function findCircles() {
    for (let p0 = 0; p0 < latLong.length; p0++) {
        const currentCircleCandidates = [];
        p0 = fastForwardP0(p0);
        if (getCurrentRuntimeMilliseconds() > domUpdateInterval * (domUpdateCount + 1)) await showProgress(p0);

        for (let p1 = getFirstPossibleP1(p0); p1 < latLong.length; p1++) {
            if (pathLength(p0, p1) > circleMaxLength) break;

            // circle check - the order of conditions minimizes runtime
            if (circleGapCondition(p0, p1) && locallyOptimalP1(p0, p1) && circleDiameterCondition(p0, p1)) {
                currentCircleCandidates.push([p0, p1]);
                break;
            }
            // runtime optimization - skip points until p1 might fulfill the circleGap condition again
            const skipIndices = Math.floor((distance(p0, p1) - circleMaxGap) / maxPointDistance) - 1;
            if (skipIndices > 0) p1 += skipIndices;
        }
        processCircleCandidates(currentCircleCandidates);
    }
    return _circles;
}

async function showProgress(p0) {
    domUpdateCount++;
    if (getCurrentRuntimeMilliseconds() > runtimeModalTimeout && !modalWasOpened) showRuntimeInfoModal();
    await applyCircleDetectionProgress(
        getProgressValue(p0, latLong.length)
    );
    await domUpdate();
}

function processCircleCandidates(currentCircleCandidates) {
    while (currentCircleCandidates.length > 0) {
        if (multipleSubsequentCircles(currentCircleCandidates)) {
            if (noIntersection(currentCircleCandidates[0])) _circles.push(currentCircleCandidates[0]);
        } else {
            const bestCandidate = getP0OptimalCircle(currentCircleCandidates);
            _circles.push(bestCandidate);
        }
        currentCircleCandidates.shift();
    }
}

function multipleSubsequentCircles(circles) {
    if (circles.length === 0) return false;
    const endpointFirstCircle = circles[0][1];
    const startPointLastCircle = circles[circles.length - 1][0];
    if (endpointFirstCircle <= startPointLastCircle) return true;
}

function getP0OptimalCircle(circleCandidates) {
    let bestCandidate;
    let minimalGap = circleMaxGap;
    for (const candidate of circleCandidates) {
        const value = distance(candidate[0], candidate[1]);
        // optimization criterion is minimizing the circle gap.
        if (value < minimalGap) {
            minimalGap = value;
            bestCandidate = candidate;
        }
    }
    return bestCandidate;
}

function noIntersection(circle) {
    return _circles.length === 0 || circle[0] > getLastCircle()[1];
}

function fastForwardP0(p0) {
    // if p0 is smaller than the last circle's endpoint, fast-forward p0 to this endpoint
    if (_circles.length > 0 && getLastCircle()[1] > p0) p0 = getLastCircle()[1];
    return p0;
}

function getFirstPossibleP1(p0) {
    const firstPossibleP1 = getNextPointRecursive(0.05, p0, distances);
    if (firstPossibleP1 < 0) return "no point found within the minimum range";
    return firstPossibleP1;
}

function getProgressValue(currentIndex, arrayLength) {
    return (currentIndex / arrayLength) * 100;
}

function getOppositeCirclePoint(circumference, px) {
    return getNextPointRecursive(circumference / 2, px, distances);
}

function circleGapCondition(p0, p1) {
    return distance(p0, p1) < circleMaxGap; // alternative – relative circle gap: 0.2 * pathLength(p0, p1)
}

function circleDiameterCondition(p0, p1) {
    const circumference = pathLength(p0, p1);
    const diameter = circumference / Math.PI;
    for (let px = p0; px < p1; px++) {
        const opposite = getOppositeCirclePoint(circumference, px);
        if (opposite < 0) return true; // end of circle is reached
        const oppositeDistance = distance(px, opposite);
        if (oppositeDistance < (1 - circleDiameterMaxDeviation) * diameter) return false;
    }
    return true;
}

function locallyOptimalP1(p0, p1) {
    if (p1 + 1 >= latLong.length) return false;
    // is there a circle from p0 to p1+1 and does it have a smaller circle gap?
    return distance(p0, p1) <= distance(p0, p1 + 1) || !isCircle(p0, p1 + 1);
}

function getLastCircle() {
    if (_circles.length === 0) return false;
    return _circles[_circles.length - 1];
}

function isCircle(p0, p1) {
    if (p1 >= latLong.length) return false;
    return circleGapCondition(p0, p1) && circleDiameterCondition(p0, p1);
}