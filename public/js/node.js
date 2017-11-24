/**
 * ashita/client/index
 *
 * @package    ashita/client
 * @author     dostoevskylabs
 */
"use strict";
let ashita = {};
/*
 * ashita/client/socket
 *
 * abstraction layer to handle socket
 *
 * @package  ashita/client
 * @author   dostoevskylabs
 */
const ws = new WebSocket("ws://127.0.0.1:8000");
ashita.socket = {
  "events":{
    "open":function ( event ) {
      ashita.signal.auth();
    },

    "onmessage":function ( event ) {
      let payload = JSON.parse(event.data);
      if ( ws.readyState === 1 ) {
        switch ( payload.type ) {
          case "nodeOperatorConnected":
            //console.debug("nodeOperatorConnected Event Received");
          break;

          case "nodeConnected":
            //console.debug("nodeConnected Event Received");
          break;

          case "nodeList":
            console.debug("Connected peers");
            console.debug("---------------");
            payload.content.nodeList.forEach(function(peer){
              console.debug(peer);
            });
          break;

          case "nodeDiscovered":
            //console.debug("nodeDiscovered Event Received");
            console.debug("new peer discovered: " + payload.content.nodeIp);
          break;
          
          default:
            console.debug("Unhandled Event");
        }
      }
    },

    "onerror":function ( error ) {
      //console.error(error);
    },

    "close":function ( event ) {
    }
  },

  "send":function ( data ) {
    let payload = JSON.stringify( data );
    if ( ws.readyState === 1 ) {
      ws.send( payload );
      return true;
    }
    return false;
  }
};
ws.addEventListener("open", ashita.socket.events.open);
ws.addEventListener("close", ashita.socket.events.close);
ws.addEventListener("message", ashita.socket.events.onmessage);
ws.addEventListener("error", ashita.socket.events.onerror);
/*
 * ashita/client/signal
 *
 * abstraction layer to transmit data
 *
 * @package  ashita/client
 * @author   dostoevskylabs
 */
ashita.signal = {
  "auth":function () {
    ashita.socket.send({
      type:"auth",
      node:"127.0.0.1:9000",
      content:{}
    });
  }
};
