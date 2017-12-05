/**
 * ashita/Core
 *
 * @package    ashita
 * @author     dostoevskylabs
 * @author     mooglesonthecob
 */
"use strict";
const os                = require('os');
const WebSocketServer   = require('ws').Server;
const networkInterfaces = os.networkInterfaces();
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
  constructor ( Object, port ) {
    super( Object );
    this.on('connection', this.onConnection );
    this.node = {
      nodeIds     : [],
      channelName : "default"
    };

    for ( let i in networkInterfaces ) {
      for ( let iface in networkInterfaces[i] ) {
        this.node.nodeIds.push(networkInterfaces[i][iface].address + ":" + port);
      }
    }
    
    this.nodes   = {};
    Logger.notice(`Server started. Visit http://127.0.0.1:${port}`);
  }

  /**
   * onConnection
   * 
   * @param      socket
   */
  onConnection ( socket ) {
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
    Logger.info(`New peer session: ${sessionId}`)
  }
}

module.exports = {
  "Core" : Core
}