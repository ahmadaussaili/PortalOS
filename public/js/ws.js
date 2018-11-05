/**
 * Module for connection to and managing of web sockets
 */
const DEBUG = true;
const s = location.protocol == "https:" ? "s" : "";

const wsURL = "ws" + s + "://" + window.location.hostname + ":8080";
let ws = new WebSocket(wsURL);
let csrf = "";
let pendingReply = {};

ws.onmessage = (event) => {
    let res = JSON.parse(event.data);
    if (DEBUG) console.log("Server:", res);
    if (res.csrf) csrf = res.csrf;
    if (res.type.error) errorUI.newError(res.data.msg);
    Object.keys(res.type).forEach((elm) => {
        if (pendingReply[elm]) {
            pendingReply[elm](res.data);
        }
    });
};

ws.onclose = (event) => {
    errorUI.newError("Lost connection, refresh to try and reconnect.", () => {
        location.reload();
    });
};

/**
 * Method for sending ws req to server of given type and data
 * @param {string} type Request type
 * @param {object} data Request data object
 */
function sendWS(type, data) {
    let req = {
        "type": {},
        "data": data,
        "csrf": csrf
    };
    req.type[type] = true;
    if (
        !req.type.sid
        && !req.type.userExists
        && !req.type.register
        && !req.type.login
    ) {
        req.sid = cookies.get("sid");
    }
    if (DEBUG) console.log(req);
    req = JSON.stringify(req);
    ws.send(req);
}

/**
 * Method for sending ws to server of given type and data and acting on reply
 * @param {string} type Request type
 * @param {object} data Request data object
 * @param {function} callback Reply callback
 */
function askWS(type, data, callback) {
    // Pause until ready... Maybe this is bad?
    if (!ws.readyState) {
        setTimeout(() => {
            askWS(type, data, callback);
        }, 100);
        return;
    }
    let req = {
        "type": {},
        "data": data,
        "csrf": csrf
    };
    req.type[type] = true;

    // If not a login req add the sid to the request
    if (
        !req.type.sid
        && !req.type.userExists
        && !req.type.register
        &&!req.type.login
    ) {
        req.sid = cookies.get("sid");
    }
    if (DEBUG) console.log("Ask:", req);
    req = JSON.stringify(req);
    ws.send(req);
    pendingReply[type] = callback;
}
