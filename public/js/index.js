/**
 * ashita/client/index
 *
 * @package    ashita/client
 * @author     dostoevskylabs
 */
"use strict";
class Socket {
  constructor( node ) {
    this.ws = new WebSocket( "ws://" + node );
    this.node = node;
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


class AshitaSocket extends Socket{
  constructor ( node ) {
    super( node );
  }
  send ( data ) {
    super.send( data );
  }
  login(){
    this.send( /*login payload*/ );
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
    let newSocket = new AshitaSocket(nodeId);
    newSocket.onNodeDiscovery = this.onNodeDiscovery;
    this.sockets[nodeId] = newSocket;
  }

  onNodeDiscovery(nodeId){
    if ( Object.keys(this.sockets).indexOf(nodeId) !== -1 )
      return;
    console.log("new peer discovered: " + nodeId);
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
        this.onInput(message);
    }
  }

  createEntry ( data ) {
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).format(data.timestamp);

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
