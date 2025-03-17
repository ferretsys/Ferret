import { addPackageToNetwork, getComputersOfNetwork, getFilesFromSourceForComputer, getNetworkForToken, getPackagesOfNetwork, onNetworkDataChaged, removePackageFromNetwork, setPackageOfComputer, setSourceOfComputer } from "./server.js";
import { getClientSourcesOfNetwork, notifyWebOfNewPackageData, sendToComputerSocket } from "./sockets.js";

export function handleRequest(token, endpoint, body) {
    var networkId = getNetworkForToken(token);
    if (endpoint == "get_data_for_computers_list") {
        return getComputersOfNetwork(networkId);
    } else if (endpoint == "get_data_for_packages_list") {
        return getPackagesOfNetwork(networkId);
    } else if (endpoint == "get_data_for_client_sources_list") {
        return getClientSourcesOfNetwork(networkId);
    } else if (endpoint == "add_new_package") {
        var packages = getPackagesOfNetwork(networkId);

        var name = body.name;
        var files = body.files;

        if (!/^[a-zA-Z 0-9\.]*$/.test(name) && !/^[a-zA-Z 0-9\.\/-]*$/.test(files)) return {result: "Server rejected input"};

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

        var computers = getComputersOfNetwork(networkId);
        for (var computerId in computers) {
            var computer = computers[computerId];
            if (computer.package == name) {
                return {result: "Package is in use!"};
            }
        }

        removePackageFromNetwork(networkId, name)
        onNetworkDataChaged(networkId);
        return {result: "Removed successfully", silent: true};
    }
    console.log("Unknown request endpoint", endpoint);
    return {
        "error": "unknown endpoint " + endpoint
    }
}

export async function handleEmit(token, endpoint, body) {
    var networkId = getNetworkForToken(token);
    if (endpoint == "refresh_computer_source") {
        sendToComputerSocket(networkId, body.computer_id, {
            type: "action",
            action: "refresh_computer_source",
            files: await getFilesFromSourceForComputer(networkId, body.computer_id)
        });
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