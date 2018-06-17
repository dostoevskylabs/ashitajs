"use strict";
const os                = require("os");
const node              = require("./node.js");
const nodeManager       = require("./nodeManager.js");
const gui               = require("./gui.js");
const logger            = require("./logger.js");

logger.setVerbosity(logger.WARN, logger.INFO, logger.NOTICE, logger.ERROR, logger.DEBUG);

/** quick hack to get the internal IP address of the host */
let interfaces          = os.networkInterfaces();
let nodeHost            = "127.0.0.1" // interfaces[Object.keys(interfaces)[0]][0].address;

nodeManager.setNodeHost( nodeHost );
nodeManager.setNodePort( 8000 );
nodeManager.setGuiPort( 60000 );

new node();
new gui();