"use strict";
const args = process.argv.slice( 2 );

if ( args.length !== 1 ) {
  args[0] = 8000;
}

const nodeManager       = require('./nodeManager.js');
const os                = require('os');
const path              = require('path');
const net               = require('net');
const cli               = require('./cli.js');
const node              = require('./node.js');
const client            = require('./client.js');
const gui               = require('./gui.js');


let interfaces          = os.networkInterfaces();
let nodeHost = undefined;
for ( let k in interfaces ) {
  for ( let k2 in interfaces[k] ) {
    let address = interfaces[k][k2];
    if ( address.family === 'IPv4' && !address.internal ) {
      nodeHost = address.address;
    }
  }
}

new node.AshitaNode(nodeHost, args[0]);

cli.screens["nodeHost"].on("submit", function( node ) {
  console.log(node);
  let host = `${node.split(":")[0]}`; 
  let port = `${node.split(":")[1]}`;
  if ( nodeManager.getNode(`${host}:${port}`) ) {
    cli.screens["nodeHost"].setValue('');
    cli.screens["AddNode"].setBack();
    return false;
  }
  
  new client.AshitaClient(args[0], host, port);

  cli.screens["nodeHost"].setValue('');
  cli.screens["AddNode"].setBack();  
});



new gui();