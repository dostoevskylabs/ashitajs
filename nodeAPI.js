/**
 * ashita/core/nodeAPI
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const color = require('./color.js');

class User {
  constructor ( ownerId, nodeId, data ) {
    this.ownerId = ownerId;
    this.nodeId = nodeId;
  	this.data = data;

    console.debug(color.Blue + "User object initialized.");
  }

  get isOwner () {
  	if ( this.nodeId === this.ownerId ) {
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
      "type"    : undefined,
      "content" : {}
    };
    
    payload.type    = event;
    payload.content = data;
    
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