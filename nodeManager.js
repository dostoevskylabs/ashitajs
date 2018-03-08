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
  
    this.sendNodeEvent("newNode", {
      "nodeId"    : clientInstance.nodeId,
      "nodeHost"  : host
    });

    if ( gui.instanced ) {
      gui.knownPeers.push( clientInstance.nodeId );
      gui.peerDiscovered( clientInstance.nodeId );
    }
  }

  static sendGuiMessage ( data ) {
    if ( gui.instanced ) {
      gui.sendMessage( data );
    }
  }

  static removeNode ( nodeId ) {
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
      if ( peer !== this.getNodeId && peer !== object.nodeId ) {
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

  static getNodeTest ( peerId ) {
    return nodes.get( peerId );
  }

  static getNode ( host ) {
    if ( nodes.has( host ) ) {
      return true;
    }
    return false;
  }
}

module.exports = nodeManager;