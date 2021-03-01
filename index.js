const fileURL = ''/*'https://api.igc.onestudies.com/api/igc/getFile.php'*/;

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