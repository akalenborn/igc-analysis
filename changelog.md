(r) - required for the analysis/display of algorithms to work properly  
(o) - change optional, not required for analysis (contains mostly additional information)
<hr>

<details>
<summary><strong>12/03/2021</strong></summary>

##Added Bootstrap

``` html
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js" 
integrity="sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0" crossorigin="anonymous">
```
    
##File changes:

###igcViewer.css
- several changes and additions 
  - changes only required if bootstrap changes are adopted

###index.html
- renamed div #select-triangle-opt to #select-triangle-algorithm
  

- added bootstrap styling to following divs: (o)
    <details>
    
    ``` html
    <div id="info-preferences" class="mt-4  container-xl">
        <div class="row justify-content-between">
            <div id="preferences" class="igc-info-content mt-4 mt-lg-0 col-12 col-lg-5 order-lg-2">
                <h2> Analysis Preferences </h2>
    
                <div class="preferences-option">
                    <label for="select-altitude-units">Altitude units:</label>
                    <select id="select-altitude-units" autocomplete="off" class="form-select form-select-sm">
                        <option value="metres">Metres</option>
                        <option value="feet">Feet</option>
                    </select>
                </div>
    
                <div class="preferences-option">
                    <label for="select-time-zone">Time zone:</label>
                    <select id="select-time-zone" class="form-select form-select-sm"></select>
                </div>
    
                <div class="preferences-option">
                    <label for="select-curve-algorithm">Curve detection:</label>
                    <select id="select-curve-algorithm" autocomplete="off" class="form-select form-select-sm">
                        <option value="optimal">Optimal search</option>
                        <option value="theta">Fast theta search</option>
                    </select>
                </div>
    
                <div class="preferences-option">
                    <label for="select-circle-algorithm">Circle detection:</label>
                    <select id="select-circle-algorithm" autocomplete="off" class="form-select form-select-sm">
                        <option value="optimal">Optimal search</option>
                        <option value="theta">Fast theta search</option>
                    </select>
                </div>
    
                <div class="preferences-option">
                    <label for="select-triangle-algorithm">Triangle Calc Points:</label>
                    <select id="select-triangle-algorithm" autocomplete="off" class="form-select form-select-sm">
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="300">300</option>
                        <option value="400">400</option>
                        <option value="500">500</option>
                    </select>
                </div>
    
                <label class="preferences-option">Which geometric shapes should be highlighted?</label>
                <div id="checkbox-container" class="preferences-option">
                    <div class="checkbox">
                        <input type="checkbox" id="curve-90" name="scales" class="form-check-input">
                        <label for="curve-90" class="form-check-label"> 90° curves</label>
                    </div>
                    <div class="checkbox">
                        <input type="checkbox" id="curve-180" name="scales" class="form-check-input">
                        <label for="curve-180" class="form-check-label"> 180° curves</label>
                    </div>
                    <div class="checkbox">
                        <input type="checkbox" id="circle-checkbox" name="scales" class="form-check-input">
                        <label for="circle-checkbox" class="form-check-label"> circles</label>
                    </div>
                    <div class="checkbox">
                        <input type="checkbox" id="eight-checkbox" name="scales" class="form-check-input">
                        <label for="eight-checkbox" class="form-check-label"> eights</label>
                    </div>
                    <div class="checkbox">
                        <input type="checkbox" id="triangle-checkbox" name="scales" class="form-check-input">
                        <label for="triangle-checkbox" class="form-check-label"> triangle</label>
                    </div>
                </div>
                <div class="d-grid col-5 mx-auto mt-3"><button id="startAnalysis" type="button" class="btn btn-primary">Start Analysis</button></div>
            </div>
    
            <div id="igc-info-container" class="igc-info-content mt-4 mt-lg-0 col-12 col-lg-7 order-lg-1" style="display: none">
                <h2> Flight Information </h2>
    
                <table id="headerInfo">
                    <tbody></tbody>
                </table>
    
                <div id="task">
                    <h2> Task </h2>
                    <ul></ul>
                </div>
            </div>
        </div>
    </div>
    ``` 
    </details>
  

