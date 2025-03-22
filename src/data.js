import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { webConnections } from "./sockets.js";

export var syncedNetworkData = {};

export const SYNCED_CONFIG = "data";
export const SYNCED_COMPUTERS = "computers";

class SyncedNetworkData {
    constructor(networkConfig, computerData, networkId) {
        this.config = networkConfig;
        this.computers = computerData;
        this.networkId = networkId;
    }

    setChanged(group) {
        networkConfigFile[this.networkId] = this.config;
        networkComputersFile[this.networkId] = this.computers;

        for (var connection in webConnections) {
            if (connection.networkId == this.networkId) {
                var dataToSend = {};
                dataToSend[group] = this[group];
                connection.socket.send({
                    type: "synced_network_data_change",
                    content: dataToSend
                });
            }
        }

        saveDataFiles();
    }
}

export function readDataFile(src) {
    if (existsSync("./run/" + src)) {
        return JSON.parse(readFileSync("./run/" + src));
    } else {
        console.log(src, "File does not exist, reverting to defaults");
        var content = readFileSync("./defaults/" + src);
        if (!existsSync("./run/")) {
            mkdirSync("./run/");
        }
        writeFileSync("./run/" + src, content);
        return content;
    }
}

export function saveDataFile(src, data) {
    writeFileSync("./run/" + src, JSON.stringify(data, null, 2));
}

export var networkTokens = readDataFile("networks.json");
var networkConfigFile = readDataFile("network_data.json");
var networkComputersFile = readDataFile("network_computers.json");

verifyNetworkIntegrity();
for (var networkId of Object.keys(networkTokens)) {
    for (var networkComputer in networkComputersFile[networkId]) {
        networkComputersFile[networkId][networkComputer].connectedState = false;
        networkComputersFile[networkId][networkComputer].ferretState = null;
    }
}
createNetworksForFileData();

function createNetworksForFileData() {
    for (var networkId of Object.keys(networkTokens)) {
        syncedNetworkData[networkId] = new SyncedNetworkData(networkConfigFile[networkId], networkComputersFile[networkId], networkId);
    }
}

function verifyNetworkIntegrity() {
    var changed = false;
    for (var networkId in networkTokens) {
        if (!networkConfigFile[networkId]) {
            console.log("Network was partially missing! Adding data entry, however git will default to testing");
            networkConfigFile[networkId] = {
                default_source: {
                    type: "github",
                    url: "https://raw.githubusercontent.com/ferretsys/TestNetSource/refs/heads/main/"
                },
                packages: {}
            };
            changed = true;
        }
        if (!networkComputersFile[networkId]) {
            console.log("Network was partially missing! Adding computers entry");
            networkComputersFile[networkId] = {
            };
            changed = true;
        }
    }    
    if (changed) {
        saveDataFile("network_computers.json", networkComputersFile);    
        saveDataFile("network_data.json", networkConfigFile);
    }
}

function saveDataFiles() {
    saveDataFile("network_computers.json", networkComputersFile);    
    saveDataFile("network_data.json", networkConfigFile);
}