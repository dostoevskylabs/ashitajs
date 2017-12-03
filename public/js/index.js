/**
 * ashita/client/index
 *
 * @package    ashita/client
 * @author     dostoevskylabs
 * @author     mooglesonthecob
 */
"use strict";

/**
 * ashita/client/Messages
 * 
 * @package ashita/client
 */
class Messages {
  constructor () {
    this.privateMessages = [];
    this.publicMessages  = [];
  }

  storePublicMessage ( messageObject ) {
    this.publicMessages.push(messageObject);
  }

  get getPublicMessages () {
    return this.publicMessages;
  }
}

/**
 * ashita/client/AshitaSocket
 * 
 * @extends WebSocket
 * @package ashita/client
 */
class AshitaSocket extends WebSocket {
  constructor ( nodeId ) {
    super("ws://" + nodeId);
    this.nodeId = btoa( nodeId );
    this.addEventListener("open", this.onOpen);
    this.addEventListener("close", this.onClose);
    this.addEventListener("message", this.onMessage);
    this.addEventListener("error", this.onError);

    this.onReceiveMOTD;
    this.onPublicMessage;
    this.onNodeDiscovery;
    this.onHandshakeEstablished;
    this.messages = new Messages();
  }

  send ( data ) {
    //console.info("AshitaSocket => send", data);

    data = JSON.stringify(data);
    if ( this.readyState === this.OPEN ) {
      super.send( data );
    }
  }

  onOpen ( event ) {
    //console.info("Socket => onOpen", event);
    this.handshake();
  }

  onClose ( event ) {
    //console.info("Socket => onClose", event);
    if ( event.code === 3001 ) {
      //console.log("disconnected");
    } else {
      //console.log("couldn't establish connection");
    }
  }

  onMessage ( event ) {
    //console.info("Socket => onMessage", event);

    let data = JSON.parse( event.data );

    if ( this.readyState === this.OPEN ) {
      switch ( data.type ) {
        case "nodeOwnerConnected":
          //console.info("nodeOwnerConnected Event Received");
          break;
        case "MOTD":
          this.onReceiveMOTD( this.nodeId, data.content );
          break;
        case "nodeConnected":
          //console.info("nodeConnected Event Received");
          break;
        case "nodeDiscovered":
          this.onNodeDiscovery( data.content.nodeId );
          break;
        case "publicMessage":
          this.onPublicMessage( this.nodeId, data.content );
          break;
        case "handshakeEstablished":
          this.onHandshakeEstablished( this );
          break;
        default:
          //console.log("Unhandled Event");
      }
    }
  }

  onError ( event ) {
    console.error("Socket => onError", event);
  }

  handshake () {
    this.send({
      "handshake" : location.host
    });
  }
}

/**
 * ashita/client/Ashita
 * 
 * @package ashita/client
 */
class Ashita {
  constructor ( ui = undefined ) {
    this.nodes = new Map();
    this.ui = ui;
    this.state = undefined;
    this.addNode( location.host );
    this.ui.onInput = this.onUiInput.bind( this );
    this.ui.changeNode = this.onUiChangeNode.bind( this );
  }

  onUiChangeNode ( nodeId ) {
    if ( !this.nodes.has( nodeId ) ) {
      return false;
    }
    let node = this.nodes.get( nodeId );
    this.state = node;
    // hack
    if ( this.ui ) {
      let output = document.getElementById("output");
      output.innerHTML = "";
      for ( let i = 0; i < this.state.messages.getPublicMessages.length; i++ ) {
        let entry = {};
        for ( let key in this.state.messages.getPublicMessages[i] ) {
          entry[key] = this.state.messages.getPublicMessages[i][key];
        }
        this.ui.print( entry );        
      }
    }
    //console.info("onUiChangeNode", this.state);
  }

  onUiInput ( data ) {
    this.state.send({
      type     : "publicMessage",
      content  : {
        username : data.username,
        message  : data.message,
      }
    });

    this.state.messages.storePublicMessage({
      username : data.username,
      message  : data.message
    });

    if ( this.ui ) {
      this.ui.print({
        "username" : data.username,
        "message"  : data.message
      });
    }    
  }

  addNode ( nodeId ) {
    if ( this.nodes.has( btoa( nodeId ) ) ) {
      return false;
    }
    let node = new AshitaSocket( nodeId );
    node.onReceiveMOTD = this.onReceiveMOTD.bind( this );
    node.onPublicMessage = this.onPublicMessage.bind( this );
    node.onNodeDiscovery = this.onNodeDiscovery.bind( this );
    node.onHandshakeEstablished = this.onHandshakeEstablished.bind( this );
  }

