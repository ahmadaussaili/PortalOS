/**
 * Module for interaction with mysql db
 */
const mysql = require("mysql");
const dbConfig = require("./dbConfig.json");

let con = mysql.createConnection(dbConfig);

let handleDisconnect = () => {
    con.on("error", function (err) {
        console.log("db error", err);
        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            console.log("Recovering db connection...");
            con = mysql.createConnection(dbConfig);
            handleDisconnect();
        } else {
            throw err;
        }
    });
};
handleDisconnect();

let connected = false;

con.connect(function (err) {
    if (err) throw err;
    connected = true;
    console.log("Connected to db");
});

// Keep the session alive
setInterval(() => {
    con.query("SELECT 1;");
}, 60 * 1000);

exports.query = (sql) => {
    return new Promise((resolve, reject) => {
        if (!connected) reject(new Error("Not connected to MySQL"));
        con.query(sql, function (err, result) {
            if (err) reject(err);
            resolve(result);
        });
    });
};

// https://stackoverflow.com/questions/7744912
exports.escape = (str) => {
    if (!str) return "";
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\" + char;
        }
    });
};
