const checkboxContainer = document.querySelector('#checkbox-container');
const preferenceContainer = document.querySelector('#preferences');
const igcInfoContainer = document.querySelector('#igc-info-container');
const curve90Checkbox = document.querySelector('#curve-90');
const curve180Checkbox = document.querySelector('#curve-180');
const circleCheckbox = document.querySelector('#circle-checkbox');
const eightCheckbox = document.querySelector('#eight-checkbox');
const faiTriangleCheckbox = document.querySelector('#faiTriangle-checkbox');
const triangleCheckbox = document.querySelector('#triangle-checkbox')
const freeFlightCheckbox = document.querySelector('#freeFlight-checkbox');
const faiTriangleResultContainer = document.querySelector('#faiTriangle-result-container');
const faiTriangleInfoContainer = document.querySelector('#faiTriangle-info-container');
const triangleResultContainer = document.querySelector('#triangle-result-container');
const triangleInfoContainer = document.querySelector('#triangle-info-container');
const freeFlightResultContainer = document.querySelector('#freeFlight-result-container');
const freeFlightInfoContainer = document.querySelector('#freeFlight-info-container');
const faiTriangleRuntimeContainer = document.querySelector('#faiTriangle-runtime-container');
const triangleRuntimeContainer = document.querySelector('#triangle-runtime-container')
//const outputContainer = document.querySelector('#analysis-output');
//const circleDetectionContainer = document.querySelector('.circle-detection');
//const dragAndDropParagraph = document.querySelector('#drag-and-drop-paragraph');
//const circlesTimeSpent = document.querySelector('#time-spent-circles');
//const circleAlgorithmProgressBar = document.querySelector('#circle-progress');
const chartElement = document.querySelector('#barogram-chart');
const timePositionDisplay = document.querySelector('#timePositionDisplay');
const timeSliderElement = document.querySelector('#timeSlider');
let headerTableElement = document.querySelector('#headerInfo tbody');
const taskElement = document.querySelector('#task');
const taskListElement = document.querySelector('#task ul');
const igcFileDisplay = document.querySelector('#igc-file-display');
const altitudeUnits = document.querySelector('#select-altitude-units');
const timeZoneSelect = document.querySelector('#select-time-zone');
const curveAlgorithm = document.querySelector('#select-curve-algorithm');
const circleAlgorithm = document.querySelector('#select-circle-algorithm');
const faiTriangleAlgorithm = document.querySelector('#select-faiTriangle-algorithm');
const triangleAlgorithm = document.querySelector('#select-triangle-algorithm')
const freeFlightAlgorithm = document.querySelector('#select-freeFlight-algorithm');
const errorMessageElement = document.querySelector('#errorMessage');
const timeBackButton = document.querySelector('#timeBack');
const timeForwardButton = document.querySelector('#timeForward');
const fileControl = document.querySelector('#file-control');
const pendingBox = document.querySelector('#algorithm-processing-container');

let igcFile;
let eventListeners = [];
let mapControl;
let altitudeConversionFactor = 1.0; // Convert from metres to required units
let latLong = [];
let optLatLong = [];
let distances = [];
let bearings = [];
let thetaTurnings = [];
let maxPointDistance = NaN;
let results = {
    igcHeader: null,
    additionalData: null,
    shapeDetection: {
        curve90: null,
        curve180: null,
        circle: null,
        eight: null,
        faiTriangle: null,
        freeFlight: null,
        triangle: null
    }
};

let algorithms = [
    {name: "curve90", result: results.shapeDetection.curve90, checkbox: curve90Checkbox, default: defaultCurve, alg: curveAlgorithm, color: "#32cd32"},
    {name: "curve180", result: results.shapeDetection.curve180, checkbox: curve180Checkbox, default: defaultCurve, alg: curveAlgorithm, color: "#00FF00"},
    {name: "circle", result: results.shapeDetection.circle, checkbox: circleCheckbox, default: defaultCircle, alg: circleAlgorithm, color: "blue"},
    {name: "eight", result: results.shapeDetection.eight, checkbox: eightCheckbox, default: defaultEight, color: "yellow"},
    {name: "triangle", result: results.shapeDetection.triangle, checkbox: faiTriangleCheckbox, default: defaultFaiTriangle, alg: faiTriangleAlgorithm, color: "green"},
    {name: "freeFlight", result: results.shapeDetection.freeFlight, checkbox: freeFlightCheckbox, default: defaultFreeFlight, alg: freeFlightAlgorithm, color:"green"},
    {name: "triangle", result: results.shapeDetection.triangle, checkbox: triangleCheckbox, default: defaultTriangle, alg: triangleAlgorithm, color: "green"}
];