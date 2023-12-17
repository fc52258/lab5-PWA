const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const fse = require('fs-extra');
const httpPort = 80;
let VERSION;

if (process.env.VER) {
    VERSION = process.env.VER.trim();
    console.log("Serving version: " + VERSION);
} else {
    console.error(
        "App version not set. Set the env var 'VER' to 01, 02, ... before you run the server"
    );
    process.exit();
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(new Date().toLocaleString() + " " + req.url);
    next();
});

app.use(express.static(path.join(__dirname, "PWA", "public", VERSION)));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "PWA", "public", VERSION, "index.html"));
});


const UPLOAD_PATH = path.join(__dirname, "PWA", "public", VERSION, "uploads");
var uploadSnaps = multer({
    storage:  multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, UPLOAD_PATH);
        },
        filename: function (req, file, cb) {
            let fn = file.originalname.replaceAll(":", "-");
            cb(null, fn);
        },
    })
}).single("image");
app.post("/saveSnap",  function (req, res) {
    uploadSnaps(req, res, async function(err) {
        if (err) {
            console.log(err);
            res.json({
                success: false,
                error: {
                    message: 'Upload failed:: ' + JSON.stringify(err)
                }
            });
        } else {
            console.log(req.body);
            res.json({ success: true, id: req.body.id });
            await sendPushNotifications(req.body.title);
        }
    });
});
app.get("/snaps", function (req, res) {
    let files = fse.readdirSync(UPLOAD_PATH);
    files = files.reverse().slice(0, 10);
    console.log("In", UPLOAD_PATH, "there are", files);
    res.json({
        files
    });
});

const webpush = require('web-push');

let subscriptions = [];
const SUBS_FILENAME = 'subscriptions.json';
try {
    subscriptions = JSON.parse(fs.readFileSync(SUBS_FILENAME));
} catch (error) {
    console.error(error);    
}

app.post("/saveSubscription", function(req, res) {
    console.log(req.body);
    let sub = req.body.sub;
    subscriptions.push(sub);
    fs.writeFileSync(SUBS_FILENAME, JSON.stringify(subscriptions));
    res.json({
        success: true
    });
});

async function sendPushNotifications(snapTitle) {
    webpush.setVapidDetails('mailto:fc52258@fer.hr', 
    "BE-SGqbYwwnMoTMLB4E7WyeawN2cxbv8EBTXQNuD_DLpWUyLiv9QDm8WHdTqasuhl9-p41pXK4y10y6MJIp8Sw4", 
    "bUv5C7gkX30yTPw3FSjgyJWkuKzIu_mWXgrLK0v4hBg");
    subscriptions.forEach(async sub => {
        try {
            console.log("Sending notif to", sub);
            await webpush.sendNotification(sub, JSON.stringify({
                title: 'New snap!',
                body: 'Somebody just snaped a new photo: ' + snapTitle,
                redirectUrl: '/index.html'
              }));    
        } catch (error) {
            console.error(error);
        }
    });
}

app.listen(httpPort, function () {
    console.log(`HTTP listening on port: ${httpPort}`);
});