- added button to initiate Analysis (already included in code excerpt above): (r)
    <details>
    
    ``` html
    <div class="d-grid col-5 mx-auto mt-3">
        <button id="startAnalysis" type="button" class="btn btn-primary">Start Analysis</button>
    </div>
    ```
    </details>

### igcViewer.js

- changes to function handleFileInput (r)
    <details>
    
    ```js
      async function handleFileInput(file) {
      return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = async () => {
                await resetMap();
                igcFile = parseIGC(reader.result);
                        
                /* Map wird initialisiert */
                await displayIgc(mapControl);
                await displayIGCHeader();
                await initAlgorithmVariables(igcFile);
                await displayKeyFigures(getKeyFigures());
  
                // activate to allow analysis immediately after file upload
                //await runAlgorithms(igcFile, getAnalysisPreferences()); 
                
                showAnalysisPreferences();
                plotBarogramChart(igcFile);
                
                return resolve();
            };
            reader.readAsText(file);
          });
      } 
    ```
    </details>


- added function getAnalysisPreferences (r)
    <details>
    
    ``` js
    function getAnalysisPreferences(){
        let chosenAlgs = [];
        for (const algorithm of algorithms) {
            if(algorithm.checkbox.checked){
            chosenAlgs.push(algorithm);
            }
        }
        return chosenAlgs;
    }
    ```
    </details>

###analyzeIGC.js

- added EventListener for startAnalysis button (r)

    - prepares DOM for start of algorithms
    - resets map and route info
    - initiates algorithms
    
    <details>
    
    ```js
    document.getElementById("startAnalysis").addEventListener("click", async () => {
        await resetMap();
        await displayIgc(mapControl);
        hideTriangleContainer();
    
        await runAlgorithms(igcFile, getAnalysisPreferences());
    });
    ```
    </details>


- changes to function runAlgorithms (r)
    - now only runs algorithms that are selected by the user
    <details>

    ```js
    async function runAlgorithms(track, activeAlgorithms) {
    showCheckboxes();
    let curves;

    for(let i = 0; i < activeAlgorithms.length; i++){
        switch (activeAlgorithms[i].name) {
            case "curve90":
            case "curve180":

                if(curves == null){
                    curves = await curveDetection(track.latLong, distances, 0.3);
                    getResultObject(curves);
                }
                break;
            case "circle":
                results.shapeDetection.circle = await circleDetection();
                setCircleDetectionOutput(getCurrentRuntime(), _circles.length);
                algorithms[2].result = results.shapeDetection.circle;
                break;
            case "eight":
                results.shapeDetection.eight = await eightDetection();
                algorithms[3].result = results.shapeDetection.eight;
                break;
            case "triangle":
                results.shapeDetection.triangle = await triangleDetection();
                algorithms[4].result = results.shapeDetection.triangle;
                break;
            default:
        }
    }
  
    await displayResults(results, mapControl);
    closeRuntimeInfoModal();
    return results;
    }
    ```
    </details>


###UIControl.js

- added function showAnalysisPreferences (r)
  <details>
  
  ```js
    //set preferenceContainer in igcViewer.css to block to allow algorithm selection prior to file upload
    function showAnalysisPreferences(){
        preferenceContainer.style.display = "block";
    }
  ```
  </details>


- added function hideTriangleContainer (r)
    <details>
    
    ```js
    function showAnalysisPreferences(){
        preferenceContainer.style.display = "block";
    }
    ```
    </details>


- changes to function initFlightInformation (r)

    <details>

    ```js
    function initFlightInformation(){
        displayIGCHeader();
        displayKeyFigures(getKeyFigures());
    }
    ```
    </details>


- changes to displayIGCHeader (r)
    - added hideTriangleContainer();
    <details>

    ```js
    function displayIGCHeader(){
        showInfoContainers();
        hideTriangleContainer();
        const displayDate = moment(igcFile.recordTime[0]).format('LL');
        headerTableElement.innerHTML = '<tr></tr>' + '<th>Date</th>'
            + '<td>' + displayDate + '</td>';
        addToTable(igcFile.headers);
    }
    ```
    </details>
    

