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
    printMessage:function printMessage( usr, msg ) {
      var timestamp = moment().format("HH:mm:ss");
      console.log("["+ timestamp +"] <" + usr + ">: " + msg );
    },
    printSystem:function printSystem( str )	{
      var timestamp = moment().format("HH:mm:ss");
      console.log("["+ timestamp +"] @System: " + str);
    },
    printError:function printError( str ) {
      var timestamp = moment().format("HH:mm:ss");
      console.log("["+ timestamp +"] !!! Error !!!: " + str);
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
            "channels":sessionData.channels,
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
  * Channel Controller
  */
  channelCtl:{
      init:function init() {
        this.activeChannels = new Object();
        this.activeChannels["System"] = {
          "userlist":['System'],
          "owner":"System",
          "groups":['System']
        };
      },
      getValue:function getValue( channel, field ) {
        if ( this.activeChannels[channel] ) {
          return this.activeChannels[channel][field];
        }
        return false;
      },
      setValue:function setValue( channel, field, value ) {
        if ( this.activeChannels[chanenl] ) {
          this.activeChannels[channel][field] = value;
          return true;
        }
        return false;
      },
      getObject:function getObject( channel )	{
        if ( this.activeChannels[channel] ) {
          return this.activeChannels[channel];
        }
        return false;
      },
      setObject:function setObject( channelData )	{
        if ( !this.activeChannels[channelData.name] ) {
          this.activeChannels[channelData.name] = {
            "userlist":channelData.userlist,
            "owner":channelData.owner,
            "groups":channelData.groups,
            "messages":channelData.messages
          };
          return true;
        }
        return false;
      },
      destroyObject:function destroyObject( channelData )	{
        if ( this.activeChannels[channelData.name] ) {
          delete this.activeChannels[channelData.name];
          return true;
        }
        return false;
      },
      join:function join( channelData ) {
        if ( this.activeChannels[channelData.name]['userlist'].indexOf( channelData.username ) !== -1 ) {
          return true;
        }
        return false;
      },
      exit:function exit( channelData ) {
        if ( this.activeChannels[channelData]['userlist'].indexOf( channelData.username ) === -1 ) {
          return true;
        }
        return false;
      },
      message:function message( channelData )	{
        if ( this.activeChannels[channelData.name] ) {
          this.activeChannels[channelData.name]['messages'].push( channelData );
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
      addPeer:function addPeer( peerIp ) {
        this.activePeers.push(peerIp);
      },
      checkPeer:function checkPeer( peerIp ) {
        if ( this.activePeers[peerIp] ) {
          return true;
        }
        return false;
      },
      removePeer:function addPeer( peerIp ) {
        delete this.activePeers[peerIp];
      }
  }
};
