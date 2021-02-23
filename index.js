const fileURL = 'https://api.igc.onestudies.com/api/igc/getFile.php';


/* Standard Programm Ablauf startet hier:
Nutzer wählt Datei ->
Datei wird in handleFileInpute geladen
-> file wird in parseIGC übertragen, dort werden alle Informationen aus der
Datei entzogen
-> anschließend wird die Map dargestellt displayIGC(mapControl)
-> dann werden Algorithmen ausgeführt runAlgorithms(igcfile)
 */
document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch(fileURL);
    const blob = await res.blob();
    await handleFileInput(blob);

    console.group('algorithm results');
    console.log('%c IGC Header', 'color: gray', results.igcHeader);

    console.log('%c Shape Detection', 'color: blue', results.shapeDetection);
    console.log('%c Additional Data', 'color: green', results.additionalData);
    console.groupEnd();
});