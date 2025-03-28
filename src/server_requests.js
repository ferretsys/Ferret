import { SYNCED_COMPUTERS, SYNCED_CONFIG } from "./data.js";
import { getFilesFromSourceForComputer, getNetworkForToken, getSyncedNetwork } from "./server.js";
import { getClientSourcesOfNetwork, sendToComputerSocket } from "./sockets.js";
import { existsSync, readFileSync } from "fs";

var serverHash = existsSync("./run/hash.txt") ? readFileSync("./run/hash.txt").toString() : "UNKNOWN";
console.log("Found server hash " + serverHash);

export var serverStatistics = {
    hash: serverHash, 
    connected_computers: 0
};

export async function handleRequest(token, endpoint, body) {
    var networkId = getNetworkForToken(token);
    var net = getSyncedNetwork(token);
    if (endpoint == "get_data_for_computers_list") {
        return {};
    } else if (endpoint == "get_data_for_packages_list") {
        return {};
    } else if (endpoint == "get_data_for_client_sources_list") {
        return {};
    } else if (endpoint == "get_server_infos") {
        return {
            network_id: networkId,
            stats: serverStatistics
        }
    } else if (endpoint == "add_new_package") {
        var packages = net.config.packages;

        var name = body.name;
        var files = body.files;

        if (!/^[a-zA-Z 0-9\.]*$/.test(name) && !/^[a-zA-Z 0-9\.,\/-]*$/.test(files)) return {result: "Server rejected input"};

        if (packages[name]) return {result: "Package with name already exists!"};

        net.config.packages[name] = {
            files: files.split(",")
        };
        net.setChanged(SYNCED_CONFIG);
        return {result: "Added successfully", silent: true, clear: true};
    } else if (endpoint == "remove_package") {
        var name = body.name;

        var packages = getPackagesOfNetwork(networkId);
        if (!packages[name]) return {result: "Package with name doesen't exist!"};

        for (var computerId in packages) {
            var computer = packages[computerId];
            if (computer.package == name) {
                return {result: "Package is in use!"};
            }
        }

        delete net.config.packages[name];
        net.setChanged(SYNCED_CONFIG);
        return {result: "Removed successfully", silent: true};
    } else if (endpoint == "remove_computer") {
        var computerId = body.computer_id;

        var computers = getComputersOfNetwork(networkId);
        if (!computers[computerId]) return {result: "Computer with name doesen't exist!"};

        if (computers[computerId].connectedState) return {result: "Computer must be disconnected!"};

        delete net.computers[computerId];
        net.setChanged(SYNCED_COMPUTERS);
        return {result: "Removed successfully", silent: true};
    } else if (endpoint == "refresh_computer_source") {
        if (!net.computers[body.computer_id].connectedState) {   
            return { result: "Failed to update, computer is not connected!" }
        }

        var files = await getFilesFromSourceForComputer(net, body.computer_id);
        net.computers[body.computer_id].packageState = files == null ? "bad" : "ok";
        if (files != null) {
            sendToComputerSocket(networkId, body.computer_id, {
                type: "action",
                action: "refresh_computer_source",
                files: files
            });
        }
        var success = files != null;
        return {
            result: success ? "Updated successfully" : "Failed to update, missing files"
        }
    }

    console.log("Unknown request endpoint", endpoint);
    return {
        "error": "unknown endpoint " + endpoint
    }
}

var tableContentRequestHandlers = {
    "computers": async (net) => {
        return net.computers
    },
    "packages": async (net) => {
        return net.config.packages
    },
    "sources": async (net) => {
        return getClientSourcesOfNetwork(net.networkId)
    },
}

export async function handleEmit(connection, token, endpoint, body) {
    var networkId = getNetworkForToken(token);
    var net = getSyncedNetwork(token);
    if (endpoint == "needs_data_for_table_content") {
        if (!(body.sources instanceof Array)) return;
        for (var source of body.sources) {
            if (tableContentRequestHandlers[source]) {
                connection.socket.send(JSON.stringify({
                    type: "data_table_content",
                    source: source,
                    content: await tableContentRequestHandlers[source](net)
                }));
            } else {
                console.log("Unknown source for table prefetch", source)
            }
        }
        return;
    }
    // if (endpoint == "needs_data_for_all_table_content") {
    //     for (var source in tableContentRequestHandlers) {
    //         connection.socket.send(JSON.stringify({
    //             type: "data_table_content",
    //             source: source,
    //             content: await tableContentRequestHandlers[source](net)
    //         }));
    //     }
    //     return;
    // }
    if (endpoint == "refresh_computer_source") {
        var files = await getFilesFromSourceForComputer(net, body.computer_id);
        net.computers[body.computer_id].packageState = files == null ? "bad" : "ok";
        if (files != null) {
            sendToComputerSocket(networkId, body.computer_id, {
                type: "action",
                action: "refresh_computer_source",
                files: await getFilesFromSourceForComputer(net, body.computer_id)
            });
        }
        return;
    }
    if (endpoint == "set_computer_package") {
        net.computers[body.computer_id].package = body.package;
        net.setChanged(SYNCED_CONFIG);
        return;
    }
    if (endpoint == "set_computer_source") {
        net.computers[body.computer_id].source = body.source;
        net.setChanged(SYNCED_COMPUTERS);
        return;
    }
    console.log("Unknown emit endpoint", endpoint);
}