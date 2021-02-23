/**
 * Read a file using the FileReader API.
 * @param file
 * @returns {Promise<unknown>}
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsArrayBuffer(file);
    })
}
