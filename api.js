/**
 * ashita/core/API
 *
 * @package    ashita/core
 * @author     evolretsinis
 */
var moment=require('moment');
var crypto=require('crypto');
module.exports = {
  /**
  * Console Controller
  */
  consoleCtl:{
    printMessage:function printMessage( type, src, msg ) {
      var timestamp = moment().format("HH:mm:ss");
      console.log("("+ timestamp +") [" + type + "] " + src + ": " + msg );
    },
    printError:function printError( str ) {
      console.log(str);
    }
  },
  /**
   * ACL Controller
   */
  aclCtl:{
    init:function init() {
      this.ACL = new Object();
      this.ACL.allowedHosts = new Array();
    },
    getACL:function getACL() {
      return this.ACL;
    },
    addEntry:function addEntry( type, value ) {
      switch ( type ) {
        case "IP":
          this.ACL.allowedHosts.push(value);
        break;
      }
    },
    checkEntry:function checkEntry( type, value ) {
      switch ( type ) {
        case "IP":
          if ( this.ACL.allowedHosts.indexOf(value) !== -1 ) {
            return true;
          }
          return false;
        break;
      }
    },
    removeEntry:function removeEntry( peerIp ) {
      //delete this.ACL[peerIp];
    }
  }
};
