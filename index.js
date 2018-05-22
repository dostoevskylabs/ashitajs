"use strict";
const os                = require("os");
const node              = require("./node.js");
const nodeManager       = require("./nodeManager.js");
const gui               = require("./gui.js");
const logger            = require("./logger.js");
const client            = require("./client.js");
const readline          = require('readline');
const rl                = readline.createInterface({ input: process.stdin, output: process.stdout });

logger.setVerbosity(logger.WARN, logger.INFO, logger.NOTICE, logger.ERROR, logger.DEBUG);

/** quick hack to get the internal IP address of the host */
let interfaces          = os.networkInterfaces();
let nodeHost            = interfaces[Object.keys(interfaces)[0]][0].address;

nodeManager.setNodeHost( nodeHost );
nodeManager.setNodePort( 8001 );
nodeManager.setGuiPort( 60001 );

new node();
new gui();

logger.notice("Enter a peer to connect to (Eg: 192.168.1.148:8001)");
rl.on('line', (line) => {
  // hack for connecting until implementing full cli
  let host = line.split(":")[0];
  let port = line.split(":")[1];
  if ( !nodeManager.getNode(`${host}:${port}`) ) {
    new client( host, port );
  }
});