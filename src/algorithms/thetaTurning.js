async function findThetaCurves(){
    thetaTurnings = getThetaTurnings();
    const theta90 = [], theta180 = [];
    for(const turning of thetaTurnings){
        const angle = Math.abs(getAngle(turning[0], turning[1]-1));
        if(angle > 90 * (1- curveMaxDeviation) && angle < 90 * (1+ curveMaxDeviation)) {
            // check that the turning isn't longer than necessary
            // (a 450 degree turn also ends with a 90 degree angle towards the start vector)
            if(totalTurningAngle(turning[0]) > angle) continue;
            theta90.push(turning);
        }
        if(angle > 180 * (1- curveMaxDeviation) && angle < 180 * (1+ curveMaxDeviation)) {
            if(totalTurningAngle(turning[0]) > angle) continue;
            theta180.push(turning);
        }
    }
    return [theta90, theta180];
}

async function findThetaCircles() {
    const thetaCircles = [];
    for (let i = 0; i < latLong.length - 2; i++) {
        let p0 = i, p1 = i + 1, p2 = i + 2;
        while (validTurningAngle(p0, p1) && p2 < latLong.length) {
            if (p2 > i + 5 && circleGapCondition(i, p2)) {
                thetaCircles.push([i, p2]);
                i = p2;
            }
            p0++, p1++, p2++;
        }
    }

    return thetaCircles;
}

function getThetaTurnings(){
    const turnings = [];
    for (let i = 0; i < latLong.length - 2; i++) {
        let p0 = i, p1 = i + 1;
        while (validTurningAngle(p0, p1) && p1 < latLong.length - 1) {
            p0++; p1++;
        }
        if(p0 > i) {
            turnings.push([i, p1]);
            i = p1;
        }
    }
    return turnings;
}

function validTurningAngle(p0, p1) {
    if (p1 + 1 >= latLong.length) return false;
    let angle = getAngle(p0, p1);
    angle = (angle + 360.0) % 360.0; // ensure that the resulting angle is a positive number
    return angle > thetaMinValue && angle < thetaMaxValue;
}

function getTurningDirection(p0, p1){
    let positives = 0;
    let negatives = 0;
    for (p0; p0 <= p1; p0++) {
        if (getAngle(p0, p0+1) > 0) {
            positives++;
        } else if (getAngle(p0, p0+1) < 0) {
            negatives++;
        }
    }
    if (positives < negatives) {
        return "right";
    } else if (negatives > positives) {
        return "left";
    } else {
        return "ahead";
    }
}