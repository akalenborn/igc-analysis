let triangles = [];

async function triangleDetection () {
    await getTriangles( await optimizePoints());
    return await getMaxTriangle();

}


async function optimizePoints () {
    let latLongs = [];
    for ( let latLongIndex = 0; latLongIndex < latLong.length; latLongIndex= latLongIndex+200){
        latLongs.push(latLong[latLongIndex]);
    }
    return latLongs;
}


async function getStartAndEnd () {

}

async function getFlightScore (score, distance) {

}

async function getTriangles (latLong) {
    for ( let point1 = 0; point1 < latLong.length-2; point1++) {
        for ( let point2 = point1 + 1; point2 < latLong.length-1; point2++) {
            for ( let point3 = point2 + 1; point3 < latLong.length; point3++) {

                triangles.push([latLong[point1], latLong[point2], latLong[point3]]);
            }
        }
    }

    return triangles;
}

async function getMaxTriangle () {
    let triangleCandidate;
    let longestDistance = 0;
    for ( let triangle = 0; triangle < triangles.length; triangle++ ){
        let possibleDistance =  await getTriangleDistance(triangles[triangle]);
        if (longestDistance < possibleDistance ) {
            longestDistance = possibleDistance;
            triangleCandidate = triangle;
        }
    }
    console.log(longestDistance);
    let maxTriangle = {

        points : [ triangles[triangleCandidate][0], triangles[triangleCandidate][1],triangles[triangleCandidate][2]]
    }

    return maxTriangle;
}

async function getTriangleDistance (points) {
  let distance = 0;
  distance = distanceBetweenCoordinates(points[0],points[1]);
  distance = distance + distanceBetweenCoordinates(points[1], points[2]);
  distance = distance + distanceBetweenCoordinates(points[0], points[2]);

  return distance;
}










//only for testing

async function printTriangles (triangles) {
    console.log("print");
    for ( let i = 0; i < triangles.length; i++ ) {
        console.log(triangles[i]);
    }
}