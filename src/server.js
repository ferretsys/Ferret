import {} from "./web.js";
import { readDataFile, saveDataFile } from "./data.js";
import { getFileFromClientSourceForComputer, notifyWebOfNewComputerData, notifyWebOfNewPackageData } from "./sockets.js";

var networks = readDataFile("networks.json");
var networkData = readDataFile("network_data.json");
var networkComputers = readDataFile("network_computers.json");

export function onNetworkDataChaged(networkId) {
    saveDataFile("network_data.json", networkData);
    notifyWebOfNewPackageData(networkId)
}

export function onNetworkComputersChaged(networkId) {
    saveDataFile("network_computers.json", networkComputers);
    notifyWebOfNewComputerData(networkId)
}
var networkByToken = {};
for (var id in networks) {
    networkByToken[networks[id].token] = id;
}

export function addComputerToServer(networkId, computerId) {
    if (!networkComputers[networkId][computerId]) {
        networkComputers[networkId][computerId] = {
            id: computerId,
            source: "default",
            package: null,
        };
        onNetworkComputersChaged(networkId);
    }
}

export function getNetworkForToken(token) {
    return networkByToken[token];
}

export function getComputersOfNetwork(networkId) {
    return networkComputers[networkId];
}

export function getPackagesOfNetwork(networkId) {
    return networkData[networkId].packages;
}

export function addPackageToNetwork(networkId, packageId, packageData) {
    networkData[networkId].packages[packageId] = packageData;
}

export function removePackageFromNetwork(networkId, packageId) {
    delete networkData[networkId].packages[packageId];
}
export function removeComputerFromNetwork(networkId, computerId) {
    delete networkComputers[networkId][computerId];
}

export function getPackageOfComputer(networkId, computerId) {
    var computerPackage = networkComputers[networkId][computerId].package;
    if (!computerPackage) {
        return null;
    } else {
        return networkData[networkId].packages[computerPackage];
    }
}

export function setPackageOfComputer(networkId, computerId, packageId) {
    networkComputers[networkId][computerId].package = packageId;
    onNetworkComputersChaged(networkId);
}

export function setSourceOfComputer(networkId, computerId, sourceId) {
    networkComputers[networkId][computerId].source = sourceId;
    onNetworkComputersChaged(networkId);
}

export function getSourceOfComputer(networkId, computerId) {
    return networkComputers[networkId][computerId].source
}

export async function getFileFromSourceForComputer(networkId, computerId, filename) {
    var sourceId = networkComputers[networkId][computerId].source;
    if (sourceId == "default") {
        var defaultSource = networkData[networkId].default_source;
        if (defaultSource.type != "github") {
            throw "Unknown code source type  " + defaultSource.type;
        }
        console.log("Fetching " + defaultSource.url + filename)
        return await fetch(defaultSource.url + filename, {cache: "no-store"}).then(async response => await response.text())
    } else {
        console.log("Fetching from client source")
        var clientSourceResult = await getFileFromClientSourceForComputer(sourceId, filename);
        console.log(clientSourceResult);
        if (clientSourceResult == null) {
            networkComputers[networkId][computerId].source = "default";
            console.log("Client fetch failed, reverting to default");
            onNetworkComputersChaged(networkId);
            clientSourceResult = await getFileFromSourceForComputer(networkId, computerId, filename);
        }
        return clientSourceResult;
    }
}

export async function getFilesFromSourceForComputer(networkId, computerId) {
    var packaged = getPackageOfComputer(networkId, computerId);
    if (packaged == null) return [];
    
    var fileData = []
    for (var filename of packaged.files) {
        fileData.push({
            name: filename,
            content: await getFileFromSourceForComputer(networkId, computerId, filename),
        })
    }
    return fileData;
}

export function updateConnectedComputers(networkId, computerConnections) {
    var connectedComputers = {};
    for (var connection of computerConnections) {
        connectedComputers[connection.computerId] = true
    }
    for (var computerid in networkComputers[networkId]) {
        networkComputers[networkId][computerid].connectedState = connectedComputers[computerid] != undefined;
    }
    onNetworkComputersChaged(networkId);
}
