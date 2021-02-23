/**
 * Displays IGCExceptions and throws a regular exception if the error is not of type IGCException.
 * @param e
 */
function errorHandler(e){
    if (e instanceof IGCException) {
        errorMessageElement.style.display = "block";
        errorMessageElement.innerHTML = e.message
        + " You can inform the administrator at " + administratorEmail + ". ";
    } else {
        throw e;
    }
}
