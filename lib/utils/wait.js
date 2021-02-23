// time.js
let _algorithmStartTime;

/**
 * It might be necessary to wait some milliseconds in order to prevent
 * that Chrome postpones rendering due to high CPU usage
 * @param {number} ms
 * @returns {Promise}
 * */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Waits until the DOM is updated.
 * This might be necessary to allow rendering while doing heavy computations in the browser.
 * @returns {Promise<unknown>}
 */
async function domUpdate(){
    return new Promise(resolve => {
        const fn = () => window.requestAnimationFrame(resolve);
        window.requestAnimationFrame(fn);
    })
}

function setStartTime() {
    _algorithmStartTime = window.performance.now();
}

function getCurrentRuntime() {
    return twoDigitsFixed(getCurrentRuntimeMilliseconds() / 1000);
}

function getCurrentRuntimeMilliseconds() {
    return twoDigitsFixed((window.performance.now() - _algorithmStartTime));
}