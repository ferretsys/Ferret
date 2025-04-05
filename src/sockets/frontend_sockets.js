import { SYNCED_SOURCES } from "../network_data.js";
import { getFilesFromSourceForComputer, getNetworkForToken, getSyncedNetwork } from "../index.js";
import { handleEmit, handleRequest } from "../server_requests.js";
import { applyComputerSockets } from "./computer_sockets.js";
import { Connection } from "./connection.js";
import { addConnectionToDataStream, handleDataStreamSocketMessage } from "../service/data/data_stream.js";

export var computerConnections = [];
export var webConnections = [];
export var clientSourceConnections = [];

async function handleWebSocketMessage(connection, data) {
    if (data.type == "request") {
        connection.socket.send(JSON.stringify({
            type: "request_response",
            request_id: data.request_id,
            response: await handleRequest(connection.networkToken, data.endpoint, data.body)
        }));
    } else if (data.type == "emit") {
        handleEmit(connection, connection.networkToken, data.endpoint, data.body)
    }
}

async function handleClientSourceSocketMessage(connection, data) {
    var reloadedCount = 0;
    var net = connection.net;
    if (data.type == "trigger_reload") {
        for (var computerConnection of computerConnections) {
            if (connection.networkId != computerConnection.networkId) continue;
            var source = net.computers[computerConnection.computerId].source;
            if (source == connection.sourceId) {
                reloadedCount++;
                var files = await getFilesFromSourceForComputer(net, computerConnection.computerId);
                net.computers[computerConnection.computerId].packageState = files == null ? "bad" : "ok";
                if (files != null) {
                    sendToComputerSocket(computerConnection.networkId, computerConnection.computerId, {
                        type: "action",
                        action: "refresh_computer_source",
                        files: files
                    });
                }
            }
        }
        console.log("Reloaded", reloadedCount, "computers on", connection.sourceId);
    }
}

export function sendToComputerSocket(networkId, computerId, data) {
    for (var connection of computerConnections) {
        if (connection.networkId == networkId && connection.computerId == computerId) {
            connection.updateLastNetworkTime();
            connection.socket.send(JSON.stringify(data));
            return;
        }
    }
}

export function getClientSourcesOfNetwork(networkId) {
    return clientSourceConnections.filter(connection => connection.net.networkId == networkId).map(connection => connection.sourceId);
}

var nextRequestId = 0;
function getNextRequestId() {
    return nextRequestId++;
}

var requestPromises = {};
export async function getFileFromClientSourceForComputer(sourceId, filename) {
    var connection = clientSourceConnections.find(connection => connection.sourceId == sourceId);
    return [
        Boolean(connection), connection ? await requestClientSourceSocket(
            connection.socket,
            filename
        ).then((response) => {
            return response.result == "success" ? response.response : null
        }) : null
    ];
}

async function requestClientSourceSocket(socket, filename) {
    var requestId = getNextRequestId();

    var requestContent = {
        type: "request",
        request_id: requestId,
        filename: filename
    };

    var requestEntry = {
        content: requestContent,
        resolve: null
    }

    var requestPromise = new Promise((resolve, reject) => {
        requestEntry.resolve = resolve;
    });

    requestPromises[requestId] = requestEntry;

    socket.send(JSON.stringify(requestContent));

    return requestPromise;
}

var sourceCodesInUse = {};
function randomSourceCode() {
    var code = [...Array(6).keys()]
        .map(
            _=>
                "abcdefghijklmnopqrstuvwxyz0123456789"
                [Math.floor(Math.random()*"abcdefghijklmnopqrstuvwxyz0123456789".length)]
        ).join("");
    if (sourceCodesInUse[code]) {
        return randomSourceCode();
    }
    return code;
}

export function applySockets(app) {
    applyComputerSockets(app);
    
    app.ws("/socket/web", function (ws, req) {
        console.log("New connection by web");
        var cookie = req.get("COOKIE");
        var networkToken = /authToken=([^;]+)/.exec(cookie)[1];
        var networkId = getNetworkForToken(networkToken);
        var net = getSyncedNetwork(networkToken);
        if (networkId == null) {
            console.log("Rejected web connection");
            ws.send("Invalid token")
            ws.close()
            return;
        }
        var connection = {
            socket: ws,
            networkToken: networkToken,
            networkId: networkId,
            net: net,
        };
    
        webConnections.push(connection);

        ws.on('message', function (message) {
            handleWebSocketMessage(connection, JSON.parse(message));
        });
        ws.on('close', function () {
            console.log("Web connection closed");
            webConnections.splice(webConnections.indexOf(ws), 1);
        });
    });

    
    app.ws("/socket/data_source", function (ws, req) {
        console.log("New connection by data source display");
        var cookie = req.get("COOKIE");
        var networkToken = /authToken=([^;]+)/.exec(cookie)[1];
        var networkId = getNetworkForToken(networkToken);
        var net = getSyncedNetwork(networkToken);

        var dataStream = req.query.data_source;
        if (dataStream == null) {
            console.log("No source id provided for data stream display connection");
            ws.send("No source id provided")
            ws.close()
            return;
        }

        if (networkId == null) {
            console.log("Rejected data stream display connection");
            ws.send("Invalid token")
            ws.close()
            return;
        }
        
        var connection = new Connection(ws);
        addConnectionToDataStream(net, dataStream, connection)

        ws.on('message', function (message) {
            var data = JSON.parse(message);
            handleDataStreamSocketMessage(net, connection, dataStream, data);
        });

        ws.on('close', function () {
            console.log("Data stream display connection closed");
            connection.onDisconnect();
        });
    });
    
    app.ws("/socket/client_source", function (ws, req) {
        console.log("New connection by client source");
        var cookie = req.get("COOKIE");
        var networkToken = /authToken=([^;]+)/.exec(cookie)[1];
        var net = getSyncedNetwork(networkToken);

        if (net == null) {
            console.log("With invalid token", sourceId);
            ws.send("Invalid token")
            ws.close()
            return;
        }

        var sourceId = randomSourceCode();
        sourceCodesInUse[sourceId] = true;
        var connection = {
            socket: ws,
            networkToken: networkToken,
            net: net,
            networkId: net.networkId,
            sourceId: sourceId
        };

        console.log("Assigned source id", sourceId);
        ws.send("Your id is " + sourceId);//Note that the client has special formatting for this text (bad idea i know icba to fix rn)

        clientSourceConnections.push(connection);
        net.setChanged(SYNCED_SOURCES);

        ws.on('message', function (message) {
            var data = JSON.parse(message);
            if (data.type == "request_response") {
                if (requestPromises[data.request_id]) {
                    requestPromises[data.request_id].resolve(data)
                    delete requestPromises[data.request_id]
                } else {
                    console.log("Recived response for a request that didnt exist!");
                }
            } else {
                handleClientSourceSocketMessage(connection, data); 
            }
        });
        
        ws.on('close', function () {
            console.log("Client connection closed");
            clientSourceConnections.splice(clientSourceConnections.indexOf(ws), 1);
            delete sourceCodesInUse[sourceId];
            net.setChanged(SYNCED_SOURCES);
        });
    });
}