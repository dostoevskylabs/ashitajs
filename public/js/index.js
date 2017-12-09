"use strict";
class Messages {
  constructor () {
    this.publicMessages  = [];
  }

  storePublicMessage ( messageObject ) {
    this.publicMessages.push(messageObject);
  }

  get getPublicMessages () {
    return this.publicMessages;
  }
}

class AshitaSocket extends WebSocket {
  constructor () {
    super("ws://" + location.host);
    this.addEventListener("open", this.onOpen);
    this.addEventListener("close", this.onClose);
    this.addEventListener("message", this.onMessage);
    this.addEventListener("error", this.onError);

    this.onReceiveMOTD = undefined;
    this.onPublicMessage = undefined;
    this.onPeerDiscovery = undefined;
    this.messages = new Messages();
  }

  send ( data ) {
    data = JSON.stringify( data );
    if ( this.readyState === this.OPEN ) {
      super.send( data );
    }
  }

  onOpen ( event ) {}

  onClose ( event ) {
    if ( event.code === 3001 ) {
      //console.log("disconnected");
    } else {
      //console.log("couldn't establish connection");
    }
  }

  onMessage ( event ) {
    let data = JSON.parse( event.data );
    if ( this.readyState === this.OPEN ) {
      switch ( data.type ) {
        case "MOTD":
          this.onReceiveMOTD( data.content );
          break;

        case "availablePeers":
          console.log(data.content);
          break;

        case "subscribeSuccessful":
          console.log(data);
          break;

        case "subscribeFailed":
          console.log(data);
          break;          

        case "peerDiscovered":
          this.onPeerDiscovery( data.content );
          console.log(data);
          break;

        case "publicMessage":
          this.onPublicMessage( data.content );
          break;

        case "invalidEvent":
          console.log("Unknown Event", data.content );
          break;

        default:
          // pass
      }
    }
  }

  onError ( event ) {}
}

class Ashita {
  constructor ( ui = undefined ) {
    this.ui = ui;
    this.state = undefined;

    this.node = new AshitaSocket();

    this.peers = new Map();
    
    this.node.onReceiveMOTD = this.onReceiveMOTD.bind( this );
    this.node.onPublicMessage = this.onPublicMessage.bind( this );
    this.node.onPeerDiscovery = this.onPeerDiscovery.bind( this );

    this.ui.onInput = this.onUiInput.bind( this );
    this.ui.changePeer = this.onUiChangePeer.bind( this );
  }

  onUiChangePeer ( peerId ) {
    if ( !this.peers.has( peerId ) ) {
      return false;
    }
    let peer = this.peers.get( peerId );
    this.state = peer;
    // hack
    if ( this.ui ) {
      let output = document.getElementById("output");
      output.innerHTML = "";
      for ( let i = 0; i < this.node.messages.getPublicMessages.length; i++ ) {
        let entry = {};
        for ( let key in this.node.messages.getPublicMessages[i] ) {
          entry[key] = this.node.messages.getPublicMessages[i][key];
        }
        this.ui.print( entry );        
      }
    }
  }

  onUiInput ( data ) {
    this.node.send({
      type     : "publicMessage",
      content  : {
        peerId   : this.state,
        username : data.username,
        message  : data.message,
      }
    });
    console.log(data);
    this.node.messages.storePublicMessage({
      timestamp: Date.now(),
      peerId   : this.state,
      username : data.username,
      message  : data.message
    });

    if ( this.ui ) {
      this.ui.print({
        "timestamp": Date.now(),
        "peerId"   : this.state,
        "username" : data.username,
        "message"  : data.message
      });
    }    
  }

  addPeer ( peerId ) {
    if ( this.peers.has( peerId ) ) {
      return false;
    }


    this.peers.set( peerId, "test");
    if ( this.ui ) {
      this.ui.addPeer({peerId: peerId, channelName: "default"});

      if ( this.state === undefined ) {
        this.state = peerId;
      }
    }

  }

  onReceiveMOTD ( data ) {
    this.node.messages.storePublicMessage({
      type     : "blank",
      peerId   : data.peerId,
      message  : data.MOTD
    });     

    if ( this.ui ) {
      if ( this.state === data.peerId ) {
        this.ui.print({
          type    : "blank",
          peerId  : data.peerId,
          message : data.MOTD
        });
      }
    }    
  }

  onPublicMessage ( data ) {
    this.node.messages.storePublicMessage({
      timestamp: Date.now(),
      peerId   : data.peerId,
      username : data.username,
      message  : data.message
    });

    if ( this.ui ) {
      if ( this.state === data.peerId ) {
        this.ui.print({
          timestamp: Date.now(),
          username : data.username,
          message  : data.message
        });
      }
    }     
  }

  onPeerDiscovery ( data ) {
    if ( this.peers.has( data.peerId ) || this.state === data.peerId ) {
      return false;
    }

    this.addPeer( data.peerId );

    if ( this.ui ) {
      this.ui.print({
        type      : "notice",
        peerId    : data.peerId,
        timestamp : Date.now(),
        message   : "New peer discovered: " + data.peerId
      });
    }
  }
}

class UI {
  constructor () {
    this.input = document.getElementById("input");
    this.output = document.getElementById("output");
    this.menu = document.getElementById("menu");

    this.changePeer = undefined;
    this.onInput = undefined;

    this.input.addEventListener( "keydown", this.inputKeydown.bind( this ) );
  }

  peerClick ( event ) {
    this.changePeer( event.currentTarget.dataset.peerid );
  }

  addPeer ( data ) {

    let elNode = UI.HTMLElement("div", {
      "class"       : "node",
      "data-peerid" : data.peerId
    });

    let elIndicator = UI.HTMLElement("div", {
      "class" : "nodeIndicator"
    });

    let elTitle = UI.HTMLElement("div", {
      "class" : "nodeTitle"
    }, data.channelName);

    let elRight = UI.HTMLElement("div", {
      "class" : "nodeRight"
    });

    let elAddress = UI.HTMLElement("div", {
      "class" : "nodeAddress"
    }, `${data.peerId}`);

    elNode.addEventListener("click", this.peerClick.bind( this ), false);

    elNode.appendChild(elIndicator);
    elNode.appendChild(elTitle);
    elNode.appendChild(elRight);
    elNode.appendChild(elAddress);

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

    const time = Intl.DateTimeFormat("en-US", {
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
    if ( data ) {
      const newEntry = this.createEntry( data );
      if ( newEntry ) {
        this.output.insertAdjacentHTML("beforeend", newEntry);
        this.output.scrollTop = this.output.scrollHeight;
      }
    }
  }
}

let ui = new UI();
let ashita = new Ashita( ui );