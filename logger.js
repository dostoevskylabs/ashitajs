/**
 * ashita/core/Logger
 *
 * @package    ashita/core
 * @author     dostoevskylabs
 * @author     mooglesonthecob
 */
/* eslint-disable no-console */
"use strict";
const cli               = require('./cli.js');
const color     = require("./color.js");
const getTime   = () => Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric"}).format( Date.now() );
//const verbosity = {};

const NOTICE = Symbol("NOTICE");
const WARN = Symbol("WARN");
const INFO = Symbol("INFO");
const DEBUG = Symbol("DEBUG");
const ERROR = Symbol("ERROR");

const verbosity = {
  [NOTICE]: false,
  [WARN]  : false,
  [INFO]  : false,
  [DEBUG] : false,
  [ERROR] : false
};

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

  static setVerbosity ( ...symbols ) {
    for ( const level of symbols ) {
      verbosity[level] = true;

    }
  }

  static clearPeers() {
    cli.peerScreen.clearItems();
  }

  static peer ( message ) {
    if ( verbosity[INFO] ) {
      cli.peerScreen.addItem( message );
    }   
  }
  
  static quit( message ) {
    cli.logScreen.add( color.Red + `[${getTime()}] ` + message );
  }

  static notice ( ...message ) { 
    if ( verbosity[NOTICE] ) {
      cli.logScreen.add( color.Green + `[${getTime()}] `, ...message );
    }
  }

  static message( message ) {
    cli.chatScreen.add( color.White + `[${getTime()}] ` + message );
  }

  static security ( ...message ) {
    if ( verbosity[NOTICE] ) {
      cli.securityScreen.add(color.Red + `[${getTime()}] `, ...message );
    }   
  }

  static info ( ...message ) { 
    if ( verbosity[INFO] ) {
      cli.logScreen.add( color.Blue + `[${getTime()}] `, ...message );
    }
  }   

  static warn ( ...message ) { 
    if ( verbosity[WARN] ) {
      cli.logScreen.add( color.Yellow + `[${getTime()}] `, ...message );
    }
  }

  static debug ( ...message ) { 
    if ( verbosity[DEBUG] ) {     
      cli.debugScreen.add( color.Yellow + `[${getTime()}] `, ...message );
    }
  } 

  static error ( ...message ) { 
    if ( verbosity[ERROR] ) {
      cli.debugScreen.add( color.Red + `[${getTime()}] `, ...message );
    }
  }
}

module.exports = Logger;