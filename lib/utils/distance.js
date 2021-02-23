/**
 * Calculates the distance between track points, in kilometers.
 * @param {number} p0 A track index.
 * @param {number} p1 A track index.
 * @returns {number} The distance in kilometers.
 */
function distance(p0, p1) {
    return distanceBetweenCoordinates(latLong[p0], latLong[p1])
}

/**
 * Calculates the distance between two geographic coordinates, given through latitude and longitude, in kilometers.
 * @param {number[]} p0 Coordinate - with lat and lon.
 * @param {number[]} p1 Coordinate - with lat and lon.
 * @returns {number} The distance in kilometers.
 */
function distanceBetweenCoordinates(p0, p1) {
    const lat1 = p0[0], lon1 = p0[1], lat2 = p1[0], lon2 = p1[1];
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;

    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

/**
 * Finds the next track log point with a distance greater than dist starting from index idx in distances.
 * @returns {number}
 */
function nextPointInDistance(dist, idx, distances) {
    for (let i = idx; i < distances.length - 1; i++) {
        const arr = distances.slice(idx, i + 1);
        const sum = arr.reduce((a, b) => a + b);
        if (sum > dist) return i;
    }
    return -1;
}

let recursionExceptionHappened = false;
/**
 * Finds the biggest index in range of dist.
 */
function getNextPointRecursive(dist, idx, distances) {
    if(recursionExceptionHappened) return nextPointInDistance(dist, idx, distances);
    try {
        return increaseIndexRecursive(dist, idx, distances, 0);
    } catch (e) {
        recursionExceptionHappened = true;
        return nextPointInDistance(dist, idx, distances);
    }
}

/**
 * Increase idx until sum is greater than dist.
 */
function increaseIndexRecursive(dist, idx, distances, sum){
    if(sum > dist) return idx;
    if(idx >= distances.length-1) return -1;
    sum += distances[idx];
    return increaseIndexRecursive(dist, idx + 1, distances, sum)
}

/**
 * Calculates the mean of an array of numbers.
 * @param values numbers for which the mean should be calculated.
 */
function average(values) {
    const sum = values.reduce((a, b) => a + b);
    const avg = (sum / values.length) || 0;

    console.log(`The sum is: ${sum}. The average is: ${avg}.`);
}

/**
 * Calculates the length of a path starting from p0 to p1 in the IGC graph.
 */
function pathLength(p0, p1) {
    const p0ToP1 = distances.slice(p0, p1 + 1); // include p1 into the path
    return p0ToP1.reduce((a, b) => a + b);
}
