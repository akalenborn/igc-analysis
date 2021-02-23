/**
 * Checks if a given array is not empty.
 */
function arrayNotEmpty(array) {
    // if array.length returns 0, the statement evaluates to false
    return Array.isArray(array) && array.length;
}

/**
 * Checks if a given array is empty.
 */
function arrayIsEmpty(array) {
    return !arrayNotEmpty(array);
}

/**
 * Returns the last element of an array or false, if the array is empty.
 */
function lastElementOfArray(array) {
    if (arrayIsEmpty(array)) return false;
    return array[array.length - 1];
}