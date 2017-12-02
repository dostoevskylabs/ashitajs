/**
 * ashita/client/index
 *
 * @package    ashita/client
 * @author     dostoevskylabs
 */
"use strict";



class AshitaSocket extends WebSocket{
  constructor(nodeUrl){

    super("ws://" + nodeUrl);
    this.nodeUrl = nodeUrl;
    this.addEventListener('open', this.onOpen);
    this.addEventListener('close', this.onClose);
    this.addEventListener('message', this.onMessage);
    this.addEventListener('error', this.onError);
    
    this.onReceiveMOTD;
    this.onPublicMessage;
    this.onNodeDiscovery;

  }
  send(data){
    console.info("AshitaSocket => send", data);
    
    data = JSON.stringify(data);
    if(this.readyState === this.OPEN){
      super.send(data);
    }
  }
  onOpen(event){
    console.info("Socket => onOpen", event);
    this.handshake();
  }
  onClose(event){
    console.info("Socket => onClose", event);
  }
  onMessage(event){
    console.info("Socket => onMessage", event);

    let data = JSON.parse(event.data);

    if ( this.readyState === this.OPEN ) {
      switch ( data.type ) {
        case "nodeOwnerConnected":
          console.info("nodeOwnerConnected Event Received");
        break;

        case "MOTD":
          this.onReceiveMOTD(data.content);
        break;

        case "nodeConnected":
          console.info("nodeConnected Event Received");
        break;

        case "nodeDiscovered":
          this.onNodeDiscovery(data.content.node);
        break;

        case "publicMessage":
          this.onPublicMessage(data.content);
        break;

        default:
          console.log("Unhandled Event");
      }
    }
  }
  onError(event){
    console.error("Socket => onError", event);
  }

  handshake(){
    this.send({"handshake":location.host});
  }
}


class Ashita {
  constructor ( ui = undefined ) {
    this.nodes = new Map();
    this.ui = ui;
    this.state = this.addNode(location.host);
    this.ui.input = this.onUiInput.bind(this);
  }

  onUiInput(data){
    if(this.ui){
      this.ui.print({
        "nodeId": this.state.nodeUrl,
        "username": data.username,
        "message": data.message
      });
    }

    this.state.send({
      type: "publicMessage",
      content:{
        nodeId   : this.state.nodeUrl,
        username : data.username,
        message  : data.message,
      }
    });
  }

  addNode ( nodeUrl ) {
    let node = new AshitaSocket(nodeUrl);
    node.onReceiveMOTD = this.onReceiveMOTD.bind(this);
    node.onPublicMessage = this.onPublicMessage.bind(this);
    node.onNodeDiscovery = this.onNodeDiscovery.bind(this);
    this.nodes.set(node.nodeUrl, node);

    if(this.ui){
      this.ui.addNode(node);
    }

    return node;
  }

  onReceiveMOTD ( data ) {
    console.log("onReceiveMOTD", this);
    if(this.ui){
      this.ui.print( {
        type   : "blank",
        nodeId : data.nodeId,
        message: data.MOTD
      });
    }
  }

  onPublicMessage ( data ) {
    if(this.ui){
      this.ui.print( { username: data.username, message: data.message } );
    }
  }

  onNodeDiscovery ( nodeUrl ) {
    if ( this.nodes.get(nodeUrl) ) {
      return
    }
    this.addNode(nodeUrl);
    if(this.ui){
      this.ui.print( { type:"notice", message:"New peer discovered: " + nodeUrl } );
    }

  }

}

class UI {
  constructor () {
    this.input = document.getElementById("input");
    this.output = document.getElementById("output");
    this.menu = document.getElementById("menu");

    this.input = noop => {};
    input.addEventListener( 'keydown', this.inputKeydown.bind(this) );
  }

  addNode(node){
    const parts = node.nodeUrl.split(":");
    const newEntry = `<div class="node">
      <img class="icon" src="./assets/node.svg"/>
      <div class="address">${parts[0]}
        <span class="port">:${parts[1]}</span>
      </div>
    </div>`;
    menu.insertAdjacentHTML('beforeend', newEntry);
  }

  inputKeydown ( event ) {
    if ( event.key === "Enter" ) {
      const data = {
        "username" : "Anonymous",
        "message" : event.target.value
      };
      event.target.value = "";

      this.input( data );
    }
  }

  createEntry ( data ) {
    let entry;

    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).format(data.timestamp);

    if(data.hasOwnProperty("type")){
      switch(data.type){
        case "blank":
        break;
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
    
    if(data.type === "blank"){
      entry = `
      <div class="entry blank">
        <div class="msg">${data.message}</div>
      </div>`;
    }else{
      entry = `
      <div class="entry ${data.type ? data.type : ''}"">
        <time class="date" datetime="${data.timestamp}">${time}</time>
        <div class="user ${data.type ? 'fa' : ''}">${data.username}</div>
        <div class="msg">${data.message}</div>
      </div>`;
    }

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