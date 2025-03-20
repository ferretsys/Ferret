import { networkComputers } from "../data.js";
import { getNetworkForToken, onNetworkComputersChaged, updateConnectedComputers } from "../server.js";
import { computerConnections, webConnections } from "../sockets.js";

class ComputerConnection {
    constructor(ws, networkToken, networkId, computerId) {
        this.socket = ws;
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
        if (networkId == null) {
            console.log("Rejected computer connection");
            ws.send("Invalid token")
            ws.close()
            return;
        }
        var connection = new ComputerConnection(ws, networkToken, networkId, computerId);
        computerConnections.push(connection);
        connection.updateLastNetworkTime();
        updateConnectedComputers(networkId, computerConnections);
        ws.on('message', function(message) {
            connection.updateLastNetworkTime();
            try {
                message = JSON.parse(message);
            } catch (error) {
                console.log("Recived malformed computer message");
            }
            
            if (message.type == "computer_notify_ferret_state" && parseInt(message.order) > connection.localFerretStateOrderstamp) {
                networkComputers[networkId][computerId].ferretState = message.state
                onNetworkComputersChaged(networkId);
                connection.localFerretStateOrderstamp = parseInt(message.order)
            }
        })
        ws.on('close', function () {
            console.log("Computer connection closed");
            computerConnections.splice(computerConnections.indexOf(ws), 1);
            updateConnectedComputers(networkId, computerConnections);
        });
    });
}