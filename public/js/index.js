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
    const input = document.querySelector( "input" );
    this.onInput = undefined;
    input.addEventListener( 'keydown', this.inputKeydown.bind(this) );
    //document.addEventListener( ' keydown',)
  }

  inputKeydown ( event ) {
    if ( event.key === "Enter" ) {
      const message = event.target.value;
      event.target.value = "";

      if(this.onInput)
        this.onInput(message);
    }
  }

  print ( data ) {
    const entry = document.createElement('div');
    entry.classList.add("entry");
    entry.classList.add(data.type ? data.type : "");

    const time = document.createElement('time');
    time.innerText = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).format(new Date());
    time.className = "date";
    entry.appendChild(time);

    const user = document.createElement('div');
    user.className = "user";
    if(data.type){
      const gross = {notice: "\uf071", error: "\uf06a", warning: "\uf071"};
      console.log(data.type);
      user.innerText = gross[data.type];
      user.classList.add('fa');
    }else{
      user.innerText = data.user;
    }
    entry.appendChild(user);

    const msg = document.createElement('div');
    msg.className = "msg";
    msg.innerText = data.msg;    
    entry.appendChild(msg);

    const output = document.getElementById("output");
    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
  }
}



let ui = new UI();
let ashita = new Ashita(ui);
ashita.addSocket(window.origin.substr(7))
