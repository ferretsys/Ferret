import { readFileSync } from "fs";
import chokidar from "chokidar";

function parseConfig(text) {
    var entries = {};
    var lines = text.split("\r\n");
    for (var line of lines) {
        var data = line.split("=");
        entries[data[0]] = data[1];
    }
    return entries;
}

const config = parseConfig(readFileSync("./config.txt").toString());

console.log("Config:", config);

const ws = new WebSocket(config.host, {
    headers: {
      cookie: "authToken=" + config.token + ";"
    }
});
var watcher = null;
ws.addEventListener("open", ()=> {
    console.log("Open, beginning file system watch");
    
    watcher = chokidar.watch(config.src, {
        ignored: [config.src + '\\.git'],
        persistent: true,
        ignoreInitial: true,
    });
    watcher.on('all', (event, path) => {
        console.log("File system change (", event, path, "), triggering reload");
        ws.send(JSON.stringify({
            type: "trigger_reload"
        }))
    });
});

ws.addEventListener("message", async (message)=>{
    var message = message.data;
    console.log("Recived message:", message)
    try {
        var data = JSON.parse(message);
    } catch {
        return;
    }
    if (data.type == "request") {
        console.log("Recived request for file", data.filename);
        ws.send(JSON.stringify({
            type: "request_response",
            request_id: data.request_id,
            response: readFileSync(config.src + "\\" + data.filename).toString(),
        }));
    }
});

ws.addEventListener("close", ()=>{
    console.log("Connection to server closed");
    if (watcher)
        watcher.close()
});