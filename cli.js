const blessed = require("blessed");
const screen = blessed.screen({
  smartCSR:true
});
screen.title = "ashitajs";
const bgcolor = 16;
const border = 234;
const overlay = 243;

const stuff = {
  screen : screen,
  debugScreen : blessed.log({
    parent:screen,
    padding: 1,
    scrollbar: true,
    scrollable: true,
    scrollonInput: true,
    mouse:true,
    keys:true,
    label: "Debug",
    top: 0,
    left: 0,
    width: "45%",
    height: "20%",
  
    border: {
      type: "line"
    },
  
    style: {
      focus:{
        border: {
          fg: overlay,
        },
      },
      scrollbar: {
        bg: 255,
      },
      fg: "white",
      bg: bgcolor,
      label: {
        bg:bgcolor
      },
      border: {
        bg: bgcolor,
        fg: border
      }      
    }
  }),

  securityScreen : blessed.log({
    parent:screen,
    padding: 1,
    label: "Security",
    scrollbar: true,
    scrollable: true,
    scrollonInput: true,
    mouse:true,
    keys:true,
    selectedBg: 'green',
    search:true,
    top: 0,
    left: "45%",
    width: "45%+2",
    height: "20%",

    border: {
      type: "line"
    },

    style: {
      focus:{
        border: {
          fg: overlay,
        },
      },
      scrollbar: {
        bg: 255
      },
      fg: "white",
      bg: bgcolor,
      label: {
        bg:bgcolor
      },
      border: {
        bg: bgcolor,
        fg: border
      }        
    }
  }),  

  logScreen : blessed.log({
    parent:screen,
    padding: 1,
    label: "Output",
    scrollbar: true,
    scrollable: true,
    scrollonInput: true,
    mouse:true,
    keys:true,
    selectedBg: 'green',
    search:true,
    top: '20%',
    bottom: 0,
    left: 0,
    width: "90%+1",
    height: "40%",

    border: {
      type: "line"
    },

    style: {
      focus:{
        border: {
          fg: overlay,
        },
      },
      scrollbar: {
        bg: 255
      },
      fg: "white",
      bg: bgcolor,
      label: {
        bg:bgcolor
      },      
      border: {
        bg: bgcolor,
        fg: border
      }  
    }
  }),

  peerScreen : blessed.list({
    parent:screen,
    padding: 1,
    label: "Active Peers",
    scrollbar: true,
    scrollable: true,
    scrollonInput: true,
    mouse:true,
    keys:true,
    selectedBg: 'black',
    fg: 255,
    search:true,
    top: 0,
    right: 0,
    width: "10%",
    height: "100%",

    border: {
      type: "line"
    },

    style: {
      focus:{
        border: {
          fg: overlay,
        },
      },
      scrollbar: {
        bg: 255
      },
      fg: "white",
      bg: bgcolor,
      label: {
        bg:bgcolor
      },      
      border: {
        bg: bgcolor,
        fg: border
      }        
    }
  }),
  
  chatScreen : blessed.log({
    parent:screen,
    padding: 1,
    label: "Chat Log",
    scrollbar: true,
    scrollable: true,
    scrollonInput: true,
    mouse:true,
    keys:true,
    selectedBg: 'black',
    fg: 255,
    search:true,
    top: "60%",
    left: 0,
    width: "90%+1",
    height: "40%",

    border: {
      type: "line"
    },

    style: {
      focus:{
        border: {
          fg: overlay,
        },
      },
      scrollbar: {
        bg: 255
      },
      fg: "white",
      bg: bgcolor,
      label: {
        bg:bgcolor
      },      
      border: {
        bg: bgcolor,
        fg: border
      }        
    }
  })
}


screen.append(stuff.debugScreen);
screen.append(stuff.securityScreen);
screen.append(stuff.logScreen);
screen.append(stuff.peerScreen);
screen.append(stuff.chatScreen);


screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});

stuff.debugScreen.on('click', function(){
  stuff.debugScreen.focus();
})
stuff.logScreen.on('click', function(){
  stuff.logScreen.focus();
})
stuff.peerScreen.on('click', function(){
  stuff.peerScreen.focus();
});
stuff.securityScreen.on('click', function(){
  stuff.securityScreen.focus();
});
stuff.chatScreen.on('click', function(){
  stuff.chatScreen.focus();
});
screen.enableMouse();
screen.enableKeys();
screen.render();

module.exports = stuff;