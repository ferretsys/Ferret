import { DATA_SOURCES } from "../../network_data.js";
import { sendServiceCallFail } from "../service_calls.js";

export const DATA_STREAMS_OF_NETWORKS = {};

class DataStream {
    constructor(name) {
        this.name = name;
        this.subscribers = [];
        this.format = {
            type: "text",
        };
    }
}

// Test requests:
// {
//     type: "service_call",
//     endpoint: "data_stream",
//     action: "subscribe",
//     data_stream_name: "test_stream"
// }
// {
//     type: "service_call",
//     endpoint: "data_stream",
//     action: "new_entry",
//     data_stream_name: "test_stream",
//     entry: "test"
// }

export function getDataStreamsForNetwork(net) {
    return DATA_STREAMS_OF_NETWORKS[net.networkId] || {};
}

export function getOrCreateDataStream(net, streamName) {
    if (!DATA_STREAMS_OF_NETWORKS[net.networkId]) {
        DATA_STREAMS_OF_NETWORKS[net.networkId] = {};
    }
    if (!DATA_STREAMS_OF_NETWORKS[net.networkId][streamName]) {
        DATA_STREAMS_OF_NETWORKS[net.networkId][streamName] = new DataStream(streamName);
    }
    return DATA_STREAMS_OF_NETWORKS[net.networkId][streamName];
}

export function getDataStream(net, streamName) {
    if (!DATA_STREAMS_OF_NETWORKS[net.networkId]) {
        return null;
    }
    return DATA_STREAMS_OF_NETWORKS[net.networkId][streamName] || null;
}

export function onDataStreamEntry(net, streamName, entry) {
    var dataStream = getDataStreamsForNetwork(net)[streamName];
    if (!dataStream) {
        dataStream = new DataStream(streamName);
        if (DATA_STREAMS_OF_NETWORKS[net] == null) {
            DATA_STREAMS_OF_NETWORKS[net.networkId] = {};
        }
        DATA_STREAMS_OF_NETWORKS[net.networkId][streamName] = dataStream;
    }
    dataStream.subscribers.forEach(subscriber => subscriber.socket.send(JSON.stringify({
        type: "data_stream_data",
        data_stream_name: streamName,
        entry: entry,
        timestamp: Date.now()
    })));
}

export function addConnectionToDataStream(net, streamName, connection) {
    var dataStream = getOrCreateDataStream(net, streamName);
    connection.addOnDisconnect(() => {
        dataStream.subscribers = dataStream.subscribers.filter(subscriber => subscriber != connection);
        console.log("Removed subscriber from stream", streamName, "for network", net.networkId);
        net.setChanged(DATA_SOURCES);
    });
    connection.socket.send(JSON.stringify({
        type: "data_stream_format",
        data_stream_name: streamName,
        format: dataStream.format,
    }));
    dataStream.subscribers.push(connection);
    net.setChanged(DATA_SOURCES);
}


export function handleStatisticsCallFromConnection(net, connection, message) {
    if (message.action == "subscribe") {
        var streamName = message.data_stream_name;
        if (!streamName) {
            sendServiceCallFail(net, connection, "No stream name provided for subscription.");
            return;
        }
        addConnectionToDataStream(net, streamName, connection);
        var dataStream = getOrCreateDataStream(net, streamName);
        connection.socket.send(JSON.stringify({
            type: "data_stream_format",
            data_stream_name: streamName,
            format: dataStream.format,
        }));
        console.log("Added subscriber to stream", streamName, "for network", net.networkId);
    } else if (message.action == "unsubscribe") {
        var dataStream = getDataStreamsForNetwork(net);
        if (dataStream) {
            dataStream.subscribers = dataStream.subscribers.filter(subscriber => subscriber != connection);
        } else {
            sendServiceCallFail(net, connection, "No stream found for unsubscription.");
            return;
    }
        net.setChanged(DATA_SOURCES);
        console.log("Removed subscriber to stream", streamName, "for network", net.networkId);
    } else if (message.action == "new_entry") {
        var streamName = message.data_stream_name;
        if (!streamName) {
            sendServiceCallFail(net, connection, "No stream name provided for subscription.");
            return;
        }
        onDataStreamEntry(net, streamName, message.entry);
    } else if (message.action == "set_format") {
        var streamName = message.data_stream_name;
        if (!streamName) {
            sendServiceCallFail(net, connection, "No stream name provided for setting format.");
            return;
        }
        var dataStream = getOrCreateDataStream(net, streamName);
        dataStream.format.type = message.format.type;
        dataStream.subscribers.forEach(subscriber => subscriber.socket.send(JSON.stringify({
            type: "data_stream_format",
            data_stream_name: streamName,
            format: dataStream.format,
        })));
    } else {
        sendServiceCallFail(net, connection, "Unknown action for statistics call: " + message.action);
    }
}