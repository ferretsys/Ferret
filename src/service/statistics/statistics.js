const DATA_STREAMS_OF_NETWORKS = {};

class DataStream {
    constructor(name) {
        this.name = name;
        this.subscribers = [];
    }
}

// Test requests when i get to it to use with the following JSON:
// {
//     type: "service_call",
//     endpoint: "statistics",
//     action: "subscribe",
//     data_stream_name: "test_stream"
// }
// {
//     type: "service_call",
//     endpoint: "statistics",
//     action: "new_entry",
//     data_stream_name: "test_stream",
//     entry: "test"
// }

export function getDataStreamsForNetwork(net) {
    return DATA_STREAMS_OF_NETWORKS[net.networkId] || {};
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
    dataStream.subscribers.forEach(subscriber => subscriber.send(JSON.stringify({
        type: "data_stream_entry",
        data_stream_name: streamName,
        entry: entry,
        timestamp: Date.now()
    })));
}

export function subscribeSocketToStreamEntry(net, streamName, entry) {
    var dataStream = getDataStreamsForNetwork(net)[streamName];
    if (!dataStream) {
        dataStream = new DataStream(streamName);
        DATA_STREAMS_OF_NETWORKS[net.networkId] = dataStream;
    }
    dataStream.subscribers.push(entry);
}

export function handleStatisticsCallFromComputer(net, computerConnection, message) {
    if (message.action == "subscribe") {
        subscribeSocketToStreamEntry(net, computerConnection.data_stream_name, computerConnection);
    }
    if (message.action == "unsubscribe") {
        var dataStream = getDataStreamsForNetwork(net);
        if (dataStream) {
            dataStream.subscribers = dataStream.subscribers.filter(subscriber => subscriber != computerConnection);
        }
    }

    if (message.action == "new_entry") {
        onDataStreamEntry(net, computerConnection.data_stream_name, message.entry);
    }
}