###globalVariables.js

- added new variable
    <details>
  
    ```js
    const preferenceContainer = document.querySelector('#preferences');
    ```
    </details>


- changed variable const triangleOptSelect to triangleAlgorithm
    <details>
  
    ```js
    const triangleAlgorithm = document.querySelector('#select-triangle-algorithm');
    ```
    </details>

</details>
<hr>
<details>
<summary><strong>01/03/2021</strong></summary>

##New Files added:
 - triangle.js - contains algorithm for triangle detection (r)

##File changes:
###index.html
- added preference option for triangle algorithm (r)  
  &rarr; at line 100 - 110 (below other preferences-option containers)
    <details>
  
    ```html 
    <div class="preferences-option">
                     <label for="select-triangle-opt">Triangle Calc Points:</label>
                     <select id="select-triangle-opt" autocomplete="off">
                         <option value="100">100</option>
                         <option value="200">200</option>
                         <option value="300">300</option>
                         <option value="400">400</option>
                         <option value="500">500</option>
                     </select>
                </div>
    ```
    </details>      

            
- added triangle-info-container: shows details of the detected triangle (o)  
    &rarr; at line 150 (below igc-info-container)  


- added triangle-runtime: display runtime information of triangle detection algorithm (o)  
    &rarr; at line 152 (below triangle-info-container)
  <details>
  
  ```html 
  <div id="triangle-runtime">
     <p id="opt-points"></p>
     <p id="cand-search"></p>
     <p id="opt-cand-search"></p>
  </div>
  ```
  </details>
              

- include triangle.js script (r)  
    &rarr; at line 216
    ```js 
    <script src="src/algorithms/triangle.js"></script>
    ```

###UIControl.js
- changes to function displayKeyFigures() (o)
```js
  {name: "Total altitude gain", value: getAltitudeString(keyFigures.gainInAltitude)},
```

###keyFigures.js
- changes to returned object in function getKeyFigures() (o)  
    &rarr; added: gainInAltitude: getGainInAltitude(),


- added function getGainInAltitude() (o)
  <details>
  
  ```js 
  function getGainInAltitude(){
        let totalAltitude = 0;
        let altitudeDiff;
        for (let i = 1; i < igcFile.gpsAltitude.length; i++) {
            altitudeDiff = igcFile.gpsAltitude[i] - igcFile.gpsAltitude[i-1];
            if (altitudeDiff > 0) totalAltitude += altitudeDiff;
        }
        return totalAltitude;
  }
  ```
    
  </details>


###globalVariables.js
- added new Variables (r)
    <details>
    
    ```js 
    const triangleCheckbox = document.querySelector('#triangle-checkbox'); (o)
    const triangleInfoContainer = document.querySelector('#triangle-info-container'); (o)
    const triangleOptSelect = document.querySelector('#select-triangle-opt'); (r)
    let optLatLong = []; 
    ```
    </details>
          

- changes to existing Variables (r)
  <details>
  
  ```js 
  let results = {
      igcHeader: null,
      additionalData: null,
      shapeDetection: {
          curve90: null,
          curve180: null,
          circle: null,
          eight: null,
          triangle: null // added
      }
  };

  let algorithms = [
      {name: "curve180", result: results.shapeDetection.curve180, checkbox: curve180Checkbox, color: "#00FF00"},
      {name: "circle", result: results.shapeDetection.circle, checkbox: circleCheckbox, color: "blue"},
      {name: "eight", result: results.shapeDetection.eight, checkbox: eightCheckbox, color: "yellow"},
      {name: "triangle", result: results.shapeDetection.triangle, checkbox: triangleCheckbox, color: "green"} // added
  ];
  ```
  </details>
  

###mapControl.js
- added new function
  - required to display/remove triangle on map (r)
    <details>
    
    ``` js
    addTriangle: (triObj, color) => {
       if (layerGroups[triObj.name] === undefined) {
          layerGroups[triObj.name] = L.layerGroup().addTo(map);
       }
       L.polygon([triObj.result.w1, triObj.result.w2, triObj.result.w3], {color: color}).addTo(layerGroups[triObj.name]);
    },
    ```
    </details>
    

