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
const btoa            = require('btoa');
const atob            = require('atob');
const color           = require('./color.js');

module.exports = {
  "publicMessage" : function ( nodes, ownerId, nodeId, data ) {
    this.nodes    = nodes;
    this.ownerId  = ownerId;
    this.nodeId   = nodeId;
    this.data     = data.hasOwnProperty("content") ? data.content : undefined;
    
    if ( this.data === undefined ) {
      console.warn("malformed message packet");
      return false;
    }

    this.username = this.nodes[this.nodeId].username;
    this.message = this.data.hasOwnProperty("message") ? this.data.message : undefined;

    if ( this.message === undefined ) {
      console.warn("empty message");
      return false;
    }

    let user    = new nodeAPI.User( this.ownerId, this.nodeId, this.data );
    let client  = new nodeAPI.Client( this.nodes[this.nodeId].socket );

    for ( let peerId in this.nodes ) {
      if ( this.nodeId !== peerId ) {
        let peer = new nodeAPI.Client( this.nodes[peerId].socket );
       
        peer.sendClientEvent("publicMessage", {
          "username" : this.nodes[this.nodeId].username,
          "message"  : this.data.message
        });
      }
    }
  }
};
