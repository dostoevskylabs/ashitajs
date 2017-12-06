const blessed = require("blessed");
const screen = blessed.screen({ smartCSR:true});
screen.title = "ashitajs";

const stuff = {
  screen : screen,

  debugScreen : blessed.log({
    label: "Debug",
    top: 0,
    left: 0,
    width: "90%",
    height: "20%",

    border: {
      type: "line"
    },

    style: {
      fg: "white",
      border: {
        fg: "#f0f0f0"
      }
    }
  }),

  securityScreen : blessed.log({
    label: "Security",
    top: '20%',
    left: 0,
    width: "90%",
    height: "20%",

    border: {
      type: "line"
    },

    style: {
      fg: "white",
      border: {
        fg: "#f0f0f0"
      }
    }
  }),  

  logScreen : blessed.log({
    label: "Log",
    bottom: 0,
    left: 0,
    width: "90%",
    height: "60%",

    border: {
      type: "line"
    },

    style: {
      fg: "white",
      border: {
        fg: "#f0f0f0"
      }
    }
  }),

  peerScreen : blessed.log({
    label: "Active Peers",
    top: 0,
    right: 0,
    width: "10%",
    height: "100%",

    border: {
      type: "line"
    },

    style: {
      fg: "white",
      border: {
        fg: "#f0f0f0"
      }
    }
  })
}

screen.append(stuff.debugScreen);
screen.append(stuff.securityScreen);
screen.append(stuff.logScreen);
screen.append(stuff.peerScreen);

screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});
screen.render();

module.exports = stuff;