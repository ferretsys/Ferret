import {} from "./webhost.js";//Load
import {} from "./sockets/internal_socket.js"; //Load
import { CONNECTED_COMPUTERS_CHART, networkTokens, SYNCED_COMPUTERS, syncedNetworkData } from "./network_data.js";
import { getFileFromClientSourceForComputer } from "./sockets/frontend_sockets.js";
import { serverStatistics } from "./server_requests.js";

var networkByToken = {};
for (var id in networkTokens) {
    networkByToken[networkTokens[id].token] = id;
}

export function addComputerToServer(net, computerId) {
    if (!net.computers[computerId]) {
        net.computers[computerId] = {
            id: computerId,
            source: "default",
            package: null,
        };
        net.setChanged(SYNCED_COMPUTERS);
    }
}

export function getNetworkForToken(token) {
    return networkByToken[token];
}

export function getSyncedNetwork(tokenOrId) {
    return syncedNetworkData[tokenOrId]  || syncedNetworkData[getNetworkForToken(tokenOrId) || console.log("Unable to resolve network for " + tokenOrId) || ""];
}

export function getPackageOfComputer(net, computerId) {
    var computerPackage = net.computers[computerId].package;
    if (!computerPackage) {
        return null;
    } else {
        return net.config.packages[computerPackage];
    }
}

export async function getFileFromSourceForComputer(net, computerId, filename) {
    console.log("Fetching file", net.networkId, computerId, filename);
    var sourceId = net.computers[computerId].source;
    if (sourceId == "default") {
        var defaultSource = net.config.default_source;
        if (defaultSource.type != "github") {
            throw "Unknown code source type  " + defaultSource.type;
        }
        console.log("Fetching " + defaultSource.url + filename)
        return await fetch(defaultSource.url + filename, {cache: "no-store"})
            .then(async response => response.status == 200 ? await response.text() : null);
    } else {
        console.log("Fetching from client source")
        var [connectionPresent, clientSourceResult] = await getFileFromClientSourceForComputer(sourceId, filename);
        if (!connectionPresent) {
            console.log("Client fetch failed - missing connection");
            net.computers[computerId].source = "default";
            net.setChanged(SYNCED_COMPUTERS);
            return await getFileFromSourceForComputer(net, computerId, filename);
        }
        console.log("Client fetch successful")
        return clientSourceResult;
    }
}

export async function getFilesFromSourceForComputer(net, computerId) {
    var packaged = getPackageOfComputer(net, computerId);
    if (packaged == null) return [];
    
    var fileData = []
    for (var filename of packaged.files) {
        var content = await getFileFromSourceForComputer(net, computerId, filename);
        if (content == null) {       
            console.log("Failed to fetch files from source", net.networkId, computerId, filename);
            return null;
        }
        fileData.push({
            name: filename,
            content: content,
        })
    }
    return fileData;
}

export function updateConnectedComputers(net, computerConnections) {
    var connectedComputers = {};
    var count = 0;
    for (var connection of computerConnections) {
        connectedComputers[connection.computerId] = true;
        count++;
    }
    for (var computerid in net.computers) {
        net.computers[computerid].connectedState = connectedComputers[computerid] != undefined;
    }
    serverStatistics.connected_computers = count;
    net.computerConnectedCountChartData[net.computerConnectedCountChartData.length - 1] = count;
    net.setChanged(CONNECTED_COMPUTERS_CHART);
    net.setChanged(SYNCED_COMPUTERS);
}
