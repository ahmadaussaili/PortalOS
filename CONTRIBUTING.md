# PortalOS
## Notes
### HTTP
All client side files are within the public directory. The server is a little
more complex than an Apache setup and so files will not automatically be served
to the user unless a section is added within the fileserver.js module. Any file
within the css, js and assets folder will however be served regardless of the 
server.

**Requets for files that don't exist or without a handler in the server are
automatically redirect to the homepage, index.html**

### HTML
As little HTML in index.html as possible is ideal for keeping the app dynamic.
JS and JQuery can be used instead to add and remove HTML at runtime.
```javascript
// This removes all current content
$("#content").html("");

// This adds a new div with class 'desktop' to the element of id content
$("#content").html($("<div>").addClass("desktop"));

// This then allows for more powesrful stuff like this:
let desktop = $("<div>");
desktop.addClass("desktop");
for (let i = 0; i < 10;; i++) {
    desktop.append($("<div>").addClass("button"));
}
$("#content").html(desktop);
```

### JS

All JS tries to follow the conventions set out in ES6, one of the newest versions
of javascript. This basically means let and const are used instead of var as they
are considered better replacements.

JSDocs are also used for all (most) functions.

A few style things:
```javascript
// This:
let a = "aString";
// Not:
let a = 'aString';

// This:
if (cond) {
}
// Not:
if (cond)
{
}

// This:
function square(x) {
    return x * x;
}
// is equivilent to (in ES6):
const square = (x) => {
    return x * x;
};
```

The main server module is server.js which *currently* uses wsServer.js and 
fileserver.js which both inturn use other modules which themselves can use other
modules... Modules are imported, like in java, with
```javascript
const auth = require("./auth.js");
```

### API and WebSockets
The basic premise of the API is that the user sets listeners for data from the server
and whenever the server replies a funciton is called appropriate to that type of data.
The client can also send data to the server at any time.
All interactions have a type and then a body. These help both the server and client
seperate interactions effctively. Current types are:
* userExists
* login
* register
* error
* etc.

each having expectations of how the body of the message should look, if this is
incorrect the other party should be informed with an error type message.

Examples of the api use can be found in the login.js file in the public/js dir
and in auth.js for the server side.

API handeling methods are found at public/js/ws.js and wsServer.js

## Set Up
### Server/MySQL
There is currently a server running here: http://portalos.gq

Any changes pushed to the master branch of this repo should be automatically
pulled by the server, the server should restart and the changes will be live at
the URL.

The server is also where the MySQL server is running as we cannot access the 
school server from external machines. A dbConfig.json file is needed to connect
to the MySql server of the form: 
```javascript
{
    "host": "52.215.73.125",
    "user": "z6",
    "password": "Message Jacob for the password",
    "database": "portalos"
}
```
### Node
To get node running locally you can download it from https://nodejs.org/en/
Running the server is as simple then as running the .bat file (Windows) and viewing the
result at http://localhost:8000 As changes are made to the server it will restart
itself automatically unless an error has occured in which case the terminal window
*should* indicate the error.
Note: for Linux just type $ nodemon server.js in the terminal.

If the bat file crashes out immediately then you may be missing Ext. node
modules.

If no "DB Connected" Message is logged then the dbConfig.json file may be missing
or incorrectly configured.

You can restart the app by typing *rs <return>* in the command prompt window.

### Ext. Node Modules
To get the server running on your own machine additional modules must first be
downloaded and installed. Node gives a quick and easy way of doing this:
```sh
$ npm install -g nodemon mysql ws
```
From the root of the PortalOS directory

