"use strict";
let config = {}

class ConfigDB {
    static getConfigValue ( setting ) {
        if ( config[setting] ) return config[setting];
        return false;
    }

    static setConfigValue( setting, value ) {
        config[setting] = value;
    }
}

module.exports = ConfigDB;