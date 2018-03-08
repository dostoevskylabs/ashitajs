"use strict";
const os                = require("os");
const node              = require("./node.js");
const nodeManager       = require("./nodeManager.js");
const gui               = require("./gui.js");
const cli               = require("./cli.js");
const client            = require("./client.js");
const readline          = require('readline');
const rl                = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


/** quick hack to get the internal IP address of the host */
let interfaces          = os.networkInterfaces();
let nodeHost            = interfaces[Object.keys(interfaces)[1]][0].address;

nodeManager.setNodeHost( nodeHost );
nodeManager.setNodePort( 8000 );

new gui();
new node();

cli.Logger.notice("Enter a peer to connect to (Eg: 192.168.1.148:8001)");
rl.on('line', (line) => {
  let host = line.split(":")[0];
  let port = line.split(":")[1];
  if ( !nodeManager.getNode(`${host}:${port}`) ) {
    try {
      new client( host, port );
    } catch ( e ) {
      cli.Logger.debug(`Failed to connect to ${host}:${port}`);
    }
  }
});