  onHandshakeEstablished ( node ) {
    if ( this.nodes.has( node.nodeId ) ) {
      return false;
    }
    this.nodes.set( node.nodeId, node );

    if ( this.ui ) {
      this.ui.addNode( node.nodeId );
    }

    if ( this.state === undefined ) {
      this.state = node;
    }
  }

  onReceiveMOTD ( nodeId, data ) {
    //console.log("onReceiveMOTD", this);
    this.nodes.get( nodeId ).messages.storePublicMessage({
      type     : "blank",
      message  : data.MOTD
    });     
    
    if ( this.ui ) {
      if ( this.state.nodeId === nodeId ) {
        this.ui.print({
          type    : "blank",
          message : data.MOTD
        });
      }
    }    
  }

  onPublicMessage ( nodeId, data ) {
    this.nodes.get( nodeId ).messages.storePublicMessage({
      username : data.username,
      message  : data.message
    });

    if ( this.ui ) {
      if ( this.state.nodeId === nodeId ) {
        this.ui.print({
          username : data.username,
          message  : data.message
        });
      }
    }     
  }

  onNodeDiscovery ( nodeId ) {
    if ( this.nodes.has( nodeId ) || this.state.nodeId === nodeId ) {
      return false;
    }

    this.addNode( atob( nodeId ) );

    if ( this.ui ) {
      this.ui.print({
        type    : "notice",
        message : "New peer discovered: " + nodeId
      });
    }
  }
}

/**
 * ashita/client/UI
 * 
 * @package ashita/client
 */
class UI {
  constructor () {
    this.input = document.getElementById("input");
    this.output = document.getElementById("output");
    this.menu = document.getElementById("menu");

    this.changeNode = () => {};
    this.onInput = () => {};

    this.input.addEventListener( "keydown", this.inputKeydown.bind( this ) );
  }

  nodeClick ( event ) {
    this.changeNode( event.currentTarget.dataset.nodeid );
  }

  addNode ( nodeId ) {
    const parts = atob( nodeId ).split(":");

    let elNode = UI.HTMLElement("div", {
      "class"       : "node",
      "data-nodeid" : nodeId
    });

    let elIcon = UI.HTMLElement("img", {
      "class" : "icon",
      "src"   : "./assets/node.svg"
    });

    let elAddress = UI.HTMLElement("div", {
      "class" : "address"
    }, parts[0]);

    let elPort = UI.HTMLElement("span", {
      "class" : "port"
    }, parts[1]);

    elNode.addEventListener("click", this.nodeClick.bind( this ), false);

    elAddress.appendChild( elPort );
    elNode.appendChild( elIcon );
    elNode.appendChild( elAddress );

    this.menu.appendChild( elNode );
  }

  static HTMLElement ( tag, props, innerText = null ) {
    let el = document.createElement( tag );
    for ( const [key, value] of Object.entries( props ) ) {
      el.setAttribute( key, value );
    }
    if ( innerText ) {
      el.innerText = innerText;
    }

    return el;
  }

  inputKeydown ( event ) {
    if ( event.key === "Enter" ) {
      const data = {
        "username" : "Anonymous",
        "message"  : event.target.value
      };
      event.target.value = "";
      this.onInput( data );
    }
  }

  createEntry ( data ) {
    let entry;

    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "numeric", second: "numeric"
    }).format( data.timestamp );

    if ( data.hasOwnProperty("type") ) {
      switch ( data.type ) {
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
        case undefined:
          break;
        default:
          console.error(`Invalid Type "${data.type}"`);
      }
    }

    if ( data.type === "blank" ) {
      entry = `
      <div class="entry blank">
        <div class="msg">${data.message}</div>
      </div>`;
    } else {
      entry = `
      <div class="entry ${data.type ? data.type : ""}"">
        <time class="date" datetime="${data.timestamp}">${time}</time>
        <div class="user ${data.type ? "fa" : ""}">${data.username}</div>
        <div class="msg">${data.message}</div>
      </div>`;
    }

    return entry;
  }

  print ( data ) {
    if ( !data ) {
      data = {
        username  : "test",
        message   : "test test test",
        timestamp : Date.now()
      };
    }
    const newEntry = this.createEntry( data );
    if ( newEntry ) {
      this.output.insertAdjacentHTML("beforeend", newEntry);
      this.output.scrollTop = this.output.scrollHeight;
    }
  }
}

let ui = new UI();
let ashita = new Ashita( ui );