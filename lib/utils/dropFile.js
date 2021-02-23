/*
 * Refer to the Mozilla Docs for more Info:
 * https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
 */

/**
 * Prevents the dragOver event default behavior.
 * @param ev
 */
function dragOverHandler(ev) {
    // Prevent default behavior (file being opened)
    ev.preventDefault();
}

/**
 * Receive dropped files and run a callback function.
 * @param ev
 * @param callback
 */
function dropHandler(ev, callback) {
    // Prevent default behavior (file being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                const file = ev.dataTransfer.items[i].getAsFile();
                console.log('%cfile received:', 'color: gray', file.name);
                callback(file);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('%c using DataTransfer interface for:', 'color: gray', ev.dataTransfer.files[i].name);
        }
    }
}
