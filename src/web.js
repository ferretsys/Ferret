import bodyParser from "body-parser";
import express from "express";
import expressWs from "express-ws";
import path from "path";
import { fileURLToPath } from "url";
import { addComputerToServer, getNetworkForToken } from "./server.js";
import { applySockets } from "./sockets.js";
import { existsSync, readFileSync } from "fs";

const app = express();
expressWs(app);

const PORT = 80;

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

app.use(bodyParser.text())

app.get('/computer/install.lua', function (req, res) {
    var file = req.url.split("?")[0];
    var query = req.url.split("?")[1];

    var queryToken = /token=([^&]+)/.exec(query)[1];
    var queryHost = /host=([^&]+)/.exec(query)[1];
    var queryWsHost = /wshost=([^&]+)/.exec(query)[1];

    var content = readFileSync(publicDir + file).toString();

    content = content.replaceAll("${TOKEN}", queryToken);
    content = content.replaceAll("${HOST}", queryHost);
    content = content.replaceAll("${WSHOST}", queryWsHost);

    res.end(content);
});

app.post('/computer_startup', function (req, res) {
    var data = JSON.parse(req.body);
    addComputerToServer(getNetworkForToken(data.token), data.computer_id)
    res.end()
});

app.post('/validate_token', function (req, res) {
    var networkId = getNetworkForToken(req.body);
    if (networkId) {
        res.end(JSON.stringify({
            type: "is_valid_token",
            network_id: networkId
        }));
    } else { 
        res.end(JSON.stringify({
            type: "is_invalid_token"
        }))
    }
});

applySockets(app);
app.use(express.static(publicDir));

app.listen(PORT, () => {
    console.log(`Server is running on http://<host>:${PORT}`);
});

app.use((err, req, res, next) => {
    console.error(err.stack)
    next();
})