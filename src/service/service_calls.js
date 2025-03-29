import { handleStatisticsCallFromConnection } from "./data/data_stream.js";

export function handleServiceCallFromComputer(network, computerConnection, message) {
    if (!message.endpoint) {
        console.log("Computer sent malformed service call, no endpoint provided", message);
        sendServiceCallFail(network, computerConnection, "No endpoint provided.");
        return;
    }

    if (message.endpoint == "data_stream") {
        handleStatisticsCallFromConnection(network, computerConnection, message);
    } else {
        console.log("Computer sent unknown service call, to ", message.endpoint);
        sendServiceCallFail(network, computerConnection, "Unknown endpoint provided.");
    }
}

export function sendServiceCallFail(network, computerConnection, reason) {
    console.log("Sending service call fail to computer", reason);
    computerConnection.socket.send(JSON.stringify({
        type: "service_call_fail",
        reason: reason
    }));
}