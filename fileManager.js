/**
 * Module for the management of file systems (JSON in db) and actual user files
 * on the server. Currently compresses files and stores them at a unique(?) hash
 * for a filename within the ./files/ dir.
 *
 * TODO: Implement file (image) previews on HTTP
 * TODO: Maybe don't compress/alter settings? (Is it too slow? Idk)
 */
const crypto = require("crypto");
const db = require("./db");
const fs = require("fs");
const zlib = require("zlib");

const gzip = zlib.createGzip();
const gunzip = zlib.createGunzip();

/**
 * Check if a filename is taken
 * @param {*} needle 
 * @param {*} haystack 
 * @return {Boolean}
 */
function childExists(needle, haystack) {
    for (let i = 0; i < haystack.length; i++) {
        if (haystack[i].name === needle) {
            return true;
        }
    }
    return false;
}

/**
 * 
 * @param {*} name 
 * @param {*} dirArr
 * @return {*} 
 */
function uniquify(name, dirArr) {
    let nameApend = 1;
    let nameSplit = name.split(".");
    let ext;
    let origName;

    if (nameSplit.length > 1) {
        ext = "." + nameSplit.pop();
        origName = nameSplit.join(".");
    } else {
        ext = "";
        origName = name;
    }

    while (childExists(name, dirArr)) {
        name = origName + " " + nameApend++ + ext;
    }

    return name;
}

/**
 * Recersively traverse the file system to add the dir at the given path
 * @param {*} root
 * @param {*} path
 * @param {*} name
 * @param {*} cb
 */
function addDir(root, path, name, cb) {
    if (path === "/") {
        name = uniquify(name, root.children);
        root.children.push({
            name,
            dir: true,
            children: []
        });
        cb();
    } else {
        let pathSplit = [
            path.substring(1, path.indexOf("/", 1)),
            path.substring(path.indexOf("/", 1), path.length)
        ];
        let childIndex = -1;
        for (let i = 0; i < root.children.length; i++) {
            if (root.children[i]["name"] === pathSplit[0]) {
                childIndex = i;
            }
        }
        if (childIndex === -1) {
            throw new Error("Invalid Path");
        }
        addDir(root.children[childIndex], pathSplit[1], name, cb);
    }
}

/**
 * Recersively traverse the file system to add the file at the given path
 * @param {*} root
 * @param {*} path
 * @param {*} name
 * @param {*} content File contents
 * @param {*} mime File Type
 * @param {*} email
 * @param {*} cb
 */
function addFile(root, path, name, content, mime, email, cb) {
    if (path === "/") {
        // Ensure name is unique for the path
        name = uniquify(name, root.children);

        // Unique file name from hash
        const hash = crypto.createHash("sha256");
        hash.update(email + path + name);
        let loc = hash.digest("hex");

        // File compression/writing
        let contentIntA = new Buffer(Uint8Array.from(content));
        fs.writeFile("./files/" + loc + ".gz", contentIntA, (err) => {
            if (err) throw err;
            root.children.push({
                name,
                loc,
                mime
            });
            cb();
        });
        //inp.pipe(gzip).pipe(out);
    } else {
        let pathSplit = [
            path.substring(1, path.indexOf("/", 1)),
            path.substring(path.indexOf("/", 1), path.length)
        ];
        let childIndex = -1;
        for (let i = 0; i < root.children.length; i++) {
            if (root.children[i]["name"] === pathSplit[0]) {
                childIndex = i;
            }
        }
        if (childIndex === -1) {
            throw new Error("Invalid Path");
        }
        addFile(root.children[childIndex], pathSplit[1], name, content, mime,
                email, cb);
    }
}
/**
 * Recersively traverse the file system to edit the file at the given path
 * @param {*} root
 * @param {*} path
 * @param {*} name
 * @param {*} content New file contents
 * @param {*} email
 * @param {*} cb
 */
function editFile(root, path, name, content, email, cb) {
    if (path === "/") {
        // Unique file name from hash
        const hash = crypto.createHash("sha256");
        hash.update(email + path + name);
        let loc = hash.digest("hex");

        // File compression/writing
        let contentIntA = new Buffer(Uint8Array.from(content));
        fs.writeFile("./files/" + loc + ".gz", contentIntA, (err) => {
            if (err) throw err;
            cb();
        });
        //inp.pipe(gzip).pipe(out);
    } else {
        let pathSplit = [
            path.substring(1, path.indexOf("/", 1)),
            path.substring(path.indexOf("/", 1), path.length)
        ];
        let childIndex = -1;
        for (let i = 0; i < root.children.length; i++) {
            if (root.children[i]["name"] === pathSplit[0]) {
                childIndex = i;
            }
        }
        if (childIndex === -1) {
            throw new Error("Invalid Path");
        }
        editFile(root.children[childIndex], pathSplit[1], name, content,
            email, cb);
    }
}

