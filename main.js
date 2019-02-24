"use strict";
const os                = require("os");
const peerManager       = require("./middleware/peerManager");
const adapter           = process.argv[2];
let interfaces          = os.networkInterfaces();
let peerIp              = undefined;

try {
  peerIp = interfaces[adapter][0].family === 'IPv4' ? interfaces[adapter][0].address : interfaces[adapter][1].address;
} catch ( e ) {
  console.log('select an adapter.');
  require('process').exit(0);  
}

require('./init.js').setup(adapter, peerIp, 8000);

