let curve90 = [],
    curve180 = [];


async function displayResults(results) {
    curve90 = results.shapeDetection.curve90;
    curve180 = results.shapeDetection.curve180;
    setDisabledProperty();
    /* für jeden Algorithmus wird die Shape auf Basis der
    Ergebnisse gezeichnet
     */
    for (const algorithm of algorithms) {
            if(algorithm.name!="triangle") {
                displayShape(algorithm);
            }
            else{
                displayTriangle(algorithm);
            }
    }
}

function setDisabledProperty() {
    /* prüft welche der Checkboxen unchecked sind
    diese werden anschließend disabled -> können nicht mehr angeklickt werden
     */
    for (const algorithm of algorithms) {
        if(algorithm.name!="triangle") {
            algorithm.checkbox.disabled = arrayIsEmpty(algorithm.result);
        }
    }
}

function displayTriangle(algorithm){
    if (algorithm.checkbox.checked){
        mapControl.addMarkerTo(algorithm.name, algorithm.result.startP);
        mapControl.addMarkerTo(algorithm.name, algorithm.result.endP);
        mapControl.addTriangle(algorithm, algorithm.color);
    }

    displayTriangleInfo();
}

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

function displayShape(algorithm) {
    /* algorithm.result beinhaltet alle Werte der ermittelten Formen */
    for (const shape of algorithm.result) {
        /* shape bzw. algorithm.result beinhaltet alle Indizes an deren Stelle in dem latLong
        Array die gefundenen shape Punkte liegen -> Marker wird an der ersten Indize Stelle gesetzt
         */
        if (algorithm.checkbox.checked) mapControl.addMarkerTo(algorithm.name, latLong[shape[0]]);
        /* Shape wird aus der Gesamtstrecke gesliced um als eigene Strecke der Map hinzugefügt zu werden */
        const points = latLong.slice(shape[0], lastElementOfArray(shape) + 1);
        mapControl.addShape(points, algorithm.color);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    for (const algorithm of algorithms) {

        /* EventListener um Änderungen in Checkboxen abzufangen
        bei einer Änderung wird die Änderung lokal gespeichert
        -> storePreference
         */
        algorithm.checkbox.addEventListener('change', () => {
            storePreference(algorithm.name, algorithm.checkbox.checked);
            if (!mapControl) return;

            /* prüft ob checkbox checked, ansonsten wird Shape von Map entfernt */
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
        });
    }

    /* EventListener für dropdown Select - Auswahl und Ausführung des Algorithmus */
    curveAlgorithm.addEventListener('change', () => {
        storePreference("curveAlgorithm", curveAlgorithm.value);
        resetMap();
        displayIgc(mapControl);
        runAlgorithms(igcFile);
    });

    circleAlgorithm.addEventListener('change', () => {
        storePreference("circleAlgorithm", circleAlgorithm.value);
        resetMap();
        displayIgc(mapControl);
        runAlgorithms(igcFile);
    });

    triangleOptSelect.addEventListener('change', () => {
        resetMap();
        displayIgc(mapControl);
        runAlgorithms(igcFile);
    });

});