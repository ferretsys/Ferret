var dataContainer = document.getElementById("data_container");

var dataSourceFromUrl = new URLSearchParams(window.location.search).get("data_source");
if (!dataSourceFromUrl) {
    dataContainer.innerText = "No data source specified!";
    throw new Error("No data source specified in URL!");
}

var dataSocket = new WebSocket((window.location.protocol == "https:" ? "wss:" : "ws:") + window.location.host + "/socket/data_source?data_source=" + dataSourceFromUrl);

dataSocket.addEventListener("open", function (event) {
    console.log("Connected to data source: " + dataSourceFromUrl);
    dataContainer.innerText = "Connected to data source: " + dataSourceFromUrl + "\nWaiting for data...";
});

var format = {
    type: "text",
}

var graph = null;
var timestamp = null;

var currentHandler = null;

function rebuildDataElementForFormat(format) {
    if (format.type == "text") {
        return;
    }
    if (currentHandler == null) {
        var scriptPath = "./script/page/data/handler/" + format.type.replaceAll(".", "/") + ".js";
        fetch(scriptPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to load handler script: " + scriptPath);
                }
                return response.text();
            })
            .then(scriptContent => {
                try {
                    currentHandler = eval("()=>{" + scriptContent + "}")();
                    console.log("Handler script loaded and executed: " + scriptPath);
                    if (typeof currentHandler === "object" && typeof currentHandler.update === "function") {
                        console.log("Valid handler loaded with 'update' function.");
                    } else {
                        console.error("The evaluated script did not return a valid handler with an 'update' function: " + scriptPath);
                        currentHandler = null;
                    }
                } catch (e) {
                    console.error("Error during script evaluation: ", e);
                    currentHandler = null;
                }
            })
            .catch(error => {
                console.error("Error loading handler script: ", error);
            });
  }
}

function updateDataElement(data, time) {
    if (format.type == "text") {
        dataContainer.innerText = data;
    }
    if (currentHandler != null) {
        if (currentHandler.update != null) {
            currentHandler.update(data, time);
        } else {
            console.error("Handler does not have an 'update' function: ", currentHandler);
        }
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

rebuildDataElementForFormat({type: "output.ship_tracker"});