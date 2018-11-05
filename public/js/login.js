/**
 * Module for managing user login and registation
 */
$(document).ready(() => {
    // Check if the user is logged in already
    let sid = cookies.get("sid") || "none";
    if (!sid) notLoggedIn();
    askWS("sid", {"sid": sid}, (res) => {
        if (res.error) return notLoggedIn();
        cookies.create("sid", res.sid, 30);
        loggedIn();
    });

    let cookieCookie = cookies.get("cookies");
    if (!cookieCookie) {
        cookies.create("cookies", "yes", 999);
        errorUI.newInfo("We use cookies");
    }

    // CSS management
    $(window).on("scroll", () => {
        if ($(window).scrollTop()) {
            $("#home").css({
                "height": window.innerHeight - $(window).scrollTop()
            });
        } else {
            $("#home").css({"height": "100%"});
        }
    });

    /**
     * Update login ui to reflect current state
     * @param {*} loginState 
     */
    function updateUI(loginState) {
        let email = $("#home-login-email").val();
        if (loginState.hasEmail) {
            $("#home-login-email").hide();
            $("#home-login-pass").show().focus();
            $("#home-login-ok").text("Login");
            $("#home-login-txt").text("Login - " + email);
            if (loginState.isRegister) {
                $("#home-login-cpass").show();
                $("#home-login-ok").text("Register - " + email);
                $("#home-login-txt").text("Registration");
            }
        } else {
            $("#home-login-email").show().focus();
            $("#home-login-pass").hide();
            $("#home-login-cpass").hide();
            $("#home-login-ok").text("Next");
        }
    }

    /**
     * Check the email, throw if an issue, update login state otherwise
     * @param {*} email
     * @param {*} loginState
     */
    function validateEmail(email, loginState) {
        // https://stackoverflow.com/questions/46155/
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (email) {
            if (re.test(email)) {
                // Message server for next action
                askWS("userExists", {"email": email}, (res) => {
                    loginState.hasEmail = true;
                    if (res.isRegistered) {
                        loginState.isLogin = true;
                    } else {
                        loginState.isRegister = true;
                    }
                    updateUI(loginState);
                });
                return;
            }
            throw new Error("You must provide a valid email");
        }
        throw new Error("You must provide an email");
    }
    /**
     * Validate and send request for user registration
     * @param {*} email 
     * @param {*} password 
     * @param {*} cPassword 
     * @param {*} loginState 
     */
    function register(email, password, cPassword, loginState) {
        let req = {
            "email": email,
            "password": password
        };
        console.log(cPassword, password, cPassword === password)
        if (cPassword !== password) {
            throw new Error("Passwords must match");
        }
        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters long");
        }
        askWS("register", req, (res) => {
            if (res.registered) {
                login(email, password, loginState);
            } else {
                console.error(res);
            }
        });
    }

    /**
     * Validate and send request for user login
     * @param {*} email 
     * @param {*} password 
     * @param {*} loginState 
     */
    function login(email, password, loginState) {
        if (password.length < 8) throw new Error("Invalid Password");
        let req = {
            "email": email,
            "password": password
        };
        askWS("login", req, (res) => {
            if (res.sid) {
                cookies.create("sid", res.sid, 30);
                $("#content").html("");
                loggedIn();
            } else {
                throw new Error("Login failed. Try again later.");
            }
        });
    }

    /**
     * Adds support for pressing enter to advance the form
     * @param {*} e Jquery Event
     */
    function enterSupport(e) {
        if (e.which == 13) {
            $("#home-login-ok").click();
        }
    }

    /**
     * Display login screen
     */
    function notLoggedIn() {
        $("#content").html(htmlTemplates.login);
        let loginState = data.loginState;
        $("#home-login-email").keypress(enterSupport);
        $("#home-login-pass").keypress(enterSupport);
        $("#home-login-cpass").keypress(enterSupport);
        $("#home-login-ok").click((event) => {
            let email = $("#home-login-email").val();
            let password = $("#home-login-pass").val();
            console.log("B")
            if (!(loginState.isLogin || loginState.isRegister)) {
                try {
                    validateEmail(email, loginState);
                } catch (exception) {
                    errorUI.newError(exception.message);
                    return;
                }
            } else if (loginState.isLogin) {
                try {
                    login(email, password, loginState);
                } catch (exception) {
                    errorUI.newError(exception.message);
                    return;
                }
            } else if (loginState.isRegister) {
                let cPassword = $("#home-login-cpass").val();
                try {
                    register(email, password, cPassword, loginState);
                } catch (exception) {
                    errorUI.newError(exception.message);
                    return;
                }
            }
        });
        updateUI(loginState);
    }
});