/**
 * Stringify the object using JSON and store to the DB
 * @param {Object} obj
 * @param {Object} sid
 */
function storeObjectToDB(obj, sid) {
    let stringObject = JSON.stringify(obj).replace(/\"/g, "\\\"");
    // promise works for events that we do not know how long they are going to take
    return new Promise((resolve, reject) => {
            db.query(`
                UPDATE dir, users, desktop SET JSON = "${stringObject}"
                WHERE users.sid="${sid}"
                AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
            `).then((data) => {
                resolve();
            }).catch(reject);
        });
}

// method which gets JSON, parses it and returns it
module.exports.getFL = (sid) => {
    return new Promise((resolve, reject) => {
        db.query(`
            SELECT dir.JSON FROM dir, users, desktop WHERE users.sid="${sid}"
            AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            resolve(JSON.parse(data[0].JSON));
        }).catch(reject);
    });
};

module.exports.getFile = (sid, path, name) => {
    // hash email + path + name to get filename, decompress, serve

    // Get filename
    // hash.update(email + path + name);
    // let filename = hash.digest("hex");
    return new Promise((resolve, reject) => {
        db.query(`
            SELECT dir.JSON FROM dir, users, desktop WHERE users.sid="${sid}"
            AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            let filename;
            let mime;
            const root = JSON.parse(data[0].JSON);
            (function fav(root, path) {
                if (path === "/") {
                    let childIndex = -1;
                    for (let i = 0; i < root.children.length; i++) {
                        if (root.children[i]["name"] === name) {
                            childIndex = i;
                        }
                    }
                    filename = root.children[childIndex].loc;
                    mime = root.children[childIndex].mime;
                    return;
                }
                let pathSplit = [
                    path.substring(1, path.indexOf("/", 1)),
                    path.substring(path.indexOf("/", 1), path.length)
                ];
                let childIndex = -1;
                for (let i = 0; i < root.children.length; i++) {
                    if (root.children[i]["name"] === pathSplit[0]) {
                        childIndex = i;
                    }
                }
                if (childIndex === -1) {
                    throw new Error("Invalid Path");
                }
                fav(root.children[childIndex], pathSplit[1]);
            })(root, path);
            // let inp = new Readable;
            if (fs.existsSync("./files/" + filename + ".gz")) {
                //let inp = fs.createReadStream("./files/" + filename + ".gz");
                //let out = fs.createWriteStream("./files/tmp");
                //inp.pipe(gunzip).pipe(out);
                //inp.pipe(out);
                //out.on("close", () => {
                    fs.readFile("./files/" + filename + ".gz", (e, file) => {
                        if (e) throw e;
                        resolve({content: [...file], name, mime});
                    });
                //});
            } else {
                reject();
            }
        }).catch(reject);
    });
};

// name + path + isDir + file need extracting from reqData
module.exports.addNode = (sid, reqData) => {
    const isDir = reqData.dir;
    const path = reqData.path;
    const file = reqData.content;
    const name = reqData.name;
    const mime = reqData.mime || "text/plain";
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            const root = JSON.parse(data[0].JSON);
            const cb = () => {
                storeObjectToDB(root, sid).then(() => {
                    resolve(root);
                });
            };
            if (isDir) {
                addDir(root, path, name, cb);
            } else {
                addFile(root, path, name, file, mime, data[0].email, cb);
            }
        }).catch(reject);
    });
};

module.exports.editNode = (sid, reqData) => {
    const path = reqData.path;
    const file = reqData.content;
    const name = reqData.name;
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            const root = JSON.parse(data[0].JSON);
            const cb = () => {
                storeObjectToDB(root, sid).then(() => {
                    resolve(root);
                });
            };
            editFile(root, path, name, file, data[0].email, cb);
        }).catch(reject);
    });
};

