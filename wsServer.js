/**
 * Module for the WebSocket sever
 *
 * TODO: Maybe standardise message handlers?
 */

const crypto = require("crypto");
const WebSocket = require("ws");
const auth = require("./auth.js");
const fileManager = require("./fileManager.js");
const db = require("./db.js");
const labchecker = require("./labchecker.js");
const calendar = require("./calendar.js");

// Hash table to prevent cross site request forgery
const csrfTable = {};

/**
 * Checks for valid csrf tokens
 * @param {*} req The WS Request object
 * @return {Promise}
 */
function checkCsrf(req) {
    return new Promise((resolve, reject) => {
        if (req.csrf === csrfTable[req.sid]) return resolve();
        return reject();
    });
}

/**
 * Reply to a failed request with an error and details
 * @param {*} exception
 * @param {*} ws
 */
function replyToError(exception, ws) {
    let res = {
        type: {error: true},
        data: {msg: exception.message} // FOR DEBUG ONLY
    };
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(res));
    }
}

module.exports = (httpsServer) => {
    let config = {
        port: 8080,
        maxPayload: (30 * Math.pow(10, 6))
    };
    if (httpsServer) {
        config = {};
        config.server = httpsServer;
    }
    const wss = new WebSocket.Server(config);
    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    };

    wss.on("connection", function connection(ws) {
        ws.on("error", (err) => {
            console.log("WS ERROR: CONNECTION LOST: ", err);
        });
        ws.on("message", function incoming(message) {
            if (ws.readyState !== WebSocket.OPEN) {
                throw new Error("Web socket is not Open");
            }
            let req;
            try {
                req = JSON.parse(message);

            } catch (err) {
                console.log("WS PARSING MESSAGE ERROR:", err);
            }

            if (req.type.userExists) {
                // User Exists Request
                setTimeout(() => {
                    auth.userExists(req.data).then((reply) => {
                        let res = {
                            type: {userExists: true},
                            data: reply
                        };
                        ws.send(JSON.stringify(res));
                    });
                }, 200);
            } else if (req.type.login) {
                // Login Request
                // Delay by 500ms to stop bruteforce attacks
                setTimeout(() => {
                    auth.login(req.data).then((reply) => {
                        let csrf = crypto.randomBytes(128);
                        csrf = csrf.toString("base64");
                        if (reply.sid) {
                            csrfTable[reply.sid] = csrf;
                        }
                        let res = {
                            type: {login: true},
                            data: reply,
                            csrf
                        };
                        ws.send(JSON.stringify(res));
                    }).catch((exception) => {
                        replyToError(exception, ws);
                    });
                }, 500);
            } else if (req.type.register) {
                // Registration Request
                setTimeout(() => {
                    auth.register(req.data).then((reply) => {
                        let res = {
                            type: {register: true},
                            data: reply
                        };
                        ws.send(JSON.stringify(res));
                    }).catch((exception) => {
                        replyToError(exception, ws);
                    });
                }, 500);
            } else if (req.type.sid) {
                // sid Login Request
                setTimeout(() => {
                    auth.login(req.data).then((reply) => {
                        let csrf = crypto.randomBytes(128);
                        csrf = csrf.toString("base64");
                        if (reply.sid) {
                            csrfTable[reply.sid] = csrf;
                        }
                        let res = {
                            type: {sid: true},
                            data: reply,
                            csrf
                        };
                        ws.send(JSON.stringify(res));
                    }).catch((exception) => {
                        // console.log(exception);
                        replyToError(exception, ws);
                    });
                }, 200);
            } else if (req.type.fileList || req.type.musicList) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.getFL(req.sid).then((fileList) => {
                            let res = {
                                type: {},
                                data: fileList
                            };
                            res.type = req.type;
                            ws.send(JSON.stringify(res));
                        }).catch(() => {
                            replyToError(new Error("Failed to get file list"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.addNode) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.addNode(req.sid, req.data).then((data) => {
                            let res = {
                                // Reply with file list to update the UI
                                type: {fileList: true},
                                data
                            };
                            ws.send(JSON.stringify(res));
                            ws.send(JSON.stringify({type: {uploadDone: true}}));
                        }).catch((e) => {
                            console.log(e);
                            replyToError(new Error("Adding directory failed"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.removeNode) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.removeNode(req.sid, req.data.path,
                                req.data.name)
                          .then((data) => {
                            let res = {
                                type: {fileList: true},
                                data
                            };
                            ws.send(JSON.stringify(res));
                        }).catch(() => {
                            replyToError(new Error("Removing directory failed"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.getFile || req.type.editFile || req.type.imgPre) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.getFile(req.sid, req.data.path, req.data.name)
                          .then((data) => {
                            let res = {
                                type: {},
                                data
                            };
                            res.type = req.type;
                            if (req.type.imgPre) {
                                res.type["img" + Buffer.from(req.data.name).toString("base64")] = true;
                            }
                            ws.send(JSON.stringify(res));
                        }).catch((e) => {
                            console.log(e);
                            replyToError(new Error("Failed to download file"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.fav) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.favNode(req.sid, req.data.path)
                          .then((data) => {
                            let res = {
                                type: {fileList: true},
                                data
                            };
                            ws.send(JSON.stringify(res));
                        }).catch(() => {
                            replyToError(new Error("Favorising file failed"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.duplicateNode) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.duplicateNode(req.sid, req.data.path, req.data.name)
                          .then((data) => {
                            let res = {
                              type: {fileList: true},
                              data
                            };
                            ws.send(JSON.stringify(res));
                        }).catch(() => {
                              replyToError(new Error("Duplcating file failed"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.moveFile) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.moveFile(
                                            req.sid,
                                            req.data.path,
                                            req.data.newPath,
                                            req.data.name)
                          .then((data) => {
                            let res = {
                              type: {fileList: true},
                              data
                            };
                            ws.send(JSON.stringify(res));
                        }).catch(() => {
                              replyToError(new Error("Moving file failed"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.renameFile) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.renameFile(req.sid, req.data.path,
                                                  req.data.oldName,
                                                  req.data.newName)
                          .then((data) => {
                            let res = {
                              type: {fileList: true},
                              data
                            };
                            ws.send(JSON.stringify(res));
                        }).catch(() => {
                              replyToError(new Error("Renaming file failed"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.checkLab) {
                checkCsrf(req.csrf)
                    .then(() => {
                        labchecker.checkLab(req.data.date, req.data.lab,
                                                  req.data.time)
                          .then((data) => {
                            let res = {
                              type: {checkLab: true},
                              data
                            };
                            ws.send(JSON.stringify(res));
                        }).catch(() => {
                              replyToError(new Error("Checking lab failed"), ws);
                        });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.editNode) {
                checkCsrf(req.csrf)
                    .then(() => {
                        fileManager.editNode(req.sid, req.data)
                            .then((data) => {
                                let res = {
                                    type: {fileList: true},
                                    data
                                };
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Removing file failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.listLabs) {
                checkCsrf(req.csrf)
                    .then(() => {
                        labchecker.listLabs(req.data.date, req.data.time)
                            .then((data) => {
                                let res = {
                                    type: {listLabs: true},
                                    data
                                };
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Listing labs failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.listHours) {
                checkCsrf(req.csrf)
                    .then(() => {
                        labchecker.listHours(req.data.date, req.data.lab)
                            .then((data) => {
                                let res = {
                                    type: {listHours: true},
                                    data
                                };
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Listing hours failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.listLabsAndHours) {
                checkCsrf(req.csrf)
                    .then(() => {
                        labchecker.listLabsAndHours(req.data.date)
                            .then((data) => {
                                let res = {
                                    type: {listLabsAndHours: true},
                                    data
                                };
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Listing lab and hours failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.getSchedule || req.type.getAgenda) {
                checkCsrf(req.csrf)
                    .then(() => {
                        calendar.getSchedule(req.sid)
                            .then((data) => {
                                let res = {
                                    type: {},
                                    data
                                };
                                res.type = req.type;
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Getting schedule failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.storeDate) {
                checkCsrf(req.csrf)
                    .then(() => {
                        calendar.storeDate(req.data.date, req.sid)
                            .then((data) => {
                                let res = {
                                    type: {storeDate: true},
                                    data
                                };
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Storing data failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.addEvent) {
                checkCsrf(req.csrf)
                    .then(() => {
                        calendar.addEvent(req.sid, req.data.date, req.data.time,
                                          req.data.name)
                            .then((data) => {
                                let res = {
                                    type: {getSchedule: true},
                                    data
                                };
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Adding event failed"), ws);
                            });
                    })
                    .catch((e) => {
                        console.log(e)
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.getSettings || req.type.getBackground) {
                checkCsrf(req.csrf)
                    .then(() => {
                        db.query(`
                            SELECT desktop.background FROM users, desktop
                            WHERE users.sid="${req.sid}"
                            AND users.id = desktop.ownerID;
                            `).then((data) => {
                                const settings = {background: data[0].background};
                                let res = {
                                    type: {},
                                    data: settings
                                };
                                res.type = req.type;
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Getting settings failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else if (req.type.setSettings) {
                checkCsrf(req.csrf)
                    .then(() => {
                        db.query(`
                            UPDATE desktop, users SET background="${req.data.background}"
                            WHERE users.sid="${req.sid}"
                            AND users.id = desktop.ownerID;
                            `).then((data) => {
                                const settings = {background: req.data.background};
                                let res = {
                                    type: {getSettings: true},
                                    data: settings
                                };
                                ws.send(JSON.stringify(res));
                            }).catch(() => {
                                replyToError(new Error("Setting settings failed"), ws);
                            });
                    })
                    .catch(() => {
                        replyToError(new Error("CSRF Attack"), ws);
                    });
            } else {
                replyToError(new Error("Bad Request"), ws);
            }
        });
    });
};
