/**
 * Module for serving static files over HTTP or HTTPS if certs exist
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const url = require("url");

const {exec} = require("child_process");

const PORT = 8000;

let privateKey;
let certificate;
let credentials;

// Check if certs exist
if (fs.existsSync("/home/ubuntu/PortalOSCerts/cert.pem")) {
    privateKey = fs.readFileSync("/home/ubuntu/PortalOSCerts/privkey.pem").toString();
    certificate = fs.readFileSync("/home/ubuntu/PortalOSCerts/cert.pem").toString();
    credentials = {key: privateKey, cert: certificate};
}

/**
 * Redirect the request to the root
 * @param {*} response The HTTP server response object 
 */
function serveRedirect(response) {
    response.writeHead(302, {
        "Location": "/"
    });
    response.end();
}


/**
 * Server the file as the response
 * @param {*} response The HTTP server response object
 * @param {*} filename The file to serve
 */
function serveFile(response, filename) {
    fs.readFile(filename, function (err, file) {
        if (err) {
            console.log(err);
            return;
        }
        let contentType = "text/html";
        switch (filename.slice(filename.length - 3)) {
            case ".js":
                contentType = "application/js";
                break;
            case "css":
                contentType = "text/css";
                break;
            case "svg":
                contentType = "image/svg+xml";
                break;
            case "png":
                contentType = "image/png";
                break;
            case "ico":
                contentType = "image/x-icon";
                break;
        }
        response.writeHead(200, {"Content-Type": contentType});
        response.end(file, "utf-8");
    });
}

/**
 * Serve a file from a directory if it exists
 * @param {*} response The HTTP response object
 * @param {*} dir The dir to serve the file from
 * @param {*} filename The requested file
 */
function serveDir(response, dir, filename) {
    let file = dir + "/" + filename;
    if (fs.existsSync(file)) {
        serveFile(response, file);
    } else {
        serveRedirect(response);
    }
}

let fileServer = (request, response) => {
    let path = url.parse(request.url).pathname;
    path = path.split("/");
    switch (path[1]) {
        case "":
            serveFile(response, "public/index.html");
            break;
        case "favicon.ico":
            serveFile(response, "public/favicon.ico");
            break;
        case "manifest.json":
            serveFile(response, "public/manifest.json");
            break;
        case "css":
            serveDir(response, "public/css/", path[2]);
            break;
        case "js":
            serveDir(response, "public/js/", path[2]);
            break;
        case "assets":
            if (path[2] == "images") {
                if (path[3] == "weather") {
                    serveDir(response, "public/assets/images/weather", path[4]);
                    break;
                }
                serveDir(response, "public/assets/images", path[3]);
                break;
            }
            serveRedirect(response);
            break;
        case ".well-known":
            path.splice(0, 3);
            serveDir(response, "public/.well-known/acme-challenge",
                path.join("/"));
            break;
        case "git":
            if (request.headers["x-gitlab-token"]
                == "ZJybk7IXleoJ93c64SSoIdNIFxA9IGPmKEm") {
                console.log("git pull");
                exec("git pull", (err, stdout, stderr) => {
                    console.log(stdout + "\n\nRestart");
                });
                response.writeHead(200, {"Content-Type": "text/html"});
                response.end("Done", "utf-8");
                break;
            }
            serveRedirect(response);
            break;
        default:
            serveRedirect(response);
    }
};

let httpServer = () => {
    // Server static files:
    http.createServer(fileServer).listen(PORT, "0.0.0.0");
    console.log("UNSECURE Server Initialized on 0.0.0.0:" + PORT);
    return false;
};

let httpsServer = () => {
    https.createServer(credentials, fileServer)
        .listen(PORT, "0.0.0.0");
    // Upgrade insecure connections
    http.createServer((request, response) => {
        response.writeHead(302, {
            "Location": "https://" + request.headers.host + request.url
        });
        response.end();
    }).listen(8001, "0.0.0.0");
    let ws = https.createServer(credentials, (req, res) => {
        return;
    }).listen(8080, "0.0.0.0");

    console.log("Secure Server Initialized on 0.0.0.0:" + PORT);
    return ws;
};

let server = httpServer;
if (certificate) {
    server = httpsServer;
}

module.exports = server;
