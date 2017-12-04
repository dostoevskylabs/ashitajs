/**
 * ashita/API
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const color           = require('./color.js');
let logLevel          = true;

class Logger {
  static setLogLevel( level ) {
    logLevel = level;
  }

  static notice ( message ) { 
    if ( logLevel ) {
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "numeric", second: "numeric"
      }).format( Date.now() );   
      
      console.log( color.Green + `[NOTICE - ${time}] ${message}` );
    }
  }

  static info ( message ) { 
    if ( logLevel ) {
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "numeric", second: "numeric"
      }).format( Date.now() );   
      
      console.log( color.White + `[INFO - ${time}] ${message}` );
    }
  }   

  static warn ( message ) { 
    if ( logLevel ) {
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "numeric", second: "numeric"
      }).format( Date.now() );   
      
      console.log( color.Yellow + `[WARN - ${time}] ${message}` );
    }
  }

  static debug ( message ) { 
    if ( logLevel ) {
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "numeric", second: "numeric"
      }).format( Date.now() );   
      
      console.log( color.Blue + `[DEBUG - ${time}] ${message}` );
    }
  } 

  static error ( message ) { 
    if ( logLevel ) {
      const time = new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "numeric", second: "numeric"
      }).format( Date.now() );   
      
      console.log( color.Red + `[ERROR - ${time}] ${message}` );
    }
  }   
  
}
module.exports = Logger;