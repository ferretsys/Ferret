import { SYNCED_COMPUTERS } from "../network_data.js";
import { getNetworkForToken, getSyncedNetwork, updateConnectedComputers } from "../index.js";
import { handleServiceCallFromComputer } from "../service/service_calls.js";
import { computerConnections, webConnections } from "./frontend_sockets.js";
import { Connection } from "./connection.js";

export class ComputerConnection extends Connection {
    constructor(ws, networkToken, networkId, computerId) {
        super(ws);
        this.networkToken = networkToken;
        this.networkId = networkId;
        this.computerId = computerId;

        this.lastNetworkTime = 0;
        this.localFerretStateOrderstamp = 0; //Any measure of local time, just used to avoid overwriting a new state
    }

    updateLastNetworkTime() {
        var now = Date.now();
        if (now - this.lastNetworkTime > 1000) {
            for (var connection of webConnections) {
                if (connection.networkId == this.networkId) {
                    connection.socket.send(JSON.stringify({
                        type: "heartbeat_tick",
                        group: "computers",
                        id: this.computerId
                    }))
                }
            }
            this.lastNetworkTime = now;
        }
    }
}

export function applyComputerSockets(app) {
    app.ws("/socket/computer", function (ws, req) {
        console.log("New connection by computer");
        
        var cookie = req.get("COOKIE");
        var networkToken = /authToken=([^;]+)/.exec(cookie)[1];
        var computerId = /computerid=([^;]+)/.exec(cookie)[1];
        var networkId = getNetworkForToken(networkToken);
        var net = getSyncedNetwork(networkId);

        if (networkId == null) {
            console.log("Rejected computer connection");
            ws.send("Invalid token")
            ws.close()
            return;
        }

        ws.on('message', function(message) {
            connection.updateLastNetworkTime();
            try {
                message = JSON.parse(message);
            } catch (error) {
                console.log("Recived malformed computer message");
            }

            if (message.type == "computer_notify_ferret_state") {
                if (connection.localFerretStateOrderstamp > message.order) {
                    console.log("Received old state from computer, ignoring")
                    return;
                }
                net.computers[computerId].ferretState = message.state
                console.log("Computer", computerId, "in state", message.state);
                net.setChanged(SYNCED_COMPUTERS);
                connection.localFerretStateOrderstamp = parseInt(message.order)
            }

            if (message.type == "service_call") {
                handleServiceCallFromComputer(net, connection, message);
            }
        });

        ws.on('close', function () {
            net.computers[computerId].ferretState = "shutdown";
            net.computers[computerId].substatus = {};
            
            console.log("Computer connection closed");
            computerConnections.splice(computerConnections.indexOf(ws), 1);
            
            updateConnectedComputers(net, computerConnections);
            connection.onDisconnect();
        });

        var connection = new ComputerConnection(ws, networkToken, networkId, computerId);
        computerConnections.push(connection);
        connection.updateLastNetworkTime();

        updateConnectedComputers(net, computerConnections);
    });
}