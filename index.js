"use strict";
const nodeManager       = require("./nodeManager.js");
const os                = require("os");
const cli               = require("./cli.js");
const node              = require("./node.js");
const client            = require("./client.js");
const gui               = require("./gui.js");



/** quick hack to get the internal IP address of the host */
let interfaces          = os.networkInterfaces();
let nodeHost            = undefined;
for ( let iface in interfaces ) {
  for ( let property in interfaces[iface] ) {
    let address = interfaces[iface][property];
    if ( address.family === "IPv4" && !address.internal ) {
      nodeHost = address.address;
    }
  }
}
nodeManager.setNodeHost( nodeHost );
nodeManager.setNodePort( 8000 );
new gui();
new node();

cli.screens["nodeHost"].on("submit", function ( node ) {
  let host = `${node.split(":")[0]}`; 
  let port = `${node.split(":")[1]}`;
  if ( nodeManager.getNode(`${host}:${port}`) ) {
    cli.screens["nodeHost"].setValue("");
    cli.screens["AddNode"].setBack();
    return false;
  }
  
  new client(host, port);

  cli.screens["nodeHost"].setValue("");
  cli.screens["AddNode"].setBack();  
});
