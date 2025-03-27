import { handleStatisticsCallFromComputer } from "./statistics/statistics";

export function handleServiceCallFromComputer(network, computerConnection, message) {
    if (!message.endpoint) {
        console.log("Computer sent malformed service call, to ", message.endpoint);
        return;
    }

    if (message.endpoint == "statistics") {
        handleStatisticsCallFromComputer(network, computerConnection, message);
    }
}

export function sendServiceCallFail(network, computerConnection, reason) {
    computerConnection.socket.send(JSON.stringify({
        type: "service_call_fail",
        reason: reason
    }));
}