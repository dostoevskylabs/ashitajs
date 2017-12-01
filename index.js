/**
 * ashita/core/index
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
require('consoleplusplus');
const args = process.argv.slice(2);

if ( args.length !== 1 ) {
  //process.exit(0);
  args[0] = 8000;
}

const path            = require('path');
const WebSocketServer = require('ws').Server;
const http            = require('http');
const express         = require('express');
const app             = express().use(express.static(path.join(__dirname, '/public')));
const server          = http.createServer(app).listen(args[0]);
const ashita          = new WebSocketServer({server: server});
const fs              = require('fs');
const nodeAPI         = require('./nodeAPI.js');
const clientAPI       = require('./clientAPI.js');
const color           = require('./color.js');

const owner           = `127.0.0.1:${args[0]}`;
let nodes             = {};

console.info(color.BgGreen + color.Black + "System is now online. http://127.0.0.1:" + args[0] + color.Reset);

ashita.on('connection', function ( socket ) {
  let nodeId = `${socket._socket.remoteAddress.substr(7)}:${socket._socket.remotePort}`;
  console.info(color.Green + `Handshake started with ${nodeId}`);

  socket.on('message', function ( socket_data ) {
    let data = JSON.parse( socket_data );

    /**
     * Starting handshake with client
     */
    if ( data.hasOwnProperty("handshake") ) {
      let reportedNode = data["handshake"].split(":");    
      nodeId = `${reportedNode[0]}:${reportedNode[1]}`;

      nodes[nodeId] = {
        "nodeIp"    : socket._socket.remoteAddress.substr(7),
        "nodePort"  : reportedNode[1],
        "nodeName"  : "default",
        "username"  : "Anonymous",
        "socket"    : socket
      };

      console.debug(color.Blue + "auth SIGNAL received from client");
      
      let user    = new nodeAPI.User( owner, `${nodes[nodeId].nodeIp}:${nodes[nodeId].nodePort}`, data.content );
      let client  = new nodeAPI.Client( nodes[nodeId].socket );
  
      if ( user.isOwner ) {
        /**
         * Establish client as owner of this node
         */
        client.sendClientEvent("nodeOwnerConnected");
        fs.readFile("./etc/issue", "utf8", function( error, data ) {
          client.sendClientEvent("MOTD", {
            "nodeId" : nodeId,
            "MOTD" : data.toString()
          });
        });
  
        // notify this user of all known peers
        if ( Object.keys(nodes).length > 0 ) {
          for ( let peerId in nodes ) {
            if ( peerId !== nodeId ) {
              client.sendClientEvent("nodeDiscovered", `${nodes[peerId].nodeIp}:${nodes[peerId].nodePort}`);
            }
          }
        }     
  
        // print peerlist
        console.info(color.Green + "Connected peers");
        console.info(color.Green + "---------------");
        for ( let peerId in nodes ) {
          console.info(color.Green + peerId);
        }
      } else {
        /**
         * Establish client as a user of thise node
         */        
        fs.readFile("./etc/issue", "utf8", function( error, data ) {
          client.sendClientEvent("MOTD", {
            "nodeId" : nodeId,
            "MOTD" : data.toString()
          });
        });
  
        // notify this user of all known peers
        if ( Object.keys(nodes).length > 0 ) {
          for ( let peerId in nodes ) {
            client.sendClientEvent("nodeDiscovered", `${nodes[peerId].nodeIp}:${nodes[peerId].nodePort}`);
          }
        }
  
        // notify everyone about this new peer
        if ( Object.keys(nodes).length > 0 ) {
          for ( let peerId in nodes ) {
            let peer = new nodeAPI.Client( nodes[peerId].socket );
            peer.sendClientEvent("nodeDiscovered", `${nodes[nodeId].nodeIp}:${nodes[nodeId].nodePort}`);
            peer = null;
          }
        }      
  
        // print peerlist
        console.info(color.Green + "Connected peers");
        console.info(color.Green + "---------------");
        for ( let peerId in nodes ) {
          console.info(color.Green + peerId);
        }
      }
      /**
       * Handshake with client has been established
       */
      console.info(color.Green + `Handshake established with ${nodeId}`);
    } else {
      /**
       * Wait for client to query ClientAPI
       */
      if ( nodes.hasOwnProperty(nodeId) ) {
        if ( typeof clientAPI[data.type] !== "function" ) {
          console.warn("Invalid clientAPI call received from socket.");
        }

        return clientAPI[data.type](nodes, owner, nodeId, data.content);
      } else {
        /**
         * If this is reached the client does not have a valid handshake
         */
        console.log(`Invalid Handshake with ${nodeId}`);
      }
    }
  });

  socket.on('error', function ( error ) {
    console.error(error)
  });

  socket.on('close', function () {
    if ( nodes.hasOwnProperty(nodeId) ) {
      nodes[nodeId] = null;
      delete nodes[nodeId];
      console.debug(color.Red + "Removed node " + nodeId);
    }
    console.info(color.Red + "Connection closed.");
  });
});
