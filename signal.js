/**
 * ashita/core/signal
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const validator       = require('validator');
const assert          = require('assert');
const crypto          = require('crypto');
const API             = require('./api.js');
const color           = require('./color.js');



module.exports = {
  "auth":function ( connectedNodes, socket, data ) {
    this.connectedNodes   = connectedNodes;
    this.socket           = socket;
    this.node             = socket.node;
    this.data             = data;

    /* ----- <OUTPUT> ----- */
    console.debug(color.Blue + "auth SIGNAL received from client");
    /* ----- </OUTPUT> ----- */

    // get user's session id
    // see if user's session exists
    // if not, create user object
    // if does, set user object
    // send comms to client "newAuthedSocket" || "newAnonymousSocket"
    let user    = new API.User( data );
    let client  = new API.Client( socket );

    if ( user.isAuthenticated ) {
      // node operator connected    
      client.sendClientEvent("nodeOperatorConnected");
    } else {
      if ( Object.keys(this.connectedNodes).length > 0 ) {
        for ( let nodeSocket in this.connectedNodes ) {
          let peer = new API.Client( this.connectedNodes[nodeSocket] );
          peer.sendClientEvent("nodeDiscovered", this.node);
          peer = null;
        }
      }

      if ( !connectedNodes.hasOwnProperty(this.node) ) {
        this.connectedNodes[this.node] = this.socket;
        client.sendClientEvent("nodeConnected", null);
      }      

      console.info(color.Green + "Connected peers");
      console.info(color.Green + "---------------");
      for ( let peer in this.connectedNodes ) {
        console.info(color.Green + peer);
      }
    }
  }
};
