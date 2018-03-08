"use strict";
let port                = 60000;
const cli               = require("./cli.js");
const path              = require("path");
const fs                = require("fs");
const ws                = require("ws").Server;
const nodeManager       = require("./nodeManager.js");
const http              = require("http");
const express           = require("express");
const app               = express();
app.use( express.static( path.join(__dirname, "/public") ) );

class GUI extends ws {
  constructor () {
    const guiServer = http.createServer( app ).listen( port, () => {
      cli.Logger.notice(`GUI is Listening on http://${nodeManager.getNodeHost}:${port}`);
    });
    super({ server : guiServer });

    this.on("error", (error) => {
      if ( error.code === "EADDRINUSE" ) {
        port++;
        return new GUI();
      }
    });

    nodeManager.setGui(this);

    this.instanced    = false;
    this.socket       = undefined;
    this.nodeId       = undefined;
    this.clientIP     = undefined;
    this.knownPeers   = undefined;
    this.MOTD         = undefined;
    this.subscribedTo = [];

    this.on("connection", this.onConnection);
  }

  onConnection ( socket ) {
    if ( this.instanced ) {
      /* handle error, trying to open multiple instances of the GUI */
      return false;
    }

    this.instanced  = true;
    this.socket     = socket;
    this.knownPeers = nodeManager.getNodes();
    this.clientIP   = this.socket._socket.remoteAddress.substr(7);

    this.socket.on("message", this.onMessage.bind(this));
    this.socket.on("error", this.onError.bind(this));
    this.socket.on("close", this.onClose.bind(this));
    
    this.peerDiscovered( nodeManager.getNodeId );

    for ( let peer of this.knownPeers ) {
      this.peerDiscovered( peer );
    }
    
    fs.readFile("./etc/issue", "utf8", ( error, data ) => {
      if ( !error ) {
        this.MOTD = data.toString();
      }
      this.sendClientEvent("MOTD", {
        "peerId"  : nodeManager.getNodeId,
        "MOTD"    : this.MOTD
      });
    });

    cli.Logger.debug("New GUI Session with", this.clientIP);
  }

  onMessage ( data ) {
    if ( this.instanced === false ) {
      return false;
    }

    data = this.safeParseJSON(data);

    if ( !data.hasOwnProperty("type") ||
         !data.hasOwnProperty("content") ) {
      // missing basic structure
    }

    switch ( data.type ) {
      case "getAvailablePeers":
        this.sendClientEvent("availablePeers", {
          "peers" : this.knownPeers
        });
        break;

      case "getSubscribed":
        this.sendClientEvent("subscriptions", {
          "subscriptions" : this.subscribedTo
        });
        break;

      case "publicMessage":
        this.sendClientEvent("publicMessageSuccessful", {
          "peerId"  : data.content.peerId
        });

        nodeManager.sendNodeEvent("publicMessage", {
          "peerId"  : data.content.peerId,
          "username": data.content.username,
          "message" : data.content.message
        })
        break;

      case "subscribe":
        if ( !nodeManager.getNode( data.content.peerId ) && data.content.peerId !== nodeManager.getNodeId ) {
          this.sendClientEvent("subscribeFailed", {
            peerId  : data.content.peerId
          });

          return false;
        }

        this.subscribedTo.push(data.content.peerId);

        if ( nodeManager.getNodeTest(data.content.peerId) === undefined ) {
          this.sendClientEvent("subscribeSuccessful", {
            peerId    :  data.content.peerId,
            MOTD      : this.MOTD
          });
        } else {
          this.sendClientEvent("subscribeSuccessful", {
            peerId    :  data.content.peerId,
            MOTD      : nodeManager.getNodeTest( data.content.peerId ).MOTD
          });          
        }

        cli.Logger.debug("GUI subscribed to ", data.content.peerId);
        break;

      default:
        this.sendClientEvent("invalidEvent", {
          "event"   : data.type
        });
    }
  }

  onError ( error ) {
    // pass
  }

  onClose () {
    this.socket.close();
    this.socket    = undefined;
    this.instanced = false;
    //this.close();
    // pass
  }

  send ( data ) {
    if ( this.instanced === false ) {
      return false;
    }

    data = JSON.stringify(data);
    this.socket.send(data);
  }

  sendClientEvent ( event, object ) {
    if ( this.instanced === false ) {
      return false;
    }

    this.send({
      "type"    : event,
      "content" : object
    });

    cli.Logger.debug("Sending Client Event: ", event);
  }

  peerDiscovered ( peerId ) {
    if ( this.instanced === false ) {
      return false;
    }

    this.sendClientEvent("peerDiscovered", {
      "peerId"    : peerId
    });
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

module.exports = GUI;