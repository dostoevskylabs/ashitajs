"use strict";
const color             = require("./color.js");
const blessed           = require("blessed");
const getTime           = () => Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric"}).format( Date.now() );
const screens           = {};
const theme             = {
  bgcolor:16,
  border:234,
  overlay:243
};

const screen            = blessed.screen({
  smartCSR:true
});

screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});

class ScreenManager extends blessed { 
  static buildMenu ( name, p ) {
    screens[name] = this.Listbar({
      autoCommandpeers:true,
      parent:p,
      mouse:true,
      peers:true,      
      top:0,
      left:0,
      right:0,
      height:3,
      width:"100%",
      style: {
        fg: "white",
        bg: theme.bgcolor,    
      }      
    });
  }

  static generateList ( name, p, t, l, b, r, w, h ) {
    screens[name] = this.list({
      parent:p,
      padding: 1,
      label: name,
      scrollbar: true,
      scrollable: true,
      scrollonInput: true,
      mouse:true,
      peers:true,
      selectedBg: "black",
      fg: 255,
      search:true,
      top: t,
      left: l,
      right: r,
      bottom: b,
      width: w,
      height: h,

      border: {
        type: "line"
      },

      style: {
        focus:{
          border: {
            fg: theme.overlay,
          },
        },
        scrollbar: {
          bg: 255
        },
        fg: "white",
        bg: theme.bgcolor,
        label: {
          bg: theme.bgcolor
        },      
        border: {
          bg: theme.bgcolor,
          fg: theme.border
        }        
      }    
    });
  }

  static generateLog ( name, p, t, l, b, r, w, h ) {
    screens[name] = this.log({
      parent:p,
      padding: 1,
      scrollbar: true,
      scrollable: true,
      scrollonInput: true,
      mouse:true,
      peers:true,
      label: name,
      top: t,
      left: l,
      bottom: b,
      right: r,
      width: w,
      height: h,
    
      border: {
        type: "line"
      },
    
      style: {
        focus:{
          border: {
            fg: theme.overlay,
          },
        },
        scrollbar: {
          bg: 255,
        },
        fg: "white",
        bg: theme.bgcolor,
        label: {
          bg: theme.bgcolor
        },
        border: {
          bg: theme.bgcolor,
          fg: theme.border
        }      
      }
    });  
  }

  static generateNode ( name, p, t, l, b, r, w, h ) {
    screens[name] = this.box({
      parent:p,
      padding: 1,
      scrollbar: true,
      scrollable: true,
      scrollonInput: true,
      mouse:true,
      peers:true,
      label: name,
      top: t,
      left: l,
      bottom: b,
      right: r,
      width: w,
      height: h,
    
      border: {
        type: "line"
      },
    
      style: {
        focus:{
          border: {
            fg: theme.overlay,
          },
        },
        scrollbar: {
          bg: 255,
        },
        fg: "white",
        bg: theme.bgcolor,
        label: {
          bg: theme.bgcolor
        },
        border: {
          bg: theme.bgcolor,
          fg: theme.border
        }      
      }
    });  
  }  

  static generateText ( name, p, t, l, b, r, w, h ) {
    screens[name] = this.Textbox({
      parent:p,
      inputOnFocus:true,
      mouse:true,
      peers:true,
      label: name,
      top: t,
      left: l,
      bottom: b,
      right: r,
      width: w,
      height: h,
    
      border: {
        type: "line"
      },
    
      style: {
        focus:{
          border: {
            fg: theme.overlay,
          },
        },
        fg: 255,
        bg: theme.bgcolor,
        label: {
          bg: theme.bgcolor
        },
        border: {
          bg: theme.bgcolor,
          fg: theme.border
        }      
      }
    });  
  }

