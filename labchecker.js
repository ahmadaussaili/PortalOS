const db = require("./db.js");

module.exports.checkLab = (date, lab, time) => {
    return new Promise((resolve, reject) => {
	dateFormat = new Date(date);
	week = getWeek(dateFormat);
	day = dateFormat.getDay(); // Returns the day of the week from 0 to 6.
	console.log("From backend checkLab");
	console.log(week, day, date, dateFormat, time, lab);
        db.query(`
            SELECT * FROM labs WHERE week = "${week}" 
            AND day = "${day}" AND hour = "${time}" AND room = "${lab}";
        `).then((data) => {
	    console.log(JSON.stringify(data));
	    resolve(JSON.stringify(data));
        }).catch(reject)
      });
};

module.exports.listLabs = (date, time) => {
    return new Promise((resolve, reject) => {
	dateFormat = new Date(date);
	week = getWeek(dateFormat);
	day = dateFormat.getDay(); // Returns the day of the week from 0 to 6.
	console.log("From backend listLabs");
	console.log(week, day, date, dateFormat, time);
	db.query(`
	    SELECT room FROM labs WHERE week = "${week}"
	    AND day = "${day}" AND hour = "${time}";
	`).then((data) => {
	    console.log(JSON.stringify(data));
	    resolve(JSON.stringify(data));
	}).catch(reject);
    });
};

module.exports.listHours = (date, lab) => {
    return new Promise((resolve, reject) => {
	dateFormat = new Date(date);
	week = getWeek(dateFormat);
	day = dateFormat.getDay(); // Returns the day of the week from 0 to 6.
	console.log("From backend listHours");
	console.log(week, day, date, dateFormat, lab);
        db.query(`
            SELECT hour FROM labs WHERE week = "${week}"
	    AND day = "${day}" AND room = "${lab}";
        `).then((data) => {
	    console.log(data);
            resolve(JSON.stringify(data));
        }).catch(reject);
    });
};

module.exports.listLabsAndHours = (date) => {
    return new Promise((resolve, reject) => {
	dateFormat = new Date(date);
	week = getWeek(dateFormat);
	day = dateFormat.getDay(); // Returns the day of the week from 0 to 6.
	console.log("From backend listHours");
	console.log(week, day, date, dateFormat);
        db.query(`
            SELECT hour, room FROM labs WHERE week = "${week}"
	    AND day = "${day}" ORDER BY room, hour;
        `).then((data) => {
	    console.log(data);
            resolve(JSON.stringify(data));
        }).catch(reject);
    });
};

// Java creates  dates with months from 0 to 11.
function getWeek(date) {
    if(date >= new Date(2018, 2, 5) && date <= new Date(2018, 2, 9))
        return 6;
    else if(date >= new Date(2018, 2, 12) && date <= new Date(2018, 2, 16))
        return 7;
    else if(date >= new Date(2018, 2, 19) && date <= new Date(2018, 2, 23))
        return 8;
    else if(date >= new Date(2018, 3, 16) && date <= new Date(2018, 3, 20))
        return 9;
    else if(date >= new Date(2018, 3, 23) && date <= new Date(2018, 3, 27))
        return 10;
    else if(date >= new Date(2018, 3, 30) && date <= new Date(2018, 4, 4))
        return 11;
    else if(date >= new Date(2018, 4, 7) && date <= new Date(2018, 4, 11))
        return 12;
    else return 0;
}
	
