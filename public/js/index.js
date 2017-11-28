/**
 * ashita/client/index
 *
 * @package    ashita/client
 * @author     dostoevskylabs
 */
"use strict";
let ashita = {
  node:window.origin.substr(7),
  socket:{}
};

/*
 * ashita/client/socket
 *
 * abstraction layer to handle socket
 *
 * @package  ashita/client
 * @author   dostoevskylabs
 */
function generateSocket(node){
  let ws = new WebSocket("ws://" + node);
  ashita.socket[node] = {
    "events":{
      "open":function ( event ) {
        ashita.transmit.auth( node );
      },

      "onmessage":function ( event ) {
        let payload = JSON.parse(event.data);
        if ( ws.readyState === 1 ) {
          switch ( payload.type ) {
            case "nodeOwnerConnected":
              console.log("nodeOwnerConnected Event Received");
            break;

            case "nodeConnected":
              console.log("nodeConnected Event Received");
            break;

            case "nodeDiscovered":
              if ( Object.keys(ashita.socket).indexOf(payload.content.node) !== -1 ) break;
              console.log("new peer discovered: " + payload.content.node);
              generateSocket(payload.content.node);
            break;

            default:
              console.log("Unhandled Event");
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
  ws.addEventListener("open", ashita.socket[node].events.open);
  ws.addEventListener("close", ashita.socket[node].events.close);
  ws.addEventListener("message", ashita.socket[node].events.onmessage);
  ws.addEventListener("error", ashita.socket[node].events.onerror);
  return ws;
}
generateSocket(ashita.node);

/*
 * ashita/client/transmit
 *
 * abstraction layer to transmit data to the api
 *
 * @package  ashita/client
 * @author   dostoevskylabs
 */
ashita.transmit = {
  "auth":function ( node ) {
    ashita.socket[node].send({
      type:"auth",
      node:ashita.node,
      content:{}
    });
  }
};
