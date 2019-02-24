const cli = require("../ui");

let db = [];
let exitCondition = false;

class Manifest {
    static addEntry ( hash, publicKey ) {
        db.map( (entry) => {
            if ( entry.hash === hash ) exitCondition = true;
        });

        if ( !exitCondition ) {
            db.push({
                index: db.length,
                hash,
                publicKey,
                prevHash : Manifest.getPrevBlockHash,
            });

            // send entry to peers     
        }

        exitCondition = false;
    }

    static get getPrevBlockHash () {
        return db[db.length - 1] ? db[db.length - 1].hash : null;
    }

    static get getManifest () {
        return db;
    }

    static removeEntry ( publicKeyHash ) {
        for ( let i = 0; i < db.length; i++ ) {
            if ( db[i].publicKey === publicKeyHash ) {
                let newPrevHash = db[i].prevHash;
                delete ( db[i] );
                db[i+1].prevHash = newPrevHash;
                // send update to peers
            }
        }
    }

    static recvManifest ( manifest ) {
        for ( let i = 0; i < manifest.length; i++ ) {
            Manifest.addEntry( manifest[i].hash, manifest[i].publicKey );
        }

        cli.Panel.debug( "new manifest: ", db);
    }

    static distribute ( test ) {
        test.send({
            type : "manifest",
            content : {
                db : this.db
            }
        })
    }

    static getPublicKeyOfPeer( peerId ) {
        for ( let i = 0; i < db.length; i++ ) {
            if ( db[i].hash === peerId ) return db[i].publicKey;
        }
    }

}

module.exports = Manifest;