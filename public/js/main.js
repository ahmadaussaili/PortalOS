/**
 * Module for the creation of the global data object
 *
 * TODO: Do we need a global data object?
 * TODO: Do we need globals? Node module for 'building' the client side js into
 *          a bundle? Node style requires?
 */
const data = {
    login: false,
    loginState: {
        isRegister: false,
        isLogin: false,
        hasEmail: false,
        hasPassword: false,
        hasCPassword: false
    },
    fs: {}
};

const imgPreCache = {};

const htmlTemplates = {
    "login": `
    <div id="home-spacer"></div>
    <div id="home">
        <div id="home-logo"></div>
        <div id="home-spacer"></div>
        <div id="home-login">
            <h3 id="home-login-txt">Login/Register</h3>
            <input id="home-login-email" type="email" placeholder="Email">
            <input id="home-login-pass" type="password" placeholder="Password">
            <input id="home-login-cpass" type="password"
                placeholder="Confirm Password">
            <button id="home-login-ok">Next</button>
        </div>
    </div>
    <div id="about">
        <div class="about-card">
            <img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_settings_system_daydream_black_24px.svg">
            <h2>Desktop in the Cloud.</h2>
            <p>
                Apps are provided in an intuitive format that you're already
                used too, but in the cloud, so you can access them from anywhere.
            </p>
        </div>
        <div class="about-card">
            <img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_perm_media_black_24px.svg">
            <h2>File Management.</h2>
            <p>
                Powerful file management thats simple to use and fast to react.
            </p>
        </div>
        <div class="about-card">
            <img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_verified_user_black_24px.svg">
            <h2>Secure.</h2>
            <p>
                All data transfers and files are encrypted to ensure they remain
                protected and secure.
            </p>
        </div>
        <div class="about-card">
            <img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_all_inclusive_black_24px.svg">
            <h2>Unlimited.</h2>
            <p>
                No hard caps on the amount of data you can store. (Fair use
                applies)
            </p>
        </div>
        <div class="about-card">
            <img src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_whatshot_black_24px.svg">
            <h2>Fast.</h2>
            <p>
                Blazing fast file transfers and app response.
            </p>
        </div>
    </div>
    <div id="footer">
        <p>&copy; 2018 Z6</p>
    </div>
    `,

    "desktop": `
    <div id="desktop">
        <div id="dock">
            <div id="launch-fm" class="app-launcher noselect">
                <img title="File Manager" src="/assets/images/folder.svg">
            </div>
            <div id="calendar" class="app-launcher noselect">
                <img title="Calendar" src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_date_range_white_24px.svg">
            </div>
            <div id="labChecker" class="app-launcher noselect">
                <img title="Lab Checker" src="/assets/images/labchecker.svg">
            </div>
            <div id="musicPlayer" class="app-launcher noselect">
                <img title="Music Player" src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_music_note_white_24px.svg">
            </div>
            <div id="calculator" class="app-launcher noselect">
                <img title="Calculator" src="/assets/images/calc.svg">
            </div>
            <div id="settings" class="app-launcher noselect">
                <img title="Settings" src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_settings_white_24px.svg">
            </div>
        </div>
        <div id="apps">
        </div>
        <div id="openSideBar" class="app-launcher noselect">
            <img title="openSideBar" src="https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_keyboard_arrow_left_black_24px.svg">
        </div>
    </div>
    `,
    "spinner": `
<svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
   <circle class="path" fill="none" stroke-width="6"
    stroke-linecap="round" cx="33" cy="33" r="30"></circle>
</svg>`
};
