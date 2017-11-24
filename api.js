/**
 * ashita/core/api
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const color = require('./color.js');

class User {
  constructor ( data ) {
  	this.data = data;
    /* ----- <OUTPUT> ----- */
    console.debug(color.Blue + "User object initialized.");
    /* ----- </OUTPUT> ----- */
  }

  get isAuthenticated () {
    /* ----- <OUTPUT> ----- */
    console.debug(color.Blue + "Socket has been set as Anonymous.");
    /* ----- </OUTPUT> ----- */
  	return false;
  } 	
}
class Client {
  constructor ( socket ) {
  	this.socket = socket;
    /* ----- <OUTPUT> ----- */
    console.debug(color.Blue + "Client object initialized.");
    /* ----- </OUTPUT> ----- */
  }

  sendClientEvent ( event, data ) {
    let payload = {
      "type":event,
      "content":{}
    };
    switch ( payload.type ) {
      case "nodeConnected":
        payload.content.test = true;
      break;

      case "nodeList":
        payload.content.nodeList = data;
      break;

      case "nodeDiscovered":
        payload.content.nodeIp = data;
      break;

      default:
        console.log('woops');
    }
  	this.socket.send( JSON.stringify( payload ) );
    
    /* ----- <OUTPUT> ----- */
    console.debug(color.Blue + event + " event sent to client socket.");
    /* ----- </OUTPUT> ----- */
  }
}
module.exports = {
  "User" 		: User,
  "Client" 	: Client
}