/**
 * Module for the management of client side cookies
 * From https://stackoverflow.com/questions/14573223/
 * Updated to ES6
 */

let cookies = {};

/**
 * Creates a new cookie
 * @param {*} name Cookies name
 * @param {*} value Its value
 * @param {*} days Days till expiray
 */
cookies.create = (name, value, days) => {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};

/**
 * Get the value of a cookie
 * @param {*} name The name of the cookie to get
 * @return {string} Cookie value
 */
cookies.get = (name) => {
    let nameEQ = name + "=";
    let ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

/**
 * Delete a cookie
 * @param {*} name The name of the cookie to delete
 */
cookies.delete = (name) => {
    cookies.create(name, "", -1);
};
