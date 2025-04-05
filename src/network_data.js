import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { getClientSourcesOfNetwork, webConnections } from "./sockets/frontend_sockets.js";
import { getDataStreamsForNetwork } from "./service/data/data_stream.js";

export var syncedNetworkData = {};

export const SYNCED_COMPUTERS = {name: "computers", getter: async (net) => net.computers};
export const SYNCED_PACKAGES = {name: "packages", getter: async (net) => net.config.packages};
export const SYNCED_SOURCES = {name: "sources", getter: async (net) => getClientSourcesOfNetwork(net.networkId)};
export const CONNECTED_COMPUTERS_CHART = {name: "connected_computers_chart", getter: async (net) => net.computerConnectedCountChartData};
export const DATA_SOURCES = {name: "data_sources", getter: async (net) => {
    var sources = getDataStreamsForNetwork(net);
    var result = {};
    for (var source of Object.keys(sources)) {
        result[source] = {
            name: source,
            subscribers: sources[source].subscribers.length,
        };
    }
    return result;
}};

export const dataRequestHandlers = {
    "computers": SYNCED_COMPUTERS,
    "packages": SYNCED_PACKAGES,
    "sources": SYNCED_SOURCES,
    "connected_computers_chart": CONNECTED_COMPUTERS_CHART,
    "data_sources": DATA_SOURCES,
}

export class SyncedNetwork {
    constructor(networkConfig, computerData, networkId) {
        this.config = networkConfig;
        this.computers = computerData;
        this.networkId = networkId;

        this.computerConnectedCountChartData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.computerConnectedCountTicker = setInterval(() => {
            this.computerConnectedCountChartData.shift();
            this.computerConnectedCountChartData.push(this.computerConnectedCountChartData[this.computerConnectedCountChartData.length - 1]);
            this.setChanged(CONNECTED_COMPUTERS_CHART);
        }, 1000 * 30);
    }

    async setChanged(group) {
        networkConfigFile[this.networkId] = this.config;
        networkComputersFile[this.networkId] = this.computers;

        if (group.getter(this) == null) {
            console.log("Unable to set group " + group + " as changed, it does not exist in the network data");
            return;
        }

        for (var connection of webConnections) {
            if (connection.networkId == this.networkId) {
                connection.socket.send(JSON.stringify({
                    type: "data_content",
                    source: group.name,
                    content: await group.getter(this),
                }));
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
        networkComputersFile[networkId][networkComputer].substatus = {};
    }
}
createNetworksForFileData();

function createNetworksForFileData() {
    for (var networkId of Object.keys(networkTokens)) {
        syncedNetworkData[networkId] = new SyncedNetwork(networkConfigFile[networkId], networkComputersFile[networkId], networkId);
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