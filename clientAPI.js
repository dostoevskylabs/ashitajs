/**
 * ashita/core/clientAPI
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const validator       = require('validator');
const assert          = require('assert');
const nodeAPI         = require('./nodeAPI.js');
const color           = require('./color.js');

module.exports = {
  "publicMessage":function(nodes, owner, nodeId, data){
    this.nodes    = nodes;
    this.owner    = owner;
    this.nodeId   = nodeId;
    this.data     = data;

    let user    = new nodeAPI.User( owner, `${this.nodes[this.nodeId].nodeIp}:${this.nodes[this.nodeId].nodePort}`, this.data );
    let client  = new nodeAPI.Client( this.nodes[this.nodeId].socket );

    for ( let peerId in this.nodes ) {
      if ( this.nodeId !== peerId ) {
        let peer = new nodeAPI.Client( this.nodes[peerId].socket );
        peer.sendClientEvent("publicMessage", {
          "username":this.nodes[this.nodeId].username,
          "message":this.data.message
        });
      }
    }
  }
};