module.exports.removeNode = (sid, path, name) => {
    // Remove reference in the root and delete file
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            const root = JSON.parse(data[0].JSON);
            (function del(root, path) {
                if (path === "/") {
                    for (let i = 0; i < root.children.length; i++) {
                        if (root.children[i]["name"] === name) {
                            let loc = root.children[i].loc;
                            if (loc && fs.existsSync("./files/" + loc + ".gz")) {
                                fs.unlink("./files/" + loc + ".gz", (err) => {
                                    if (err) console.log(err);
                                });
                            }
                            if (root.children[i].dir) {
                                // Recursively delete all sub files?
                                // Maybe dont let the user delete folder unless
                                //  they first delete all sub files?
                            }
                            root.children.splice(i, 1);
                        }
                    }
                    return;
                }
                let pathSplit = [
                    path.substring(1, path.indexOf("/", 1)),
                    path.substring(path.indexOf("/", 1), path.length)
                ];
                let childIndex = -1;
                for (let i = 0; i < root.children.length; i++) {
                    if (root.children[i]["name"] === pathSplit[0]) {
                        childIndex = i;
                    }
                }
                if (childIndex === -1) {
                    throw new Error("Invalid Path");
                }
                del(root.children[childIndex], pathSplit[1]);
            })(root, path);
            storeObjectToDB(root, sid);
            resolve(root);
        }).catch(reject);
    });
};
//duplicate 
module.exports.duplicateNode = (sid, path, name) => {
    return new Promise((resolve, reject) => {
        // Get the file
        module.exports.getFile(sid, path, name).then((file) => {
            let options = {
                path,
                "content": file.content,
                "name": name,
                "mime": file.mime
            };
            module.exports.addNode(sid, options).then(resolve).catch(reject);
        }).catch(reject);
    });
};

module.exports.moveFile = (sid, path, newPath, name) => {
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
                const root = JSON.parse(data[0].JSON);
                let nodeToMove = null;
                (function move(root, path) {
                    if (path === "/") {
                        for (let i = 0; i < root.children.length; i++) {
                            if (root.children[i]["name"] === name) {
                                // Deep copy incase its a dir
                                nodeToMove = JSON.parse(JSON.stringify(
                                    root.children[i]
                                ));

                                // remove the element from its original pos
                                root.children.splice(i, 1);
                            }
                        }
                        return;
                    }
                    let pathSplit = [
                        path.substring(1, path.indexOf("/", 1)),
                        path.substring(path.indexOf("/", 1), path.length)
                    ];
                    let childIndex = -1;
                    for (let i = 0; i < root.children.length; i++) {
                        if (root.children[i]["name"] === pathSplit[0]) {
                            childIndex = i;
                        }
                    }
                    if (childIndex === -1) {
                        throw new Error("Invalid Path");
                    }
                    move(root.children[childIndex], pathSplit[1]);
                })(root, path);
                (function move2(root, path) {
                    if (path === "/") {
                        root.children.push(nodeToMove);
                        return;
                    }
                    let pathSplit = [
                        path.substring(1, path.indexOf("/", 1)),
                        path.substring(path.indexOf("/", 1), path.length)
                    ];
                    let childIndex = -1;
                    for (let i = 0; i < root.children.length; i++) {
                        if (root.children[i]["name"] === pathSplit[0]) {
                            childIndex = i;
                        }
                    }
                    if (childIndex === -1) {
                        throw new Error("Invalid Path");
                    }
                    move2(root.children[childIndex], pathSplit[1]);
                })(root, newPath);
                storeObjectToDB(root, sid);
                resolve(root);
            }).catch(reject);
    });
};

module.exports.renameFile = (sid, path, name, newName) => {
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
                const root = JSON.parse(data[0].JSON);
                (function rename(root, path) {
                    if (path === "/") {
                        for (let i = 0; i < root.children.length; i++) {
                            if (root.children[i]["name"] === name) {
                                newName = uniquify(newName, root.children);
                                root.children[i].name = newName;
                            }
                        }
                        return;
                    }
                    let pathSplit = [
                        path.substring(1, path.indexOf("/", 1)),
                        path.substring(path.indexOf("/", 1), path.length)
                    ];
                    let childIndex = -1;
                    for (let i = 0; i < root.children.length; i++) {
                        if (root.children[i]["name"] === pathSplit[0]) {
                            childIndex = i;
                        }
                    }
                    if (childIndex === -1) {
                        throw new Error("Invalid Path");
                    }
                    rename(root.children[childIndex], pathSplit[1]);
                })(root, path);
                storeObjectToDB(root, sid);
                resolve(root);
            }).catch(reject);
    });
};

module.exports.favNode = (sid, path) => {
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            const root = JSON.parse(data[0].JSON);
            (function fav(root, path) {
                if (path === "/") {
                    root.fav = (root.fav) ? undefined : true;
                    return;
                }
                let pathSplit = [
                    path.substring(1, path.indexOf("/", 1)),
                    path.substring(path.indexOf("/", 1), path.length)
                ];
                let childIndex = -1;
                for (let i = 0; i < root.children.length; i++) {
                    if (root.children[i]["name"] === pathSplit[0]) {
                        childIndex = i;
                    }
                }
                if (childIndex === -1) {
                    throw new Error("Invalid Path");
                }
                fav(root.children[childIndex], pathSplit[1]);
            })(root, path);
            storeObjectToDB(root, sid);
            resolve(root);
        }).catch(reject);
    });
};
