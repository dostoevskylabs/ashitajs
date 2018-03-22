/* eslint-disable no-console */
"use strict";
const color     = require("./color.js");
const getTime   = () => Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", second: "numeric"}).format( Date.now() );
//const verbosity = {};

const NOTICE  = Symbol("NOTICE");
const WARN    = Symbol("WARN");
const INFO    = Symbol("INFO");
const DEBUG   = Symbol("DEBUG");
const ERROR   = Symbol("ERROR");

const verbosity = {
  [NOTICE]  : false,
  [WARN]    : false,
  [INFO]    : false,
  [DEBUG]   : false,
  [ERROR]   : false
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
  static notice ( ...message ) { 
    if ( verbosity[NOTICE] ) {
      console.log( color.Green + `[NOTICE\t- ${getTime()}] `, ...message );
    }
  }

  static info ( ...message ) { 
    if ( verbosity[INFO] ) {
      console.info( color.White + `[INFO\t- ${getTime()}] `, ...message );
    }
  }   

  static warn ( ...message ) { 
    if ( verbosity[WARN] ) {
      console.log( color.Yellow + `[WARN\t- ${getTime()}] `, ...message );
    }
  }

  static debug ( ...message ) { 
    if ( verbosity[DEBUG] ) {     
      console.log( color.Blue + `[DEBUG\t- ${getTime()}] `, ...message );
    }
  } 

  static error ( ...message ) { 
    if ( verbosity[ERROR] ) {
      console.log( color.Red + `[ERROR\t- ${getTime()}] `, ...message );
    }
  }   

}

module.exports = Logger;