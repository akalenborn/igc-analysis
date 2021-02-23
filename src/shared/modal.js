/* Behandelt die Anzeige der Runtime Warnung wenn Algorithmen viel Zeit
benötigen
 */

const modal = document.getElementById("runtime-info");
const span = document.getElementsByClassName("close")[0];
let modalWasOpened = false;

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