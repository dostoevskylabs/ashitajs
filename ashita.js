/**
 * ashita/Core
 *
 * @package    ashita
 * @author     dostoevskylabs
 * @author     mooglesonthecob
 */
"use strict";
const WebSocketServer   = require('ws').Server;
const crypto            = require('crypto');
const btoa              = require('btoa');
const atob              = require('atob');
const API               = require('./api.js');
const Logger            = require('./logger.js');

class Core extends WebSocketServer {
  /**
   * constructor
   * 
   * @param      Object
   * @param      port
   */
  constructor ( Object, nodeHost ) {
    super( Object );
    this.on('connection', this.onConnection );
    this.nodeHost = nodeHost;
    this.node = {
      channelName : "default",
      password    : "676257ebf7eea3567840f15ab128747cf0153c4296d607f322930b05664246f66a4743724456e6706124c913cc3bb1159522777e95057bd54c5d78b4dd37a6c8"
    };
    
    this.nodes   = {};
    Logger.notice(`Server started. Visit ${this.nodeHost}`);
  }

  /**
   * onConnection
   * 
   * @param      socket
   */
  onConnection ( socket ) {
    if ( socket._socket.remoteAddress.substr(7) === "127.0.0.1" ) {
      Logger.error("Establishing connection to localhost. is forbidden.");
      return false;
    }
    this.established = false;
    new API( this, socket );
  }

  /**
   * getNodeList
   */
  get getNodeList () {
    return this.nodes;
  }

  /**
   * getNode
   * 
   * @param      sessionId
   */
  getNode ( sessionId ) {
    /**
     * TODO: Write checks to make sure session exists before returning it
     */
    return this.nodes[sessionId];
  }

  /**
   * addNode
   * 
   * @param      sessionId
   * @param      nodeObject
   */
  addNode ( sessionId, nodeObject ) {
    /**
     * TODO: Write checks to see if the object already exists/sessionId is valid/etc
     */
    this.nodes[sessionId] = nodeObject;
  }
}

module.exports = {
  "Core" : Core
}