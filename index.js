"use strict";
const os                = require("os");
const node              = require("./node.js");
const nodeManager       = require("./nodeManager.js");
const gui               = require("./gui.js");
const logger            = require("./logger.js");
const adapter           = process.argv[2];
logger.setVerbosity(logger.WARN, logger.INFO, logger.NOTICE, logger.ERROR, logger.DEBUG);

let interfaces          = os.networkInterfaces();
let nodeHost            = interfaces[adapter][0].family === 'IPv4' ? interfaces[adapter][0].address : interfaces[adapter][1].address;
console.log(nodeHost);

nodeManager.setNodeHost( nodeHost );
nodeManager.setNodePort( 8000 );
nodeManager.setGuiPort( 60000 );

new node();
new gui();

logger.notice(`Using adapter: ${adapter}`);