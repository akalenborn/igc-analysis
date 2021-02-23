/* Umfasst die Erstellung des Barogramm Chart unter der Map */


let dataLabels;
let pressureBarogramData;
let gpsBarogramData;
let timestamp;
let myChart;
let pruningFactor;

document.addEventListener("DOMContentLoaded", () => {
    chartElement.onclick = evt => {
        const point = myChart.getElementsAtEventForMode(evt, 'point', myChart.options)[0];
        if (!point) return; // no point was focused, just the chart background was clicked

        /* setzt timeline entsprechend dem angeklickten Punkt im Barogram */
        setTimelineValue(point._index * pruningFactor);
    };
});

function plotBarogramChart() {
    dataLabels = [];
    pressureBarogramData = [];
    gpsBarogramData = [];
    if (myChart !== undefined) myChart.destroy();
    getBarogramData();
    const ctx = document.getElementById("canvas").getContext('2d');
    const config = getChartConfig();
    myChart = new Chart(ctx, config);
}

function getBarogramData() {
    pruningFactor = getPruningFactor(igcFile.recordTime.length);
    for (let i = 0; i < igcFile.recordTime.length; i += pruningFactor) {

        /* nimmt Zeit zu Punkt i und fügt sie dem hover dataLabel hinzu */
        timestamp = moment(igcFile.recordTime[i]).format('HH:mm');
        dataLabels.push(timestamp);

        /* bestimmt Daten auf denen Druck und Höhenlinien gezeichnet werden */
        pressureBarogramData.push(igcFile.pressureAltitude[i] * altitudeConversionFactor);
        gpsBarogramData.push(igcFile.gpsAltitude[i] * altitudeConversionFactor);
    }
}

function getPruningFactor(recordLength) {
    return recordLength > 200 ? Math.round(recordLength / 50) : 1;
}


/*  Beinhaltet Informationen über das zu zeichnende Barogram Chart */
function getChartConfig() {
    return {
        type: 'line',
        data: {
            labels: dataLabels,
            datasets: [
                {
                    label: 'Pressure altitude',
                    data: pressureBarogramData,
                    fill: false,
                    steppedLine: false,
                    borderColor: '#2196f3',
                    backgroundColor: '#2196f3',
                    borderWidth: 5
                },
                {
                    label: 'GPS altitude',
                    data: gpsBarogramData,
                    fill: false,
                    steppedLine: false,
                    borderColor: 'green',
                    backgroundColor: 'green',
                    borderWidth: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    afterTickToLabelConversion: data => {
                        const xLabels = data.ticks;
                        xLabels.forEach((labels, i) => {
                            if (i % 2 === 1) {
                                xLabels[i] = '';
                            }
                        });
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }],
                yAxes: [
                    {
                        ticks: {
                            callback: label => label + getHeightUnit()
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Height AGL (' + altitudeUnits.value + ')'
                        }
                    }
                ]
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    fontColor: 'rgb(0, 0, 0 )'
                }
            }
        }

    };
}

function getHeightUnit() {
    switch (altitudeUnits.value) {
        case "metres":
            return "m";
        case "feet":
            return "ft";
        default:
            return "";
    }
}
