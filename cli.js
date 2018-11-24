"use strict";
const color             = require("./color.js");
const blessed           = require("blessed");
const getTime           = () => Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric"}).format( Date.now() );
const screens           = {};
const screen            = blessed.screen({
  smartCSR:true,
  autoPadding: true,
  useBCE: true,
  cursor: {
    artificial: true,
    blink: true,
    shape: 'underline'
  },
  fullUnicode: true,
  dockBorders: true
});




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

screens["Log"] = blessed.log({
  ...theme.templates.log,
  parent: screen,
  label: "Log",
  top: 0,
  height: "90%",
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true
});

screens["Test"] = blessed.Textbox({
  ...theme.templates.box,
  parent: screen,
  label: "Test",
  bottom: 0,
  top: "90%",
  height: "8%",
  inputOnFocus:true,
  mouse: true,
  keys:true,
});

//screen.program.disableMouse();
/**
screens["Log"].on('click', function(evt){
  screen.program.disableMouse();
});

screens["Test"].on('click', function(evt){
  screen.program.enableMouse();
});**/

screens["Test"].focus();
screen.render();


class Panel {
  static addPeer ( peer ) {
    //screens["Peers"].addItem ( color.Green + peer + color.Reset );
  }

  static notice ( ...message ) { 
    screens["Log"].add(color.White + `[${getTime()}] ` + color.Green + `[NOTICE]` + color.White, ...message, color.Reset);
    //console.log( color.Green + `[NOTICE\t- ${getTime()}] `, ...message );
    
  }

  static alert ( ...message ) { 
    screens["Log"].add(color.White + `[${getTime()}] ` + color.Red + `[ALERT]` + color.White, ...message, color.Reset);
    //console.log( color.Green + `[NOTICE\t- ${getTime()}] `, ...message );
    
  }

  static publicMessage( peerId, username, message ) {
    screens["Log"].add(color.White + `[${getTime()}] ` + color.Green + `[PUBLIC] ` + color.White + `<${username}> ${message}` + color.Reset);
  }

  static privateMessage( peerId, username, message ) {
    screens["Log"].add(color.White + `[${getTime()}] ` + color.Magenta + `[PRIVATE ==> ${peerId}] ` + color.White + `${message}` + color.Reset);
  }

  static privateMessageRecieved( peerId, username, message ) {
    screens["Log"].add(color.White + `[${getTime()}] ` + color.Magenta + `[PRIVATE <== ${peerId}] ` + color.White + `${message}` + color.Reset);
  }

  static message ( ...message ) { 
    screens["Log"].add(color.White + `[${getTime()}]`, ...message, color.Reset);
    //console.info( color.White + `[INFO\t- ${getTime()}] `, ...message );
  }   

  static warn ( ...message ) { 
    //console.log( color.Yellow + `[WARN\t- ${getTime()}] `, ...message );
  }

  static security ( ...message ) {
    screens["Log"].add(color.White + `[${getTime()}] ` + color.Green + `[SECURITY]` + color.White, ...message, color.Reset);
  }

  static debug ( ...message ) {
    screens["Log"].add(color.White + `[${getTime()}] ` + color.Blue + `[DEBUG]` + color.White, ...message, color.Reset);
    //console.log( color.Blue + `[DEBUG\t- ${getTime()}] `, ...message );
  } 

  static error ( ...message ) { 
    //console.log( color.Red + `[ERROR\t- ${getTime()}] `, ...message );
  }
}

module.exports = {
  "Panel"  : Panel,
  "screens" : screens
};