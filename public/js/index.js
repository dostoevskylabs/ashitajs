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
function generateSocket(nodeIp){
  let ws = new WebSocket("ws://" + nodeIp);
  ashita.socket[nodeIp] = {
    "events":{
      "open":function ( event ) {
        ashita.signal.auth( nodeIp );
      },

      "onmessage":function ( event ) {
        let payload = JSON.parse(event.data);
        if ( ws.readyState === 1 ) {
          switch ( payload.type ) {
            case "nodeOperatorConnected":
              console.log("nodeOperatorConnected Event Received");
            break;

            case "nodeConnected":
              console.log("nodeConnected Event Received");
            break;

            case "nodeList":
              console.log("Connected peers");
              console.log("---------------");
              payload.content.nodeList.forEach(function(peer){
                console.log(peer);
              });
            break;

            case "nodeDiscovered":
              if ( Object.keys(ashita.socket).indexOf(payload.content.nodeIp) !== -1 ) break;
              console.log("new peer discovered: " + payload.content.nodeIp);
              generateSocket(payload.content.nodeIp);
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
  ws.addEventListener("open", ashita.socket[nodeIp].events.open);
  ws.addEventListener("close", ashita.socket[nodeIp].events.close);
  ws.addEventListener("message", ashita.socket[nodeIp].events.onmessage);
  ws.addEventListener("error", ashita.socket[nodeIp].events.onerror);
  return ws;
}
generateSocket(ashita.node);
/*
 * ashita/client/signal
 *
 * abstraction layer to transmit data
 *
 * @package  ashita/client
 * @author   dostoevskylabs
 */
ashita.signal = {
  "auth":function ( nodeIp ) {
    ashita.socket[nodeIp].send({
      type:"auth",
      node:ashita.node,
      content:{}
    });
  }
};
