import { get, set } from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm";

let player;
let canvas;
let beforeSnap;
let afterSnap;
let snapName;
let snapName2;
let btnUploadFile;
let uploadFileInput;
let btnSnap;


let isCameraSnap = true;

function initializeElements() {
    player = document.getElementById("player");
    canvas = document.getElementById("cnvFood");
    beforeSnap = document.getElementById("beforeSnap");
    afterSnap = document.getElementById("afterSnap");
    snapName = document.getElementById("snapName");
    snapName2 = document.getElementById("snapName2")
    btnUploadFile = document.getElementById("btnUploadFile");
    uploadFileInput = document.getElementById("uploadFileInput");
    btnSnap = document.getElementById("btnSnap");

        if (!player || !canvas || !beforeSnap || !afterSnap || !snapName || !btnUploadFile || !uploadFileInput || !btnSnap) {
        console.error("Neki od elemenata nisu pronađeni.");
        return;
    }

    startCapture(); 
}


function startCapture() {
    beforeSnap.classList.remove("d-none");
    beforeSnap.classList.add("d-flex", "flex-column", "align-items-center");
    afterSnap.classList.remove("d-flex", "flex-column", "align-items-center");
    afterSnap.classList.add("d-none");

    if (!("mediaDevices" in navigator)) {
        btnSnap.style.display = "none";
        
        btnUploadFile.style.display = "block";

        uploadFileInput.addEventListener("change", handleFileUpload);
    } else {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then((stream) => {
                player.srcObject = stream;

                snapName2.style.display = "none";
                btnUploadFile.style.display = "none";
            })
            .catch((err) => {
                btnUploadFile.style.display = "block";

                btnSnap.style.display = "none";

                uploadFileInput.addEventListener("change", handleFileUpload);
            });
    }
};
initializeElements();
let stopCapture = function () {
    afterSnap.classList.remove("d-none");
    afterSnap.classList.add("d-flex", "flex-column", "align-items-center");
    beforeSnap.classList.remove("d-flex", "flex-column", "align-items-center");
    beforeSnap.classList.add("d-none");
    player.srcObject.getVideoTracks().forEach(function (track) {
        track.stop();
    });
};
function handleFileUpload() {
    const file = uploadFileInput.files[0];
    console.log(snapName2.value)
    if (file && snapName2.value.length>0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            let url = e.target.result;
            fetch(url)
                .then((res) => res.blob())
                .then((blob) => {
                    let ts = new Date().toISOString();
                    let id = ts + snapName2.value.replace(/\s/g, "_"); 
                    set(id, {
                        id,
                        ts,
                        title: snapName2.value,
                        image: blob,
                    });
                    return navigator.serviceWorker.ready;
                })
                .then((swRegistration) => {
                    return swRegistration.sync.register("sync-snaps");
                })
                .then(() => {
                    snapName2.value="";
                    alert("Uspješno prijavljen kvar.")
                    console.log("Queued for sync");
                    startCapture();
                })
                .catch((error) => {
                    alert(error);
                    console.log(error);
                });
        };
        reader.readAsDataURL(file);
    }
    else{
        alert("Obavezno opišite kvar")
    }
}
btnUploadFile.addEventListener("click", function () {

    uploadFileInput.value = null;

    uploadFileInput.addEventListener("change", handleFileUpload);

    uploadFileInput.click();
});
document.getElementById("btnSnap").addEventListener("click", function (event) {
    canvas.width = player.getBoundingClientRect().width;
    canvas.height = player.getBoundingClientRect().height;
    canvas.getContext("2d").drawImage(player, 0, 0, canvas.width, canvas.height);
    stopCapture();
});

document
    .getElementById("btnUpload")
    .addEventListener("click", function (event) {
            event.preventDefault();
            if (!snapName.value.trim()) {
                alert("Obavezno opišite kvar")
                return false;
            }
            if ("serviceWorker" in navigator && "SyncManager" in window) {
                let url = canvas.toDataURL();
                fetch(url)
                    .then((res) => res.blob())
                    .then((blob) => {
                        let ts = new Date().toISOString();
                        let id = ts + snapName.value.replace(/\s/g, "_"); // ws->_
                        set(id, {
                            id,
                            ts,
                            title: snapName.value,
                            image: blob,
                        });
                        return navigator.serviceWorker.ready;
                    })
                    .then((swRegistration) => {
                        return swRegistration.sync.register("sync-snaps");
                    })
                    .then(() => {
                        snapName.value="";
                        alert("Uspješno prijavljen kvar.")
                        console.log("Queued for sync");
                        startCapture();
                    })
                    .catch((error) => {
                        alert(error);
                        console.log(error);
                    });
            } else {
                alert("TODO - vaš preglednik ne podržava bckg sync...");
            }
    });

let link = document.createElement('link');
link.rel = 'icon';
link.type = 'image/png';
link.href = './favicon.png';

var existingLink = document.querySelector('link[rel="icon"]');
if (existingLink) {
    document.head.removeChild(existingLink);
}

document.head.appendChild(link);