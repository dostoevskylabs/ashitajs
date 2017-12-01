/**
 * ashita/client/index
 *
 * @package    ashita/client
 * @author     dostoevskylabs
 */
"use strict";
class Socket{
  constructor( nodeId ) {
    this.ws = new WebSocket( "ws://" + nodeId );
    this.node = window.origin.substr(7);
    this.onNodeDiscovery = undefined;

    this.ws.addEventListener( "open" , this.onOpen.bind(this) );
    this.ws.addEventListener( "close" , this.onClose.bind(this) );
    this.ws.addEventListener( "message" , this.onMessage.bind(this) );
    this.ws.addEventListener( "error" , this.onError.bind(this) );
  }

  send( data ) {
    let payload = JSON.stringify( data );
    if ( this.ws.readyState === 1 ) {
      this.ws.send( payload );
      return true;
    }
    return false;
  }

  onClose ( event ) {
    console.warn("CLOSING", event);
  }
  onError ( event ) {
    console.error(event);
  }
  onMessage ( event ) {
    let payload = JSON.parse(event.data);
    if ( this.ws.readyState === 1 ) {
      switch ( payload.type ) {
        case "nodeOwnerConnected":
          console.log("nodeOwnerConnected Event Received");
        break;

        case "MOTD":
          this.printMOTD(payload.content);
        break;

        case "nodeConnected":
          console.log("nodeConnected Event Received");
        break;

        case "nodeDiscovered":
          this.onNodeDiscovery(payload.content.node);
        break;

        default:
          console.log("Unhandled Event");
      }
    }
  }
  onOpen ( event ) {
    this.send({
      type:"auth",
      node:this.node,
      content:{}
    });
  }
}


class Ashita{
  constructor(ui){
    this.sockets = {};
    this.ui = ui;

    this.ui.onInput = this.onInput;
  }

  onInput ( message ) {
    console.log("Ashita.onInput", message);
  }

  addSocket (nodeId) {
    let newSocket = new Socket(nodeId);
    this.sockets[nodeId] = newSocket;
    newSocket.onNodeDiscovery = this.onNodeDiscovery.bind(this);
    newSocket.printMOTD = this.printMOTD.bind(this);

    // hack
    const menu = document.getElementById("menu");
    const parts = nodeId.split(":");
    menu.innerHTML += `<div class="node">
      <img class="icon" src="./assets/node.svg"/>
      <div class="address">${parts[0]}
        <span class="port">:${parts[1]}</span>
      </div>
    </div>`;
  }

  printMOTD(MOTD){
    this.ui.print({
      type:"blank",
      message:MOTD
    });
  }
  onNodeDiscovery(nodeId){
    if ( Object.keys(this.sockets).indexOf(nodeId) !== -1 )
      return;
    this.ui.print({
      type:"notice",
      message:"New peer discovered: " + nodeId
    });
    this.addSocket(nodeId);
  }
}

class UI {
  constructor () {
    this.input = document.getElementById("input");
    this.output = document.getElementById("output");
    this.onInput = undefined;
    input.addEventListener( 'keydown', this.inputKeydown.bind(this) );
  }

  inputKeydown ( event ) {
    if ( event.key === "Enter" ) {
      const message = event.target.value;
      event.target.value = "";

      if(this.onInput)
        this.print({
          username:window.origin.substr(7),
          message:message
        });
    }
  }

  createEntry ( data ) {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).format(data.timestamp);
    if ( data.type === "blank" ) {
      const entry = `
      <div class="entry blank">
        <div class="msg">${data.message}</div>
      </div>
      `;
      return entry;      
    }

    if(data.hasOwnProperty("type")){
      switch(data.type){
        case "error":
          data.username = "\uf06a";
        break;
        case "notice":
          data.username = "\uf0f3";
        break;
        case "warning":
          data.username = "\uf071";
        break;
        default:
          console.error(`Invalid Type "${data.type}"`);
          return;
      }
    }
    const entry = `
    <div class="entry ${data.type ? data.type : ''}"">
      <time class="date" datetime="${data.timestamp}">${time}</time>
      <div class="user ${data.type ? 'fa' : ''}">${data.username}</div>
      <div class="msg">${data.message}</div>
    </div>
    `;
    return entry;
  }

  print ( data ) {
    if(!data){
      data = {username: "test", message: "test test test", timestamp: Date.now()};
    }
    const newEntry = this.createEntry( data );
    if(newEntry){
      this.output.insertAdjacentHTML('beforeend', newEntry);
      this.output.scrollTop = this.output.scrollHeight;
    }
  }
}



let ui = new UI();
let ashita = new Ashita(ui);
ashita.addSocket(window.origin.substr(7))
