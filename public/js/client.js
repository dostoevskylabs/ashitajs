/**
* ashita/client
*
* @package    ashita/client
* @author     dostoevskylabs
*/
var ashita = (function(){
  return {
    mode: "dev",
    nodeIp: window.location.host,
    version: "1.0.0"
  };
})();
/**
* ui
*
* ui wrapper utilizing vue
*
* @package  ashita/client/ui
* @author   recursiveoverflow
*/
var tabComponent = {
  template: "#tab-template",
  methods: {
    selectTab:function(name){
      vm.selectTab(name);
    }
  },
  props: ['tab']
};
var msgComponent = {
  template: "#msg-template",
  methods: {
    getState:function(){
      return vm.state;
    }
  },
  props: ['msg']
};
var vm = new Vue({
  el: "#container",
  components:{
    "tab":tabComponent,
    "msg":msgComponent
  },
  data: {
    messages: [],
    userlist: [],
    tabs: ['System'],
    state: "System",
  },
  methods:{
    printMessage:function printMessage( data ) {
      if ( typeof data === "object" ) {
        this.messages.push({
          isSystem:false,
          isError:false,
          date:moment,
          channel:data.channel.name,
          ipaddr:data.channel.ipaddr,
          message:data.channel.message
        });
        return true;
      }
      return false;
    },
    printSystem:function printSystem( data ) {
      if ( typeof data === "string" ) {
        this.messages.push({
          isSystem:true,
          isError:false,
          date:moment,
          channel:"System",
          ipaddr:"SYSTEM",
          message:data
        });
        return true;
      }
      return false;
    },
    printError:function printError( data ) {
      if ( typeof data === "string" ) {
        this.messages.push({
          isSystem:false,
          isError:true,
          date:moment,
          channel:"System",
          ipaddr:"ERROR",
          message:data
        });
        return true;
      }
      return false;
    },
    addTab:function addTab( name ) {
      if ( typeof name === "string" && this.tabs.indexOf(name) === -1 ) {
        this.tabs.push(name);
        return true;
      }
      return false;
    },
    removeTab:function removeTab( name ) {
      if ( typeof name === "string" && this.tabs.indexOf(name) !== -1 ) {
        this.tabs.splice(this.tabs.indexOf(name), 1);
        console.log("unsubscribed->" + name);
        return true;
      }
      return false;
    },
    printUsers:function printUsers( data ) {
      if ( this.state === data.channel ) {
        this.userlist = data.users;
        var users = "";
        var el = document.getElementById("uiRight");
        this.userlist.forEach(function(user){
          users += user + ' <div style="float:right;text-align:right;font-size:10px;"><a href="#" onClick="ashita.transmit.private(\''+user+'\')" title="message">[message]</a></div><br/>';
        });
        el.innerHTML = users;
      }
    },
    selectTab:function selectTab( name ) {
      if ( typeof name === "string" && this.tabs.indexOf(name) !== -1 ) {
        if ( this.state !== name ) {
          document.getElementById(this.state).className = "";
          this.state = name;
          var queryTab = document.getElementById(this.state);
          if( typeof queryTab !== 'undefined' && queryTab !== null ) {
            queryTab.className = "selected";
            console.log("selected->" + this.state);
          } else if ( this.state[0] === "@" ) {
            document.getElementById("uiRight").innerHTML = "No files shared.";
            console.log("selected->" + this.state);
          }
          return true;
        }
      }
      return false;
    },
    getTab:function getTab( name ) {
      if ( typeof name === "string" && this.tabs.indexOf(name) !== -1 ) {
        if ( this.state === name ) {
          var queryTab = document.getElementById(this.state);
          if( typeof queryTab !== 'undefined' && queryTab !== null ) {
            if ( name[0] === "@" ) {
              queryTab.className = "selected";
              document.getElementById("uiRight").innerHTML = "No files shared.";
              console.log("selected->" + this.state);
              return this.state;
            }
            if ( queryTab.className !== "selected" ) {
              queryTab.className = "selected";
              console.log("selected->" + this.state);
            }
          } else {
            this.$watch('tabs', function() {
              var queryTab = document.getElementById(name);
              if ( name[0] === "@" ) {
                queryTab.className = "selected";
                document.getElementById("uiRight").innerHTML = "No files shared.";
                console.log("selected->" + this.state);
                return this.state;
              }
              if( typeof queryTab !== 'undefined' && queryTab !== null ) {
                queryTab.className = "";
                document.getElementById(this.state).className = "selected";
                console.log("selected->" + this.state);
              }
            });
          }
          return this.state;
        }
      }
      return false;
    },
  }
});
ashita.ui = {
  elements:{
    output: document.getElementById('uiOutput'),
    input: document.getElementById('uiInput')
  },
  events:{
    domready: function() {
      ashita.ui.elements.input.addEventListener('keydown', ashita.ui.events.input);
    },
    input:function( e ) {
      var message = ashita.ui.elements.input.value;
      if ( message.length > 0 ) {
        if ( e.key === "Enter" ) {
          if ( message[0] === "/" ) {
            while( message.charAt(0) === '/' ) {
              message = message.substr(1);
            }
            var args = message.split(" ");
            switch ( args[0] ) {
              case "join":
                ashita.transmit.channelJoin(args[1]);
              break;
              case "part":
                ashita.transmit.channelPart(vm.state);
              break;
              default:
                vm.printError("invalid command");
            }
            ashita.ui.elements.input.value = "";
            return false;
          } else {
            ashita.transmit.channelMessage(vm.state, message);
            ashita.ui.elements.input.value = "";
            return false;
          }
        } else {
          return true;
        }
      }
    }
  }
};
document.addEventListener("DOMContentLoaded", ashita.ui.events.domready);
/**
* socket
*
* socket wrapper
*
* @package  ashita/client/socket
* @author   recursiveoverflow
*/
var ws = new WebSocket("wss://" + ashita.nodeIp + ":443");
ashita.socket = {
  events:{
    open:function( event ) {
      ashita.transmit.auth();
    },
    onmessage:function( event ) {
      var payload = JSON.parse(event.data);
      if ( ws.readyState === 1 ) {
        switch ( payload.type ) {
          case "newPeerDiscovered":
            vm.printSystem(payload.content.ipaddr + " is now a node");
            vm.printSystem("New Peer Discovered: " + payload.content.ipaddr);
          break;
          case "newAuthedConnection":
            vm.printSystem("Welcome Back");
            if ( !document.cookie ) {
              document.cookie = payload.content.sid;
            }
          break;
          case "newAnonymousConnection":
            vm.printSystem("Who goes there?");
            document.cookie = payload.content.sid;
          break;
          case "subscribeNewSuccessful":
            vm.addTab(payload.content.channel.name);
            vm.selectTab(payload.content.channel.name);
            vm.userlist =  payload.content.userlist;
            vm.printSystem("Created channel " + payload.content.channel.name);
          break;
          case "subscribeSuccessful":
            vm.addTab(payload.content.channel.name);
            vm.selectTab(payload.content.channel.name);
            vm.printSystem("Subscribed to " + payload.content.channel.name);
          break;
          case "unsubscribeSuccessful":
            vm.selectTab("System");
            vm.removeTab(payload.content.channel.name);
          break;
          case "userList":
            vm.printUsers(payload.content);
          break;
          case "messageSuccessful":
            vm.selectTab(payload.content.channel.name);
            vm.printMessage(payload.content);
          break;
          case "debug":
            console.log(payload.content.object);
          break;
        }
      }
    },
    onerror:function( event ) {},
    close:function( event ) {}
  },
  send:function( data ) {
    var payload = JSON.stringify( data );
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
/**
 * transmit
 *
 * abstraction layer to transmit data
 *
 * @package  ashita/client/transmit
 * @author   recursiveoverflow
 */
ashita.transmit = {
  debug:function( controller ) {
    ashita.socket.send({
      type:"debug",
      content:{
        "controller":controller
      }
    });
  },
  auth:function() {
    ashita.socket.send({
      type:"auth",
      content:{
        sid:document.cookie,
      }
    });
  },
  channelJoin:function( channel ) {
    ashita.socket.send({
      type:"channelJoin",
      content:{
        sid:document.cookie,
        channel:{
          name:channel
        }
      }
    });
  },
  channelPart:function( channel ) {
    ashita.socket.send({
      type:"channelPart",
      content:{
        sid:document.cookie,
        channel:{
          name:channel
        }
      }
    });
  },
  channelMessage:function( channel, message ) {
    ashita.socket.send({
      type:"channelMessage",
      content:{
        sid:document.cookie,
        channel:{
          name:channel,
          message:message
        }
      }
    });
  }
};
