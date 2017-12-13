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
      cli.Logger.notice(`Node Listening on http://${nodeManager.getNodeHost}:${nodeManager.getNodePort}`);
    });

    this.on("error", (error) => {
      if ( error.code === "EADDRINUSE" ) {
        port++;
        return new AshitaNode();
      }
    });

    this.on("connection", this.onConnection.bind(this));

    this.socket = undefined;
  }

  onConnection ( socket ) {
    this.socket = socket;
    this.socket.on("data", this.onData.bind(this));
    this.socket.on("error", this.onError.bind(this));   
  }

  onData ( data ) {
    data = this.safeParseJSON(data);

    if ( !data.hasOwnProperty("type") ||
         !data.hasOwnProperty("content") ) {
      // missing basic structure
      return false;
    }

    switch ( data.type ) {
      case "newNode":
        var host   = data.content.nodeHost;
        var peerId = nodeManager.generatePeerId( host );
        if ( nodeManager.getNode( peerId ) ) {
          return false;
        }

        new client(host.split(":")[0], host.split(":")[1]);
        break;
      
      default:
        // pass
    }   
  }

  onError ( error ) {
    // pass
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
}

module.exports = AshitaNode;