var dataContainer = document.getElementById("data_container");

var dataSourceFromUrl = new URLSearchParams(window.location.search).get("data_source");
if (!dataSourceFromUrl) {
    dataContainer.innerText = "No data source specified!";
    throw new Error("No data source specified in URL!");
}

var dataSocket = new WebSocket((window.location.protocol == "https:" ? "wss:" : "ws:")  + window.location.host + "/socket/data_source?data_source=" + dataSourceFromUrl);

dataSocket.addEventListener("open", function (event) {
    console.log("Connected to data source: " + dataSourceFromUrl);
    dataContainer.innerText = "Connected to data source: " + dataSourceFromUrl + "\nWaiting for data...";
});

var format = {
    type: "text",
}

var graph = null;
var timestamp = null;

function rebuildDataElementForFormat(format) {
    if (format.type == "text") {
        return;
    } else if (format.type == "line_graph") {
        var canvasContainer = document.createElement("div");
        canvasContainer.id = "data_graph_container";
        canvasContainer.style.width = "100%";
        canvasContainer.style.height = "90vh";

        var canvas = document.createElement("canvas");

        canvas.id = "data_graph_canvas";
        dataContainer.innerText = "";
        
        canvasContainer.appendChild(canvas);
        dataContainer.appendChild(canvasContainer);

        graph = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    pointHitRadius: 40,
                    pointRadius: 0,
                    borderWidth: 5,
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            }
        });
        timestamp = document.createElement("span");
        timestamp.id = "data_graph_timestamp";
        timestamp.innerText = "Timestamp: ?";
        dataContainer.appendChild(timestamp);
    }
}
function updateDataElement(data, time) {
    if (format.type == "text") {
        dataContainer.innerText = data;
    } else if (format.type == "line_graph") {
        if (graph == null) {
            console.error("Graph is not initialized!");
            return;
        }
        graph.data.labels = data.labels || Object.keys(data.data);
        graph.data.datasets[0].data = data.data;
        graph.update();
        if (timestamp == null) {
            console.error("Timestamp is not initialized!");
            return;
        }
        timestamp.innerText = "Timestamp: " + time;
    }
}

dataSocket.addEventListener("message", function (event) {
    var data = JSON.parse(event.data);
    if (data.type == "data_stream_data") {
        console.log("Received data entry: ", data.entry);
        updateDataElement(data.entry, data.timestamp);
    } else if (data.type == "data_stream_format") {
        console.log("Received data stream formatting: ", data.format);
        format = data.format;
        rebuildDataElementForFormat(format);
    } else if (data.type == "data_stream_disconnected") {
        console.log("Data stream disconnected: ", data.data_stream_name);
        dataContainer.innerText = "Data stream disconnected: " + data.data_stream_name;
    } else {
        console.log("Unknown message type: ", data.type);
    }
});

dataSocket.addEventListener("error", function (event) {
    console.error("WebSocket error: ", event);
    dataContainer.innerText = "WebSocket error: " + event.message;
});

dataSocket.addEventListener("close", function (event) {
    console.log("WebSocket closed: ", event);
    dataContainer.innerText = "WebSocket closed: " + event.code + " " + event.reason;
});

dataContainer.innerText = "Connecting to data source...";