/**
 * ashita/client
 *
 * @package    ashita/client
 * @author     recursiveoverflow
 * @author     mooglesonthecob
 */
var ashita = (function(){
    return {
		mode: "production",
		nodeIp: "10.0.1.2",
		ipAddr: this.ipAddr,
	    	version: "1.0.0"
    };
})();
/**
 * Stolen from a StackOverflow post
 * will likely be rewritten soon, but for now
 * this will work
 *
 * http://stackoverflow.com/questions/20194722/can-you-get-a-users-local-lan-ip-address-via-javascript
 * @author	 recursiveoverflow
 * @author   mido (http://stackoverflow.com/users/3074768/mido)
**/
switch ( ashita.mode ) {
	case "dev":
		//#ashita.nodeIp = "192.168.0.160";
		window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
		var pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};
		pc.createDataChannel("");
		pc.createOffer(pc.setLocalDescription.bind(pc), noop);
		pc.onicecandidate = function(ice)
		{
			if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
			var myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
			ashita.ipAddr = myIP;
			pc.onicecandidate = noop;
		};
	break;
}
/**
 * ui
 *
 * ui wrapper utilizing vue
 *
 * @package  ashita/client/ui
 */
 var tabComponent = {
	template: "#tab-template",
	methods: {
		selectTab : function(name){
			vm.selectTab(name);
		}
	},
	props: ['tab']
 };
