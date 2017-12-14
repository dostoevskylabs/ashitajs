"use strict";
const color             = require("./color.js");
const blessed           = require("blessed");
const getTime           = () => Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric"}).format( Date.now() );
const screens           = {};
const screen            = blessed.screen({ smartCSR:true });


const theme = new function(){
  this.bgcolor = 16;
  this.fgcolor = 255;
  this.border = 234;
  this.overlay = 243;
  this.scrollbg = 255;

  this.defaults = {
    box: {
      focus:{
        border: {
          fg: this.overlay,
        }
      },
      scrollbar: {
        bg: this.scrollbg,
      },
      fg: this.fgcolor,
      bg: this.bgcolor,
      label: {
        bg: this.bgcolor
      },
      border: {
        bg: this.bgcolor,
        fg: this.border,
      }
    }
  }

  this.templates = {
    box: {
      style: {
        ...this.defaults.box,
      },
      border: {
        type: "line"
      },
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    menu: {
      top:0,
      left:0,
      right:0,
      height:3,
      style: {
        fg: this.fgcolor,
        bg: this.bgcolor,    
      }
    },
    log: {
      padding: 1,
      scrollbar: true,
      scrollable: true,
      scrollonInput: true,
      mouse: true,
      keys: true,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      border: {
        type: "line"
      },
      style: {
        ...this.defaults.box
      }
    }
  }
};




screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});


screens["ashitajs"] = blessed.box({
  ...theme.templates.box,
  parent: screen,
  mouse:true,
  keys:true,
  border: {
    type: "bg"
  }
});

screens["menu"] = blessed.Listbar({
  ...theme.templates.menu,
  autoCommandkeys:true,
  parent: screens["ashitajs"],
  mouse:true,
  keys:true,      
  items: ["Dashboard", "NodeList", "AddNode"],
});


screens["Dashboard"] = blessed.box({
  ...theme.templates.box,
  parent: screens["ashitajs"],
  mouse:true,
  keys:true,
  
  top: 1,
});

screens["NodeList"] = blessed.box({
  ...theme.templates.box,
  parent: screens["ashitajs"],
  mouse:true,
  keys:true,
  label: "NodeList",
  top: 1,
});

screens["AddNode"] = blessed.box({
  ...theme.templates.box,
  parent: screens["ashitajs"],
  mouse:true,
  keys:true,
  label: "AddNode",
  top: 1,
});




screens["Peers"] = blessed.log({ //name, p, t, l, b, r, w, h
  ...theme.templates.log,
  parent: screens["Dashboard"],
  label: "Peers",
  left: undefined,
  width: 30,
});

screens["Log"] = blessed.log({ //name, p, t, l, b, r, w, h
  ...theme.templates.log,
  parent: screens["Dashboard"],
  label: "Log",
  top: "20%",
  right: screens["Peers"].width,
});


screens["Security"] = blessed.log({ //name, p, t, l, b, r, w, h   0, "40%", 0, 0, "45%", "20%"
  ...theme.templates.log,
  parent: screens["Dashboard"],
  label: "Security",
  width: "50%-" + screens["Peers"].width / 2,
  height: "20%",
});


screens["Debug"] = blessed.log({
  ...theme.templates.log,
  parent: screens["Dashboard"],
  label: "Debug",
  left: "50%-" + screens["Peers"].width / 2,
  right: screens["Peers"].width,
  height: "20%",
});

screens["nodeHost"] = blessed.Textbox({
  parent:screens["AddNode"],
  inputOnFocus:true,
  mouse:true,
  keys:true,
  label: "nodeHost",
  top: "center",
  left: "center",
  bottom: "center",
  right: "center",
  width: 35,
  height: 3,

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

screens["Dashboard"].setFront();
screen.render();

screens["menu"].on("select", function( event ) {
  screens[event.$.cmd.text].setFront();
});

class Logger {
  static drawNodes ( peers ) {
    // for ( let i = 0; i < peers.length; i++ ) {
    //   if ( i === 0 ) {
    //     ScreenManager.generateNode(peers[i], screens["NodeList"], 0, 0, 0, 0, 25, 8);
    //   } else if ( screens[peers[i-1]].left + screens[peers[i-1]].width >= screens["NodeList"].width - screens[peers[i-1]].width ) {
    //     ScreenManager.generateNode(peers[i], screens["NodeList"], screens[peers[i-1]].top + screens[peers[0]].height, 0, 0, 0, 25, 8);    
    //   } else {
    //     ScreenManager.generateNode(peers[i], screens["NodeList"], screens[peers[i-1]].top - 1, screens[peers[i-1]].left + screens[peers[0]].width, 0, 0, 25, 8);          
    //   }
    // }
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