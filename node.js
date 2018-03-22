"use strict";
const net             = require("net");
const logger          = require("./logger.js");
const client          = require("./client.js");
const nodeManager     = require("./nodeManager.js");
const fs              = require("fs");

class AshitaNode extends net.Server {
  constructor () {
    super();
    this.listen({
      port:nodeManager.getNodePort,
      host:nodeManager.getNodeHost,
      exclusive:true
    }, () => {
      logger.notice(`Node Listening on http://${nodeManager.getNodeHost}:${nodeManager.getNodePort}`);
    });

    this.on("error", (error) => {
      if ( error.code === "EADDRINUSE" ) {
        this.close();
        nodeManager.setNodePort(nodeManager.getNodePort++);
        nodeManager.setNodePort( nodeManager.getNodePort );
        return new AshitaNode();
      }
    });

    this.on("connection", this.onConnection.bind(this));

    this.socket = undefined;
    this.MOTD   = undefined;
  }

  onConnection ( socket ) {
    this.socket = socket;
    this.socket.on("data", this.onData.bind(this));
    this.socket.on("error", this.onError.bind(this)); 
    fs.readFile("./etc/issue", "utf8", ( error, data ) => {
      if ( !error ) {
        this.MOTD = data.toString()
      }

      this.socket.write(JSON.stringify({
        "type":"connectionSuccessful",
        "content":{
          "MOTD": this.MOTD
        }
      }));
    });    
  }

  onData ( data ) {
    data = this.safeParseJSON(data);

    if ( !data.hasOwnProperty("type") ||
         !data.hasOwnProperty("content") ) {
      // missing basic structure
      return false;
    }

    switch ( data.type ) {
      case "publicMessage":
        logger.debug(data);
        nodeManager.sendGuiMessage({peerId: data.content.peerId, username: data.content.username, message: data.content.message });
        break;
        
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