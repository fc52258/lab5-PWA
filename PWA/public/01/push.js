let btnNotif = document.getElementById("btnEnableNotifications");

if ("Notification" in window && "serviceWorker" in navigator) {
    btnNotif.addEventListener("click", function () {
        Notification.requestPermission(async function (res) {
            console.log("Request permission result:", res);
            if (res === "granted") {
                await setupPushSubscription();
            } else {
                console.log("User denied push notifs:", res);
            }
        });
    });
} else {
    btnNotif.setAttribute("disabled", "");
    btnNotif.classList.add("btn-outline-danger");
}

function urlBase64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function setupPushSubscription() {
    try {
        let reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (sub === null) {
            var publicKey =
                "BE-SGqbYwwnMoTMLB4E7WyeawN2cxbv8EBTXQNuD_DLpWUyLiv9QDm8WHdTqasuhl9-p41pXK4y10y6MJIp8Sw4";
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
            let res = await fetch("https://pwa-0035522584.onrender.com/saveSubscription", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ sub }),
            });
            if (res.ok) {
                alert(
                    "Odlično, vaša pretplata je uspješno spremljena:\n" +
                        JSON.stringify(sub)
                );
            }
        } else {
            alert("Već ste pretplaćeni, detalji pretplate:\n" + JSON.stringify(sub));
        }
    } catch (error) {
        console.log(error);
    }
}
