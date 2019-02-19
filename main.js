"use strict";
const os                = require("os");
const nodeManager       = require("./middleware/peerManager");
const adapter           = process.argv[2];
let interfaces          = os.networkInterfaces();
let nodeHost            = undefined;

try {
  nodeHost = interfaces[adapter][0].family === 'IPv4' ? interfaces[adapter][0].address : interfaces[adapter][1].address;
} catch ( e ) {
  console.log('select an adapter.');
  require('process').exit(0);  
}

require('./init.js').setup(adapter, nodeHost, 8000);

