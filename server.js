/**
 * Main server module called by node to run the whole server
 */

const wsServer = require("./wsServer.js");
const fileServer = require("./fileserver.js");

// Serve the static files.
const server = fileServer();

// Provide a ws server.
wsServer(server);


