function analysisIsEmpty(result){
    let hasResult = false;
    const values = Object.values(result.shapeDetection);

    for(let value of values){
        if(value){
            hasResult = true;
            break;
        }
    }

    return hasResult;
}

//results from past calculations in the same session have to be reset
//not resetting these variables can lead to an error where past results are tried to be displayed on new track
async function resetResults(){
    resetEventListeners();
    results =  {
        igcHeader: null,
        additionalData: null,
        shapeDetection: {
            curve90: null,
            curve180: null,
            circle: null,
            eight: null,
            triangle: null,
            freeFlight: null
        }
    };

    algorithms = [
        {name: "curve90", result: results.shapeDetection.curve90, checkbox: curve90Checkbox, default: defaultCurve, alg: curveAlgorithm, color: "#32cd32"},
        {name: "curve180", result: results.shapeDetection.curve180, checkbox: curve180Checkbox, default: defaultCurve, alg: curveAlgorithm, color: "#00FF00"},
        {name: "circle", result: results.shapeDetection.circle, checkbox: circleCheckbox, default: defaultCircle, alg: circleAlgorithm, color: "blue"},
        {name: "eight", result: results.shapeDetection.eight, checkbox: eightCheckbox, default: defaultEight, color: "yellow"},
        {name: "faiTriangle", result: results.shapeDetection.triangle, checkbox: faiTriangleCheckbox, default: defaultFaiTriangle, alg: faiTriangleAlgorithm, color: "green"},
        {name: "freeFlight", result: results.shapeDetection.freeFlight, checkbox: freeFlightCheckbox, default: defaultFreeFlight, alg: freeFlightAlgorithm, color:"green"},
        {name: "triangle", result: results.shapeDetection.triangle, checkbox: triangleCheckbox, default: defaultTriangle, alg: triangleAlgorithm, color: "green"}
    ];
}

function resetEventListeners(){
    for(let i = 0; i < algorithms.length; i++){
        if(eventListeners[i]){
            eventListeners[i].elem.removeEventListener('change', eventListeners[i].fn);
        }
    }
}