import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

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

export var networks = readDataFile("networks.json");
export var networkData = readDataFile("network_data.json");
export var networkComputers = readDataFile("network_computers.json");

verifyDataIntegrity();
for (var networkId of Object.keys(networks)) {
    for (var networkComputer in networkComputers[networkId]) {
        networkComputers[networkId][networkComputer].connectedState = false;
    }
}

function verifyDataIntegrity() {
    var changed = false;
    for (var networkId in networks) {
        if (!networkData[networkId]) {
            console.log("Network was partially missing! Adding data entry, however git will default to testing");
            networkData[networkId] = {
                default_source: {
                    type: "github",
                    url: "https://raw.githubusercontent.com/ferretsys/TestNetSource/refs/heads/main/"
                },
                packages: {}
            };
            changed = true;
        }
        if (!networkComputers[networkId]) {
            console.log("Network was partially missing! Adding computers entry");
            networkComputers[networkId] = {
            };
            changed = true;
        }
    }    
    if (changed) {
        saveDataFile("network_computers.json", networkComputers);    
        saveDataFile("network_data.json", networkData);
    }
}