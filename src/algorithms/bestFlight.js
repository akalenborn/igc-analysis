let estimateCoefficient = 1.5;

async function bestFlightDetection () {
    let faiTriangleScore;
    let flatTriangleScore;
    let freeFlightScore;
    let estimatedFaiTriangleScore;
    let estimatedFlatTriangleScore;
    let estimatedFreeFlightScore;

    faiTriangleScore = (await getInitFaiTriangle()).flightScore;
    console.log(faiTriangleScore);
    flatTriangleScore = (await fastFlatTriangleSearch()).flightScore;
    console.log(flatTriangleScore);
    freeFlightScore = (await fastFreeFlightSearch()).flightScore;
    console.log(freeFlightScore);

    estimatedFaiTriangleScore = await increaseScore(faiTriangleScore, 2);
    estimatedFlatTriangleScore = await increaseScore(flatTriangleScore, 1.4);
    estimatedFreeFlightScore = await increaseScore(freeFlightScore, 1);

    if (faiTriangleScore > estimatedFlatTriangleScore && faiTriangleScore > estimatedFreeFlightScore) {
        let _triangle;
        _triangle = await getInitFaiTriangle();
        _triangle = await getFastTriangle(_triangle);
        _triangle = await getAccurateFaiTriangle(_triangle, Math.min(Math.max(_triangle.w12,_triangle.w23, _triangle.w31)*1000/8, maxRadius));
        results.shapeDetection.triangle = _triangle;
        algorithms[4].result = results.shapeDetection.triangle;
        return;
    }

    if (flatTriangleScore > estimatedFaiTriangleScore && flatTriangleScore > estimatedFreeFlightScore){
        results.shapeDetection.flatTriangle = await improvedFlatTriangleSearch();
        algorithms[6].result = results.shapeDetection.flatTriangle;
        return;
    }

    if(freeFlightScore > estimatedFaiTriangleScore && freeFlightScore > estimatedFlatTriangleScore){
        results.shapeDetection.freeFlight = await fastFreeFlightSearch();
        algorithms[5].result = results.shapeDetection.freeFlight;
        return;
    }


    return;

}

async function increaseScore(flightScore, coefficient){
    return flightScore + coefficient*estimateCoefficient;
}