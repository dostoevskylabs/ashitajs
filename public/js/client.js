/**
* ashita/client
*
* @package    ashita/client
* @author     evolretsinis
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
    printMessage:function( data = "" ) {
      if ( typeof data === "object" ) {
        this.messages.push({
          isSystem:false,
          isError:false,
          date:moment,
          channel:data.channel,
          ipaddr:data.ipaddr,
          message:data.text
        });
        return true;
      }
      return false;
    },
    printSystem:function( data = "" ) {
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
    printError:function( data = "" ) {
      if ( typeof data === "string" ) {
        this.messages.push({
          isSystem:false,
          isError:true,
          date:moment,
          ipaddr:"ERROR",
          message:msg
        });
        return true;
      }
      return false;
    },
    addTab:function( name = "System" ) {
      if ( typeof name === "string" && this.tabs.indexOf(name) === -1 ) {
        this.tabs.push(name);
        return true;
      }
      return false;
    },
    removeTab:function( name = "System" ) {
      if ( typeof name === "string" && this.tabs.indexOf(name) !== -1 ) {
        this.tabs.splice(this.tabs.indexOf(name), 1);
        console.log("unsubscribed->" + name);
        return true;
      }
      return false;
    },
    printUsers:function( data ) {
      console.log(data);
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
    selectTab:function( name = "System" ) {
      if ( typeof name === "string" && this.tabs.indexOf(name) !== -1 ) {
        if ( this.state !== name ) {
          document.getElementById(this.state).className = "";
          this.state = name;
          var queryTab = document.getElementById(this.state);
          if( typeof queryTab !== 'undefined' && queryTab !== null ) {
            queryTab.className = "selected";
            console.log("selected->" + this.state);
            ashita.transmit.userlist(this.state);
          } else if ( this.state[0] === "@" ) {
            document.getElementById("uiRight").innerHTML = "No files shared.";
            console.log("selected->" + this.state);
          }
          return true;
        }
      }
      return false;
    },
    getTab:function( name = "System" ) {
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
              ashita.transmit.userlist(this.state);
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
                ashita.transmit.userlist(this.state);
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
              ashita.transmit.join("#"+args[1]);
              break;
              case "part":
              ashita.transmit.part(args[1]);
              break;
              default:
              vm.printError("invalid command");
            }
            ashita.ui.elements.input.value = "";
            return false;
          } else {
            if ( vm.state[0] === "@" ) {
              ashita.transmit.privateMessage(vm.state.substr(1));
              ashita.ui.elements.input.value = "";
            } else {
              ashita.transmit.message(vm.state, message);
              ashita.ui.elements.input.value = "";
            }
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
            vm.printSystem(payload.ipaddr + " is now a node");
            vm.printSystem("New Peer Discovered: " + payload.ipaddr);
          break;
          case "newAuthedConnection":
            vm.printSystem("Welcome Back");
            if ( !document.cookie ) {
              document.cookie = payload.sid;
            }
          break;
          case "newAnonymousConnection":
            vm.printSystem("Who goes there?");
            document.cookie = payload.sid;
          break;
          case "privateSubscribeSuccessful":
            vm.addTab("@"+payload.content.ipaddr);
            vm.selectTab("@"+payload.content.ipaddr);
          break;
          case "subscribeNewSuccessful":
            vm.addTab(payload.content.channel);
            vm.selectTab(payload.content.channel);
            vm.userlist =  payload.content.userlist;
            vm.printSystem("Created channel " + payload.content.channel);
          break;
          case "subscribeNewFailed":
            vm.printError("Channel already exists");
          break;
          case "subscribeSuccessful":
            vm.addTab(payload.content.channel);
            vm.selectTab(payload.content.channel);
            vm.printSystem("Subscribed to " + payload.content.channel);
          break;
          case "subscribeFailed":
            vm.printError("Couldn't subscribe to channel");
          break;
          case "unsubscribeSuccessful":
            vm.selectTab("System");
            vm.removeTab(payload.content.channel);
            vm.printSystem("Unsubscribed to channel");
          break;
          case "unsubscribeFailed":
            vm.printError("Unsubscribe failed");
          break;
          case "userList":
            vm.printUsers(payload.content);
          break;
          case "messageSuccessful":
            vm.selectTab(payload.content.channel);
            vm.printMessage(payload.content);
          break;
          case "signalFault":
            vm.printError("SIGFAULT");
          break;
          case "permissionDenied":
            vm.printSystem("Permission Denied");
          break;
        }
      }
    },
    onerror:function( event ) {},
    close:function( event ) {
      vm.tabs.forEach(function( tab ) {
        if ( tab === "System" ) {
          console.log("Skipping system");
        } else {
          console.log("Unsubscribing to " + tab);
          ashita.transmit.unsubscribe(tab);
        }
      });
      vm.printSystem("Lost connection");
    }
  },
  send:function( data ) {
    var payload = JSON.stringify(data);
    if ( ws.readyState === 1 ) {
      ws.send(payload);
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
  auth:function() {
    ashita.socket.send({
      type:"auth",
      sid:document.cookie
    });
  },
  userlist:function( channel ) {
    ashita.socket.send({
      type:"userlist",
      sid:document.cookie,
      content:{
        channel:channel
      }
    });
  },
  private:function( ipaddr ) {
    ashita.socket.send({
      type:"private",
      sid:document.cookie,
      content:{
        ipaddr:ipaddr
      }
    });
  },
  privateMessage:function( ipaddr ) {
    ashita.socket.send({
      type:"privateMessage",
      sid:document.cookie,
      content:{
        ipaddr:ipaddr
      }
    });
  },
  join:function( channel ) {
    ashita.socket.send({
      type:"join",
      sid:document.cookie,
      content:{
        channel:channel
      }
    });
  },
  part:function( channel ) {
    ashita.socket.send({
      type:"part",
      sid:document.cookie,
      content:{
        channel:channel
      }
    });
  },
  message:function( channel, message ) {
    ashita.socket.send({
      type:"message",
      sid:document.cookie,
      content:{
        channel:channel,
        text:message
      }
    });
  }
};
