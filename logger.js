/**
 * ashita/API
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 */
"use strict";
const color           = require('./color.js');
let logLevel          = true;
/*

const NOTICE = Symbol("NOTICE");
const WARN = Symbol("WARN");
const INFO = Symbol("INFO");
const DEBUG = Symbol("DEBUG");
const ERROR = Symbol("ERROR");
let LEVELS = {NOTICE: false, WARN: false};


class Logger {
  static get NOTICE () {
    return NOTICE;
  }
  static get WARN () {
    return WARN;
  }
  static get INFO () {
    return INFO;
  }
  static get DEBUG () {
    return DEBUG;
  }
  static get ERROR () {
    return ERROR;
  }
  static setLogLevel (...levels) {

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
*/

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