  static generateScreen ( name, p, t, l, b, r, w, h ) {
    screens[name] = this.box({
      parent:p,
      mouse:true,
      peers:true,
      label: name,
      top: t,
      left: l,
      bottom: b,
      right: r,
      width: w,
      height: h,
    
      border: {
        type: "line"
      },
    
      style: {
        focus:{
          border: {
            fg: theme.overlay,
          },
        },
        scrollbar: {
          bg: 255,
        },
        fg: "white",
        bg: theme.bgcolor,
        label: {
          bg: theme.bgcolor
        },
        border: {
          bg: theme.bgcolor,
          fg: theme.border
        }      
      }
    });
  }
}

ScreenManager.generateScreen("ashitajs", screen, 0, 0, 0, 0, "100%", "100%");
ScreenManager.buildMenu("menu", screens["ashitajs"]);

screens["menu"].addItem("Dashboard");
screens["menu"].addItem("NodeList");
screens["menu"].addItem("AddNode");

ScreenManager.generateScreen("Dashboard", screens["ashitajs"], 2, 0, 0, 0, "100%-4", "92%");
ScreenManager.generateScreen("NodeList", screens["ashitajs"], 2, 0, 0, 0, 236, "92%");
ScreenManager.generateScreen("AddNode", screens["ashitajs"], "center", "center", "center", "center", 40, 10);

ScreenManager.generateLog("Debug", screens["Dashboard"], 0, 0, 0, 0, "40%", "20%");
ScreenManager.generateLog("Security", screens["Dashboard"], 0, "40%", 0, 0, "45%", "20%");
ScreenManager.generateLog("Log", screens["Dashboard"], "20%", 0, 0, "10%", "86%-3", "78%");
ScreenManager.generateList("Peers", screens["Dashboard"], 0, "85%", 0, 0, "15%-2", "98%");

ScreenManager.generateText("nodeHost", screens["AddNode"], "center", "center", "center", "center", 35, 3);

screens["Dashboard"].setFront();
screen.render();

screens["menu"].on("select", function( event ) {
  screens[event.$.cmd.text].setFront();
});



class Logger {
  static drawNodes ( peers ) {
    for ( let i = 0; i < peers.length; i++ ) {
      if ( i === 0 ) {
        ScreenManager.generateNode(peers[i], screens["NodeList"], 0, 0, 0, 0, 25, 8);
      } else if ( screens[peers[i-1]].left + screens[peers[i-1]].width >= screens["NodeList"].width - screens[peers[i-1]].width ) {
        ScreenManager.generateNode(peers[i], screens["NodeList"], screens[peers[i-1]].top + screens[peers[0]].height, 0, 0, 0, 25, 8);    
      } else {
        ScreenManager.generateNode(peers[i], screens["NodeList"], screens[peers[i-1]].top - 1, screens[peers[i-1]].left + screens[peers[0]].width, 0, 0, 25, 8);          
      }
    }
  }

  static addPeer ( peer ) {
    screens["Peers"].addItem ( color.Green + peer + color.Reset );
  }

  static notice ( ...message ) { 
    screens["Log"].add(color.Green + `[${getTime()}]`, ...message, color.Reset);
    //console.log( color.Green + `[NOTICE\t- ${getTime()}] `, ...message );
    
  }

  static info ( ...message ) { 
    screens["Log"].add(color.White + `[${getTime()}]`, ...message, color.Reset);
    //console.info( color.White + `[INFO\t- ${getTime()}] `, ...message );
  }   

  static warn ( ...message ) { 
    //console.log( color.Yellow + `[WARN\t- ${getTime()}] `, ...message );
  }

  static debug ( ...message ) {
    screens["Debug"].add(color.Blue + `[${getTime()}]`, ...message, color.Reset);
    //console.log( color.Blue + `[DEBUG\t- ${getTime()}] `, ...message );
  } 

  static error ( ...message ) { 
    //console.log( color.Red + `[ERROR\t- ${getTime()}] `, ...message );
  }
}

module.exports = {
"Logger"  : Logger,
"screens" : screens
};