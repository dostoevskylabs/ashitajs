"use strict";
const color             = require("./color.js");
const getTime           = () => Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric"}).format( Date.now() );


class Logger {
  static notice ( ...message ) { 
    console.log( color.Green + `[NOTICE\t- ${getTime()}] `, ...message );
    
  }

  static info ( ...message ) { 
    console.info( color.White + `[INFO\t- ${getTime()}] `, ...message );
  }   

  static warn ( ...message ) { 
    console.log( color.Yellow + `[WARN\t- ${getTime()}] `, ...message );
  }

  static debug ( ...message ) {
    console.log( color.Blue + `[DEBUG\t- ${getTime()}] `, ...message );
  } 

  static error ( ...message ) { 
    console.log( color.Red + `[ERROR\t- ${getTime()}] `, ...message );
  }
}

module.exports = {
"Logger"  : Logger,
};