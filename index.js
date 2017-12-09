"use strict";
const args = process.argv.slice( 2 );

if ( args.length < 1 ) {
  args[0] = 8000;
}

if ( args.length !== 2 ) {
  args[1] = 60000;
}

const nodeManager       = require("./nodeManager.js");
const os                = require("os");
const cli               = require("./cli.js");
const node              = require("./node.js");
const client            = require("./client.js");
const gui               = require("./gui.js");

nodeManager.init(new gui(args));

/** quick hack to get the internal IP address of the host */
let interfaces          = os.networkInterfaces();
let nodeHost = undefined;
for ( let iface in interfaces ) {
  for ( let property in interfaces[iface] ) {
    let address = interfaces[iface][property];
    if ( address.family === "IPv4" && !address.internal ) {
      nodeHost = address.address;
    }
  }
}

new node.AshitaNode(nodeHost, args[0]);

cli.screens["nodeHost"].on("submit", function ( node ) {
  let host = `${node.split(":")[0]}`; 
  let port = `${node.split(":")[1]}`;
  if ( nodeManager.getNode(`${host}:${port}`) ) {
    cli.screens["nodeHost"].setValue("");
    cli.screens["AddNode"].setBack();
    return false;
  }
  
  new client.AshitaClient(args[0], host, port);

  cli.screens["nodeHost"].setValue("");
  cli.screens["AddNode"].setBack();  
});
