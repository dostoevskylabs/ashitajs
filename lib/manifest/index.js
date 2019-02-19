const cli = require("../ui");

let db = [];

class Manifest {
    static addEntry ( hash, publicKey ) {
        db.push({
            index: db.length,
            hash,
            publicKey,
            prevHash : Manifest.getPrevBlockHash,
        });
    }

    static get getPrevBlockHash () {
        return db[db.length - 1] ? db[db.length - 1].hash : null;
    }

    static get getManifest () {
        return db;
    }

    static updateEntry () {

    }

    static removeEntry ( publicKeyHash ) {
        delete ( db[publicKeyHash] );
    }

    static recvManifest ( manifest ) {
        db = db.length < manifest.length ? manifest : db;
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


}

module.exports = Manifest;