var msgComponent = {
	template: "#msg-template",
	methods: {
		getState : function(){
			return vm.state;
		}
	},
	props: ['msg']
};
var vm = new Vue({
    el: "#container",
	components : {
		"tab" : tabComponent,
		"msg" : msgComponent
	},
    data: {
        messages: [],
		userlist: [],
		tabs: ['System'],
	    state: "System",
    },
    methods : {
		printMessage : function( data = "" )
		{
			if ( typeof data === "object" ) {
	            this.messages.push({
	                isSystem : false,
	                isError : false,
	                date : moment,
	                channel : data.channel,
	                username : data.username,
	                message : data.text
	            });
				return true;
			}
			return false;
        },
        printSystem : function( data = "" )
		{
			if ( typeof data === "string" ) {
	            this.messages.push({
	                isSystem : true,
	                isError : false,
	                date : moment,
					channel : "System",
	                username : "SYSTEM",
	                message : data
	            });
				return true;
			}
			return false;
        },
        printError : function( data = "" )
		{
			if ( typeof data === "string" ) {
				this.messages.push({
	                isSystem : false,
	                isError : true,
	                date : moment,
					//channel : "System",
	                username : "ERROR",
	                message : msg
	            });
				return true;
			}
			return false;
        },
		addTab : function( name = "System" )
		{
			if ( typeof name === "string" && this.tabs.indexOf(name) === -1 ) {
				this.tabs.push(name);
				return true;
			}
			return false;
	    },
		removeTab : function( name = "System" )
		{
			if ( typeof name === "string" && this.tabs.indexOf(name) !== -1 ) {
				this.tabs.splice(this.tabs.indexOf(name), 1);
				console.log("unsubscribed->" + name);
				return true;
			}
			return false;
		},
		printUsers : function( data )
		{
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
	    selectTab : function( name = "System" )
		{
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
		getTab : function( name = "System" )
		{
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
						this.$watch('tabs', function()
						{
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
    elements : {
        output: document.getElementById('uiOutput'),
        input: document.getElementById('uiInput')
    },
    events : {
        domready: function()
		{
            ashita.ui.elements.input.addEventListener('keydown', ashita.ui.events.input);
        },
        input : function( e )
		{
            var message = ashita.ui.elements.input.value;
            if ( message.length > 0 ) {
                if ( e.key === "Enter" ) {
				 if ( message[0] === "/" ) {
                    while( message.charAt(0) === '/' ) {
                      message = message.substr(1);
                    }
                    var args = message.split(" ");
                    switch ( args[0] )
					{
                      case "subscribe":
                        ashita.transmit.subscribe("#"+args[1]);
                      break;
                      case "unsubscribe":
                        ashita.transmit.unsubscribe(args[1]);
                      break;
                      case "register":
                        ashita.transmit.register(args[1], args[2]);
                      break;
                      case "login":
                        ashita.transmit.login(args[1], args[2]);
                      break;
                      case "logout":
                        ashita.transmit.logout();
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
 */
var ws = new WebSocket("wss://" + ashita.nodeIp + ":443");
ashita.socket = {
    events:{
        open:function(event){
			ashita.transmit.auth();
			console.log("Broadcasting: " + ashita.ipAddr);
		},
        onmessage:function(event){
            var payload = JSON.parse(event.data);
            if ( ws.readyState === 1 ) {
                switch ( payload.type ) {
					case "newPeerDiscovered":
						if ( ashita.ipAddr === payload.ipaddr ) {
							vm.printSystem(payload.ipaddr + " is now a node");
							break;
						}
						vm.printSystem("New Peer Discovered: " + payload.ipaddr);
						console.log(payload);
						var ps = new WebSocket("wss://" + payload.ipaddr + ":8080");
						var peer = {};
						peer.socket = {
						    events:{
						        open:function(event){
									console.log("Connected to " + payload.ipaddr);
								},
						        onmessage:function(event){
						            var payload = JSON.parse(event.data);
						            if ( ps.readyState === 1 ) {
						                switch ( payload.type ) {
											case "g2g":
												vm.printSystem("Added to peer list: " + payload.ipaddr);
											break;
						                    default:
						                }
						            }
						        },
						        onerror:function(event){},
						        close:function(event){}
						    },
						    send:function(data){
						        var payload = JSON.stringify(data);
						        if ( ps.readyState === 1 ) {
						            ps.send(payload);
						            return true;
						        }
						        return false;
						    }
						};
						ps.addEventListener("open", peer.socket.events.open);
						ps.addEventListener("close", peer.socket.events.close);
						ps.addEventListener("message", peer.socket.events.onmessage);
						ps.addEventListener("error", peer.socket.events.onerror);
					break;
                    case "newAuthedConnection":
						vm.printSystem("Welcome Back");
						if ( !document.cookie ) {
							document.cookie = payload.sid;
						}
                    break;
                    case "newAnonymousConnection":
                        vm.printSystem("Who goes there?");
                    break;
                    case "registerSuccessful":
                        vm.printSystem("Registration Complete");
                    break;
                    case "registerFailed":
                        vm.printError("Registration Failed");
                    break;
                    case "loginSuccessful":
						document.cookie = payload.sid;
						console.log(document.cookie);
                        vm.printSystem("Login Successful");
                    break;
                    case "loginFailed":
                        vm.printError("Login Failed");
                    break;
                    case "logoutSuccessful":
						document.cookie = "";
                        vm.printSystem("Logout Successful");
                    break;
                    case "logoutFailed":
                        vm.printError("Logout Failed");
                    break;
					case "privateSubscribeSuccessful":
						vm.addTab("@"+payload.content.user);
						vm.selectTab("@"+payload.content.user);
					break;
                    case "subscribeNewSuccessful":
                      vm.addTab(payload.content.channel);
                      vm.selectTab(payload.content.channel);
					  vm.userlist =  payload.content.userlist;
                      vm.printSystem("Created channel #" + payload.content.channel);
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
                    case "purgeSuccessful":
                        vm.printSystem("Purge Successful");
                    break;
                    case "purgeFailed":
                        vm.printError("Purge Failed");
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
                    default:
                }
            }
        },
        onerror:function(event){},
        close:function(event){
			vm.tabs.forEach(function(tab){
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
    send:function(data){
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
 */
ashita.transmit = {
	auth:function(){
		ashita.socket.send({
			type:"auth",
			ipaddr:ashita.ipAddr,
			sid:document.cookie
		});
	},
	userlist:function(channel){
		ashita.socket.send({
            type:"userlist",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
			content:{
                channel:channel
            }
        });
	},
    register:function(username, password){
        ashita.socket.send({
            type:"register",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                username:username,
                password:password
            }
        });
    },
    login:function(username, password){
        ashita.socket.send({
            type:"login",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                username:username,
                password:password
            }
        });
    },
    logout:function(){
        ashita.socket.send({
            type:"logout",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{}
        });
    },
	private:function(user){
        ashita.socket.send({
            type:"private",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                user:user
            }
        });
    },
	privateMessage:function(user){
        ashita.socket.send({
            type:"privateMessage",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                user:user
            }
        });
    },
    subscribe:function(channel){
        ashita.socket.send({
            type:"subscribe",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                channel:channel
            }
        });
    },
    unsubscribe:function(channel){
        ashita.socket.send({
            type:"unsubscribe",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                channel:channel
            }
        });
    },
    purge:function(channel){
        ashita.socket.send({
            type:"purge",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                channel:channel
            }
        });
    },
    message:function(channel, message){
        ashita.socket.send({
            type:"message",
			ipaddr:ashita.ipAddr,
			sid:document.cookie,
            content:{
                channel:channel,
                text:message
            }
        });
    }
};
