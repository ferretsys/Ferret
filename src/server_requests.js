import { networkComputers } from "./data.js";
import { addPackageToNetwork, getComputersOfNetwork, getFilesFromSourceForComputer, getNetworkForToken, getPackagesOfNetwork, onNetworkComputersChaged, onNetworkDataChaged, removeComputerFromNetwork, removePackageFromNetwork, setPackageOfComputer, setSourceOfComputer } from "./server.js";
import { getClientSourcesOfNetwork, notifyWebOfNewPackageData, sendToComputerSocket } from "./sockets.js";
import { existsSync, readFileSync } from "fs";

var serverHash = existsSync("./run/hash.txt") ? readFileSync("./run/hash.txt").toString() : "UNKNOWN";
console.log("Found server hash " + serverHash);

export var serverStatistics = {
    hash: serverHash, 
    connected_computers: 0
};

export function handleRequest(token, endpoint, body) {
    var networkId = getNetworkForToken(token);
    if (endpoint == "get_data_for_computers_list") {
        return getComputersOfNetwork(networkId);
    } else if (endpoint == "get_data_for_packages_list") {
        return getPackagesOfNetwork(networkId);
    } else if (endpoint == "get_data_for_client_sources_list") {
        return getClientSourcesOfNetwork(networkId);
    } else if (endpoint == "get_server_infos") {
        return {
            network_id: networkId,
            stats: serverStatistics
        }
    } else if (endpoint == "add_new_package") {
        var packages = getPackagesOfNetwork(networkId);

        var name = body.name;
        var files = body.files;

        if (!/^[a-zA-Z 0-9\.]*$/.test(name) && !/^[a-zA-Z 0-9\.,\/-]*$/.test(files)) return {result: "Server rejected input"};

        if (packages[name]) return {result: "Package with name already exists!"};

        addPackageToNetwork(networkId, name, {
            files: files.split(",")
        })
        onNetworkDataChaged(networkId);
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

        removePackageFromNetwork(networkId, name)
        onNetworkDataChaged(networkId);
        return {result: "Removed successfully", silent: true};
    } else if (endpoint == "remove_computer") {
        var computerId = body.computer_id;

        var computers = getComputersOfNetwork(networkId);
        if (!computers[computerId]) return {result: "Computer with name doesen't exist!"};

        if (computers[computerId].connectedState) return {result: "Computer must be disconnected!"};

        removeComputerFromNetwork(networkId, computerId)
        onNetworkComputersChaged(networkId);
        return {result: "Removed successfully", silent: true};
    }

    console.log("Unknown request endpoint", endpoint);
    return {
        "error": "unknown endpoint " + endpoint
    }
}

export async function handleEmit(connection, token, endpoint, body) {
    var networkId = getNetworkForToken(token);
    if (endpoint == "needs_data_for_table_content") {
        if (body.source == "computers") {
            connection.socket.send(JSON.stringify({
                type: "data_table_content",
                source: "computers",
                content: getComputersOfNetwork(networkId)
            }));
        } else {
            console.log("Unknown source for table prefetch", body.source)
        }
        return;
    }
    if (endpoint == "refresh_computer_source") {
        var files = await getFilesFromSourceForComputer(networkId, body.computer_id);
        networkComputers[networkId][body.computer_id].packageState = files == null ? "bad" : "ok";
        if (files != null) {
            sendToComputerSocket(networkId, body.computer_id, {
                type: "action",
                action: "refresh_computer_source",
                files: await getFilesFromSourceForComputer(networkId, body.computer_id)
            });
        }
        return;
    }
    if (endpoint == "set_computer_package") {
        setPackageOfComputer(networkId, body.computer_id, body.package)
        return;
    }
    if (endpoint == "set_computer_source") {
        setSourceOfComputer(networkId, body.computer_id, body.source)
        return;
    }
    console.log("Unknown emit endpoint", endpoint);
}