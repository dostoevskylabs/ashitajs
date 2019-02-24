const peerManager       = require("../peerManager");
const cli               = require("../../lib/ui");
let state               = 'public';
let peerId              = '';

// dis shit hacky
function handleInput( input ) {
  const commands = input.split(" ");

  switch ( commands[0] ) {
    case "/exit":
      peerManager.sendEndEvent();
      process.exit(0);
    break;

    case "/peers":
      let peers = peerManager.getPeers();
      cli.Panel.debug(`Active Peer Sessions\n${peers.join('\n')}`)

      
      cli.screens["Test"].clearValue();
      cli.screens["Test"].focus();    
    break;

    case "/whohas":
      peerManager.whoHas( commands[1] );

      cli.screens["Test"].clearValue();
      cli.screens["Test"].focus();        
    break;

    case "/join":
      peerManager.connectToPeer(commands[1], commands[2]);

      cli.screens["Test"].clearValue();
      cli.screens["Test"].focus();  
    break;

    case "/username":
      peerManager.setUsername( commands[1] );

      cli.screens["Test"].clearValue();
      cli.screens["Test"].focus();       
    break;

    case "/pm":
      let peer = peerManager.getPeerEntry( commands[1] );
      if ( peer ) {
        cli.Panel.notice( `Opened channel with ${commands[1]}` );

        state = 'private';
        peerId = commands[1];       
      } else {
        cli.Panel.notice(`Cannot locate peer`);
      }

      
      cli.screens["Test"].clearValue();
      cli.screens["Test"].focus(); 
    break;

    case '/public':
      cli.Panel.notice( `Closed private channel, speaking publically.`);
      state = 'public';
      peerId = '';

      cli.screens["Test"].clearValue();
      cli.screens["Test"].focus(); 
    break;

    default:
      // command initiated, but unrecognized
      if ( commands[0][0] == "/" ) {
        cli.Panel.notice('Unknown Command');
      } else {
        // an actual message
        if ( state === 'public' ) {
          cli.Panel.publicMessage( peerManager.getPeerId, peerManager.getUsername, input );
          peerManager.sendPublicMessage( peerManager.getUsername, input);
        } else {
          cli.Panel.privateMessage( peerId, peerManager.getUsername, input );
          peerManager.sendPrivateMessage( peerId, peerManager.getUsername, input);
        }        
      }
      
      cli.screens["Test"].clearValue();
      cli.screens["Test"].focus(); 
  }
}

module.exports = handleInput;
