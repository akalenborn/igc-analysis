const modal = document.getElementById("runtime-info");
const span = document.getElementsByClassName("close")[0];
let modalWasOpened = false;

let pendingMsg = document.getElementById("calculation-loading-msg");
let pendingSpinner = document.getElementById("loading-spinner");
let pendingTxt = document.getElementById("calculation-info-txt");


document.addEventListener("DOMContentLoaded", () => {
    span.onclick = () => closeRuntimeInfoModal();

    window.addEventListener("click", (event) => {
        if (event.target === modal) closeRuntimeInfoModal();
    });
});

function showRuntimeInfoModal() {
    modal.style.display = "block";
    modalWasOpened = true;
}

function closeRuntimeInfoModal() {
    modal.style.display = "none";
}

function showPendingBox(){
    pendingBox.style.display = "block";
    pendingBox.style.background = "#007bff";
    pendingMsg.innerHTML = "Calculating results - Please wait...";
    pendingSpinner.style.display = "inline-block";
    pendingTxt.style.display = "block";
}

function minimizePendingBox(){

}

function closePendingBox(result){
    if(analysisIsEmpty(result)){
        pendingBox.style.background = "green";
        pendingMsg.innerHTML = "Calculation finished successfully!";
        pendingSpinner.style.display = "none";
        pendingTxt.style.display = "none";
    }
    else{
        pendingBox.style.background = "red";
        pendingMsg.innerHTML = "Calculation finished with no results!";
        pendingSpinner.style.display = "none";
        pendingTxt.style.display = "none";
    }

    setTimeout(function(){
        pendingBox.style.display = "none";
    },3000)
}

