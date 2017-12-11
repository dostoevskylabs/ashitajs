"use strict";
let   port            = 8000;
const net             = require("net");
const cli             = require("./cli.js");
const client          = require("./client.js");
const nodeManager     = require("./nodeManager.js");

class AshitaNode extends net.Server {
  constructor () {
    super();
    nodeManager.setNodePort( port );
    this.listen(nodeManager.getNodePort, nodeManager.getNodeHost, () => {
      cli.screens["Log"].add(`Node Listening on http://${nodeManager.getNodeHost}:${nodeManager.getNodePort}`);
    });
    this.on("error", (error) => {
      // temporary
      if ( error.code === "EADDRINUSE" ) {
        port++;
        return new AshitaNode();
      }
    });

    this.socket = undefined;
    this.on("connection", this.onConnection.bind(this));
  }

  onConnection ( socket ) {
    this.socket = socket;
    this.socket.on("data", this.onData.bind(this));
    this.socket.on("error", this.onError.bind(this));   
  }

  safeParseJSON ( data ) {
    try {
      let obj = JSON.parse( data );
      if ( obj && typeof obj === "object" ) {
        return obj;
      }
    } catch ( error ) {}
    return {};
  }

  onData ( data ) {
    data = this.safeParseJSON(data);
    if ( data.hasOwnProperty("newNode") ) {
      let host = data.newNode;
      if ( nodeManager.getNode( nodeManager.generatePeerId( host ) ) ) {
        return false;
      }

      new client(host.split(":")[0], host.split(":")[1]);

    } else {
      cli.screens["Log"].add(data);
    }     
  }

  onError ( error ) {
    cli.screens["Debug"].add( error );
  }
}

module.exports = AshitaNode;