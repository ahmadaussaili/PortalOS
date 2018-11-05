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
const Readable = require("stream").Readable;

const hash = crypto.createHash("sha256");
const gzip = zlib.createGzip();
const gunzip = zlib.createGunzip();

/**
 * Recersively traverse the file system to add the dir at the given path
 * @param {*} root
 * @param {*} path
 * @param {*} name
 */
function addDir(root, path, name) {
    if (path === "/") {
        root.children.push({
            name,
            dir: true,
            children: []
        });
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
        addDir(root.children[childIndex], pathSplit[1], name);
    }
}

/**
 * Recersively traverse the file system to add the file at the given path
 * @param {*} root
 * @param {*} path
 * @param {*} name
 * @param {*} content File contents
 * @param {*} email
 */
function addFile(root, path, name, content, email) {
    if (path === "/") {
        // Unique file name from hash
        hash.update(email + path + name);
        let loc = hash.digest("hex");

        // File compression/writing
        let inp = new Readable;
        inp.push(content);
        inp.push(null);
        let out = fs.createWriteStream("./files/" + loc + ".gz");
        inp.pipe(gzip).pipe(out);

        root.children.push({
            name,
            loc
        });
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
        addFile(root.children[childIndex], pathSplit[1], name, content, email);
    }
}
/**
 * Stringify the object using JSON and store to the DB
 * @param {Object} obj
 * @param {Object} sid
 */
//---------------------------------------------
//implement storeDate, getSchedule and addevent AHMAD
//----------------------------------------------
function storeDate(date, sid) {
//date is going to be an object that contains the date and the name
//stringinfy the object to store into a database
    let stringDate = JSON.stringify(date).replace(/\"/g, "\\\"");
    //store an event in the database
    return new Promise((resolve, reject) => {
            db.query(`
                UPDATE calendar, users, desktop SET JSON = "${stringDate}"
                WHERE users.sid="${sid}"
                AND users.id = desktop.ownerID AND desktop.calendarID = calendar.id;
            `).then((data) => {
                resolve();
            }).catch(reject);
        });
}

module.exports.storeDate = storeDate;

//method which return data of an important date
module.exports.getSchedule = (sid) => {
    return new Promise((resolve, reject) => {
        db.query(`
            SELECT calendar.JSON FROM calendar, users, desktop WHERE users.sid="${sid}"
            AND users.id = desktop.ownerID AND desktop.calendarID = calendar.id;
        `).then((data) => {
            resolve(JSON.parse(data[0].JSON));
        }).catch(reject);
    });
};
//--------------------------------------------------------------------
//function to create an event
function addEvent(sid, date, time, name) {
    return new Promise((resolve, reject) => { 
        module.exports.getSchedule(sid).then((root) => {
            root.event.push({
                date,
                time,
                name
            });
        storeDate(root, sid).then(() => resolve(root)).catch(reject);
        }).catch(reject);
    });
}

module.exports.addEvent = addEvent;

//---------------------------------------------------
module.exports.getFile = (sid, path) => {
    // hash email + path + name to get filename, decompress, serve

	  // Get filename
		hash.update(email + path + name);
		let filename = hash.digest("hex");

		// Decompress
		let inp = new Readable;
		let out = fs.readFile("./files" + filename + ".gz");
		out.pipe(gunzip).pipe(inp);

		// Serve
		inp.push(null);
		return inp;
};

// name + path + isDir + file need extracting from reqData
module.exports.addNode = (sid, reqData) => {
    const isDir = reqData.dir;
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
            if (isDir) {
                addDir(root, path, name);
            } else {
                addFile(root, path, name, file, data[0].email);
            }
            storeObjectToDB(root, sid);
            resolve(root);
        }).catch(reject);
    });
};

module.exports.removeNode = (sid, path, name) => {
    // Remove reference in the root and delete file (calc hash)
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            const root = JSON.parse(data[0].JSON);
            (function fav(root, path) {
                if (path === "/") {
                    for (let i = 0; i < root.children.length; i++) {
                        if (root.children[i]["name"] === name) {
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
                fav(root.children[childIndex], pathSplit[1]);
            })(root, path);
            storeObjectToDB(root, sid);
            resolve(root);
        }).catch(reject);
    });
};
//duplicate
module.exports.duplicateNode = (sid, path, name) => {
    // Remove reference in the root and delete file (calc hash)
    return new Promise((resolve, reject) => {
        db.query(`
        SELECT dir.JSON, users.email FROM dir, users, desktop
        WHERE users.sid="${sid}"
        AND users.id = desktop.ownerID AND desktop.rootDirID = dir.id;
        `).then((data) => {
            const root = JSON.parse(data[0].JSON);
            (function fav(root, path) {
                if (path === "/") {
                    for (let i = 0; i < root.children.length; i++) {
                        if (root.children[i]["name"] === name) {
                            root.children.push(root.children[i]);
                            root.children[root.children.length - 1].name += " copy";
                            return;
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
                fav(root.children[childIndex], pathSplit[1]);
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