###analyzeIGC.js
- added init for triangle algorithm (r)  
  <details>
  
  ```js
    results.shapeDetection.triangle = await triangleDetection(); // line 12
    algorithms[4].result = results.shapeDetection.triangle; // line 15   
  ``` 
  </details>

###displayResults.js
- changed function displayResults(results) (r)
    <details>
  
    ```js 
    async function displayResults(results) {
        curve90 = results.shapeDetection.curve90;
        curve180 = results.shapeDetection.curve180;
        setDisabledProperty();

        for (const algorithm of algorithms) {
            if(algorithm.name!="triangle") {
                displayShape(algorithm);
            }
            else{
                displayTriangle(algorithm);
            }
        }
    }
    ```
    </details>


- changed function setDisabledProperty() (r)
    <details>

        function setDisabledProperty() {
            for (const algorithm of algorithms) {
                if(algorithm.name!="triangle") {
                    algorithm.checkbox.disabled = arrayIsEmpty(algorithm.result);
                }
            }
        }
    </details>


- changes to document.addEventListener (r)
  - changes to if(algorithm.checkbox.checked) (r):
    <details>

    ```js
    if (algorithm.checkbox.checked) {
       if(algorithm.name!="triangle"){
           displayShape(algorithm);
       }
       else{
           displayTriangle(algorithm);
       }
    } else {
       mapControl.clearLayer(algorithm.name);
    }
    ```
    </details>


- added triangleOptSelect.addEventListener (r):
  <details>

    ```js
    triangleOptSelect.addEventListener('change', () => {
        resetMap();
        displayIgc(mapControl);
        runAlgorithms(igcFile);
    });
    ```
  </details>
  

- added new function displayTriangle() (r)
  <details>
  
    ```js
    function displayTriangle(algorithm){
        if (algorithm.checkbox.checked){
            mapControl.addMarkerTo(algorithm.name, algorithm.result.startP);
            mapControl.addMarkerTo(algorithm.name, algorithm.result.endP);
            mapControl.addTriangle(algorithm, algorithm.color);
        }

        displayTriangleInfo();
    }
    ```
  </details>


- added new function displayTriangleInfo() (r)
  <details>
  
    ```js
    function displayTriangleInfo(){
        triangleInfoContainer.innerHTML =
            '<h2>Scoring Information</h2>' +
            '<table id="triangleInfo">' +
            '<tbody>' +
            '<tr>' +
            '<th>Flight Score:</th>' +
            '<td>' + results.shapeDetection.triangle.flightScore + '</td>'+
            '</tr>'+
            '<tr>' +
            '<tr>' +
            '<th>Type:</th>' +
            '<td>' + results.shapeDetection.triangle.type + '</td>'+
            '</tr>'+
            '<tr>' +
            '<th>Total Distance:</th>' +
            '<td>' + results.shapeDetection.triangle.distTotal + "km" + '</td>'+
            '</tr>'+
            '<tr>' +
            '<tr>'
            +'<th>Leg 1:</th>' +
            '<td>' +  + results.shapeDetection.triangle.w12+ "km" +
            " - " + results.shapeDetection.triangle.w1prcnt+ "%" + '</td>'+
            '</tr>'+
            '<tr>'
            +'<th>Leg 2:</th>' +
            '<td>' +  results.shapeDetection.triangle.w23 + "km" +
            " - " + results.shapeDetection.triangle.w2prcnt+ "%" + '</td>'+
            '</tr>'+
            '<tr>'
            +'<th>Leg 3:</th>' +
            '<td>' + results.shapeDetection.triangle.w31  + "km" +
            " - " + results.shapeDetection.triangle.w3prcnt+ "%" + '</td>'+
            '</tr>'+
            '<tr>'
            +'<th>Start to End Distance:</th>' +
            '<td>' + results.shapeDetection.triangle.distStartEnd + "km" + '</td>'+
            '</tr>'+
            '</tbody>' +'</table>';
    }
    ```
    </details>
</details>








