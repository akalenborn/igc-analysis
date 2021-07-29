// --- CPU usage ---
let domUpdateInterval = 200; // At least every n milliseconds, the DOM needs to be updated. Example: 100
const runtimeModalTimeout = 4000; // The runtime info modal will be shown after this timeout, if the algorithms are still running

// --- Default Algorithms --- // defines algorithms that are run by default after loading a igc file
let defaultCurve = false; //false, optimal, theta
let defaultCircle = false; //false, optimal, theta
let defaultEight = false; //false, true
let defaultTriangle = false; //false, fast, improved, experimental
let defaultFreeFlight = false;
let defaultFlatTriangle = false;

// --- Algorithm parameters ---
const curveMaxDeviation = 0.1;
const curve180MaxGap = 0.2;
const circleMaxLength = 0.5;
let circleMaxGap = 0.01; // maximum distance between start- and endPoint
let circleDiameterMaxDeviation = 0.25;
const maxEightGapPercentage = 0.1;
const eightDiameterMaxDeviation = 0.4; // This parameter is used for a custom circle detection in eight.js

// --- Triangle parameters ---
const faiMinLegDistance = 0.28; //default 28% min leg distance
const maxFastSearchPoints = 200;
const maxIncreasedSearchPoints = 600;
const maxImprovedSearchPoints = 4000;
const maxRadius = 1000;
const maxBucketSize = 100;
const timeLimit = 15;

//--- Free Flight parameters ---
const freeFlightScore = 1;
const freeFlightTurnpoints = 3;
const freeFlightOptimizeFactor = 5;

//--- Flat Triangle parameters ---
const flatTriangleScore = 1.4;
let maxRadiusFlatTriangle = 1;

// The angle θ between two subsequent vectors in a turn needs to fit between the below defined min and max angles.
// e.g. for a circle of 10 vectors (11 different points) the average angle should be 36° (360 / 10)
const thetaMinValue = 3;
const thetaMaxValue = 60;

// --- Server info ---
const serverAddress = "https://api.igc.onestudies.com/";
const administratorEmail = "daniel.kettemann@gmail.com";