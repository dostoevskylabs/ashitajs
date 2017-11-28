/**
 * ashita/core/nodeAPI
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const color = require('./color.js');

class User {
  constructor ( nodeOwner, node, data ) {
    this.nodeOwner = nodeOwner;
    this.node = node;
  	this.data = data;

    console.debug(color.Blue + "User object initialized.");
  }

  get isOwner () {
  	if ( this.node === this.nodeOwner ) {
      return true;
    }
    return false;
  } 	
}

class Client {
  constructor ( socket ) {
  	this.socket = socket;

    console.debug(color.Blue + "Client object initialized.");
  }

  sendClientEvent ( event, data ) {
    let payload = {
      "type":undefined,
      "content":{}
    };
    switch ( event ) {
      case "nodeOwnerConnected":
        payload.type = "nodeOwnerConnected";
      break;

      case "nodeConnected":
        payload.type = "nodeConnected";
      break;

      case "nodeDiscovered":
        payload.type = "nodeDiscovered";
        payload.content.node = data;
      break;

      default:
        payload.type = undefined;
    }

    if ( payload.type !== undefined ) {
      this.socket.send( JSON.stringify( payload ) );
      
      console.debug(color.Blue + event + " event sent to client socket.");
    } else {
      console.debug("invalid nodeAPI call from clientAPI");
    }
  }
}

module.exports = {
  "User" 		: User,
  "Client" 	: Client
}