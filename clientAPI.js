/**
 * ashita/core/clientAPI
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const validator       = require('validator');
const assert          = require('assert');
const crypto          = require('crypto');
const nodeAPI         = require('./nodeAPI.js');
const color           = require('./color.js');

module.exports = {
  "auth":function ( connectedNodes, nodeOwner, socket, data ) {
    this.connectedNodes   = connectedNodes;
    this.nodeOwner        = nodeOwner;
    this.socket           = socket;  
    this.node             = socket.node;
    this.data             = data;

    console.debug(color.Blue + "auth SIGNAL received from client");

    let user    = new nodeAPI.User( this.nodeOwner, this.node, this.data );
    let client  = new nodeAPI.Client( this.socket );

    if ( user.isOwner ) { 
      // user owns this node
      // grant special privs
      client.sendClientEvent("nodeOwnerConnected");

      // notify this user of all known peers
       if ( Object.keys(this.connectedNodes).length > 0 ) {
        for ( let nodeSocket in this.connectedNodes ) {
          client.sendClientEvent("nodeDiscovered", nodeSocket);
        }
      }     
    } else {
      // user is connected to node
      // do not grant special privs

      // notify this user of all known peers
       if ( Object.keys(this.connectedNodes).length > 0 ) {
        for ( let nodeSocket in this.connectedNodes ) {
          client.sendClientEvent("nodeDiscovered", nodeSocket);
        }
      }

      // notify everyone about this new peer
      if ( Object.keys(this.connectedNodes).length > 0 ) {
        for ( let nodeSocket in this.connectedNodes ) {
          let peer = new nodeAPI.Client( this.connectedNodes[nodeSocket] );
          peer.sendClientEvent("nodeDiscovered", this.node);
          peer = null;
        }
      }

      // add new peer
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
