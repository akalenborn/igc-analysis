const checkboxContainer = document.querySelector('#checkbox-container');
const preferenceContainer = document.querySelector('#preferences');
const curve90Checkbox = document.querySelector('#curve-90');
const curve180Checkbox = document.querySelector('#curve-180');
const circleCheckbox = document.querySelector('#circle-checkbox');
const eightCheckbox = document.querySelector('#eight-checkbox');
const triangleCheckbox = document.querySelector('#triangle-checkbox');
const optTriangleCheckbox = document.querySelector('#triangle-opt-checkbox');
const igcInfoContainer = document.querySelector('#igc-info-container');
const triangleInfoContainer = document.querySelector('#triangle-info-container');
const triangleRuntimeContainer = document.querySelector('#triangle-runtime');
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
const errorMessageElement = document.querySelector('#errorMessage');
const timeBackButton = document.querySelector('#timeBack');
const timeForwardButton = document.querySelector('#timeForward');
const fileControl = document.querySelector('#file-control');
const triangleAlgorithm = document.querySelector('#select-triangle-algorithm');
const triangleAlgorithmType = document.querySelector('#select-triangle-algorithm-type');



let igcFile;
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
        triangle: null
    }
};

let algorithms = [
    {name: "curve90", result: results.shapeDetection.curve90, checkbox: curve90Checkbox, color: "#32cd32"},
    {name: "curve180", result: results.shapeDetection.curve180, checkbox: curve180Checkbox, color: "#00FF00"},
    {name: "circle", result: results.shapeDetection.circle, checkbox: circleCheckbox, color: "blue"},
    {name: "eight", result: results.shapeDetection.eight, checkbox: eightCheckbox, color: "yellow"},
    {name: "triangle", result: results.shapeDetection.triangle, checkbox: triangleCheckbox, color: "green"}
];