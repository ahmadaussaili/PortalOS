/**
 * Module for managing user registration and authorisation
 */
const db = require("./db.js");
const crypto = require("crypto");

/**
 * Validate email and password
 * @param {*} email 
 * @param {*} password
 * @return {bool} Valid or not
 */
function validateReg(email, password) {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return (email && password && password.length >= 8 && re.test(email));
}

let userExists = (data) => {
    return new Promise((resolve, reject) => {
        let email = db.escape(data.email);
        db.query("SELECT id FROM users WHERE email='" + email + "';")
            .then((result) => {
                resolve({isRegistered: result.length > 0});
            }).catch(reject);
    });
};

exports.userExists = userExists;

exports.login = (data) => {
    let emailLogin = (resolve, reject) => {
        let email = db.escape(data.email);
        if (!validateReg(email, "password")) reject(new Error("Bad Email"));
        db.query("SELECT id, hash, salt FROM users WHERE email='"
            + email + "';")
            .then((result) => {
                result = result[0];
                let salt = new Buffer(result.salt, "base64");
                crypto.pbkdf2(data.password, salt, 10000, 512, "sha512",
                    (err, dk) => {
                        if (err) throw err;
                        dk = dk.toString("base64");
                        if (dk == result.hash) {
                            // sid gen/storage
                            let sid = crypto.randomBytes(128);
                            sid = sid.toString("base64");
                            db.query("UPDATE users SET sid='" + sid
                                + "' WHERE id=" + result.id + ";")
                                .then((result) => {
                                    resolve({"logged-in": true, "sid": sid});
                                }).catch(reject);
                            return;
                        }
                        reject(new Error("Incorrect Login Details"));
                    });
            }).catch(reject);
    };
    let sidLogin = (resolve, reject) => {
        let sid = db.escape(data.sid);
        db.query("SELECT id FROM users WHERE sid='" + sid + "';")
            .then((result) => {
                if (result.length > 0) {
                    // sid gen/storage
                    let sid = crypto.randomBytes(128);
                    sid = sid.toString("base64");
                    db.query("UPDATE users SET sid='" + sid
                        + "' WHERE id=" + result[0].id + ";")
                        .then((result) => {
                            resolve({"logged-in": true, "sid": sid});
                        }).catch(reject);
                    return;
                }
                resolve({"error": true});
            }).catch(reject);
    };
    if (data.sid) return new Promise(sidLogin);
    if (data.email) return new Promise(emailLogin);
    return new Promise((resolve, reject) => {
        reject(new Error("Bad Request"));
    });
};

exports.register = (data) => {
    return new Promise((resolve, reject) => {
        if (!validateReg(data.email, data.password)) {
            reject("Bad email or password");
            return;
        }
        let email = db.escape(data.email);
        userExists({email: email}).then((res) => {
            if (res.isRegistered) reject(new Error("Already Registered"));
            let salt = crypto.randomBytes(128);
            crypto.pbkdf2(data.password, salt, 10000, 512, "sha512",
                (err, dk) => {
                    if (err) throw err;
                    dk = dk.toString("base64");
                    salt = salt.toString("base64");
                    const q1 = db.query("INSERT INTO users (email, hash, salt) VALUES ('"
                        + email + "', '" + dk + "', '" + salt +"');");
                    const q2 = db.query(`
                        INSERT INTO dir (JSON) VALUES 
                            ("{\\"dir\\": true, \\"name\\": \\"Home\\", \\"children\\": []}");
                        `);
//creating calendar id for the each user 
		            const q3 = db.query(`
                        INSERT INTO calendar (JSON) VALUES 
                            ("{\\"event\\":[]}");
                        `);
                    Promise.all([q1, q2, q3]).then((resArr) => {
                        const userId = resArr[0].insertId;
                        const dirId = resArr[1].insertId;
                        const calendarId = resArr[2].insertId;
                        db.query(`
                            INSERT INTO desktop (ownerID, rootDirID, background, calendarID)
                             VALUES (${userId}, ${dirId}, "/assets/images/bg.png", ${calendarId});
                        `).then(() => {
                            resolve({"registered": true});
                        }).catch(reject);
                    }).catch(reject);
                });
        }).catch(reject);
    });
};
