"use strict";
const cli     = require("./cli.js");
const crypto  = require("crypto");
const nodes   = new Map();
let gui       = undefined;
let nodeHost  = undefined;
let nodePort  = undefined;
class nodeManager {
  /* TODO: Handle removing peer from nodes, and send an update to gui to let it know the peer is no longer available */
  static setGui ( guiInstance ) {
    gui = guiInstance;
  }
  
  static setNodeHost ( host ) {
    nodeHost = host;
  }

  static get getNodeHost () {
    return nodeHost;
  }

  static setNodePort ( port ) {
    nodePort = port;
  }

  static get getNodePort () {
    return nodePort;
  }

  static get getNodeId () {
    if ( nodeHost !== undefined && nodePort !== undefined ) {
      return this.generatePeerId( nodeHost + ":" + nodePort );
    }
  }

  static addNode ( clientInstance ) {
    if ( this.getNode ( clientInstance.nodeId ) ||
        clientInstance.nodeId === this.getNodeId ) {
      return false;
    }
    
    let host = `${clientInstance.nodeIp}:${clientInstance.nodePort}`;
    nodes.set( clientInstance.nodeId, clientInstance );

    cli.screens["Peers"].addItem( host );

    this.drawNodes();

    this.sendNodeEvent("newNode", { "nodeHost"  : host });

    if ( gui.instanced ) {
      gui.knownPeers.push( clientInstance.nodeId );
      gui.peerDiscovered( clientInstance.nodeId );
    }
  }

  static removeNode ( nodeId ) {
    // remove cli.screens["Peers"]
    // delete nodeId from nodes
    if ( gui.instanced ) {
      //gui.knownPeers = this.getNodes();
      //gui.peerDisconnected( nodeId );
    }
  }

  static sendNodeEvent ( event, object ) {
    let message = {
      "type"      : event,
      "content"   : object
    };

    nodes.forEach( ( peerSocket, peer ) => {
      if ( peer !== this.getNodeId ) {
        message = JSON.stringify( message );
        peerSocket.write( message );
      }
    });
  }

  static generatePeerId ( peerId ) {
    return crypto.createHmac("sha1", peerId).digest("hex");
  }

  static getNodes () {
    return Array.from(nodes.keys());
  }

  static drawNodes () {
    let keys = [];
    this.getNodes().map( (key) => {
      keys.push(nodes.get(key).nodeIp + ":" + nodes.get(key).nodePort );
    });

    for ( let i = 0; i < keys.length; i++ ) {
      if ( i === 0 ) {
        cli.ScreenManager.generateNode(keys[i], cli.screens["NodeList"], 0, 0, 0, 0, 25, 8);
      } else if ( cli.screens[keys[i-1]].left + cli.screens[keys[i-1]].width >= cli.screens["NodeList"].width - cli.screens[keys[i-1]].width ) {
        cli.ScreenManager.generateNode(keys[i], cli.screens["NodeList"], cli.screens[keys[i-1]].top + cli.screens[keys[0]].height, 0, 0, 0, 25, 8);    
      } else {
        cli.ScreenManager.generateNode(keys[i], cli.screens["NodeList"], cli.screens[keys[i-1]].top - 1, cli.screens[keys[i-1]].left + cli.screens[keys[0]].width, 0, 0, 25, 8);          
      }
    }
  }

  static getNode ( host ) {
    if ( nodes.has( host ) ) {
      return true;
    }
    return false;
  }
}

module.exports = nodeManager;