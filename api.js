/**
 * ashita/core/API
 *
 * @package    ashita/core/API
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
      this.ACL = new Array();
    },
    getACL:function getACL() {
      return this.ACL;
    },
    addEntry:function addEntry( ipaddr ) {
      this.ACL.push(ipaddr);
    },
    checkEntry:function checkEntry( ipaddr ) {
      if ( this.ACL.indexOf(ipaddr) !== -1 ) {
        return true;
      }
      return false;
    },
    removeEntry:function removeEntry( peerIp ) {
      delete this.ACL[peerIp];
    }
  },
  /**
  * Session Controller
  */
  sessionCtl:{
      init:function init() {
        this.activeSessions = new Object();
      },
      generateId:function generateId() {
        return crypto.randomBytes(8).toString('hex');
      },
      getValue:function getValue( sessionid, field ) {
        if (  this.activeSessions[sessionid] ) {
          return this.activeSessions[sessionid][field];
        }
        return false;
      },
      setValue:function setValue( sessionid, field, value) {
        if ( this.activeSessions[sessionid] ) {
          this.activeSessions[sessionid][field] = value;
          return true;
        }
        return false;
      },
      getObject:function getObject( sessionid ) {
        if ( this.activeSessions[sessionid] ) {
          return this.activeSessions[sessionid];
        }
        return false;
      },
      setObject:function setObject( sessionData )	{
        if ( !this.activeSessions[sessionData.sessionid] ) {
          this.activeSessions[sessionData.sessionid] = {
            "username":sessionData.username,
            "ipaddr":sessionData.ipaddr,
            "authenticated":sessionData.authenticated
          };
          return true;
        }
        return false;
      },
      destroyObject:function( sessionid )	{
        if ( this.activeSessions[sessionid] ) {
          delete this.activeSessions[sessionid];
          return true;
        }
        return false;
      }
  },
  /**
  * Peer Controller
  */
  peerCtl:{
      init:function init() {
        this.activePeers = new Array();
      },
      getPeers:function getPeers() {
        return this.activePeers;
      },
      addPeer:function addPeer( ipaddr ) {
        this.activePeers.push(ipaddr);
      },
      checkPeer:function checkPeer( ipaddr ) {
        if ( this.activePeers[ipaddr] ) {
          return true;
        }
        return false;
      },
      removePeer:function removePeer( ipaddr ) {
        delete this.activePeers[ipaddr];
      }
  }
};
