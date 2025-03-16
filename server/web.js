import bodyParser from "body-parser";
import express from "express";
import expressWs from "express-ws";
import path from "path";
import { fileURLToPath } from "url";
import { getNetworkForToken } from "./server.js";

const app = express();
expressWs(app);

const PORT = 8080;

console.log(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public'))

app.use(bodyParser.text())

app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'public')));

var sockets = [];

app.ws("/cdn", function (ws, req) {
    console.log("connection")
    sockets.push(ws);
    ws.on('close', function () {
        sockets.splice(sockets.indexOf(ws), 1)
    });
});

app.post('/buttonclickfortesting', function (req, res) {
    console.log(req.body);
    for (var socket of sockets) {
        console.log("forrwarding " + req.body);
        socket.end(req.body)
    }
    res.end()
});

app.post('/validate_token', function (req, res) {
    if (getNetworkForToken(req.body) != null) {
        res.end("is_valid_token")
    } else { 
        res.end("is_invalid_token")
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

