import {} from "./web.js";
import { readDataFile } from "./data.js";

var networks = readDataFile("networks.json");
var networkData = readDataFile("networks.json");

export function getNetworkForToken(token) {
    for (var id in networks) {
        var data = networks[id];
        if (data.token == token) {
            return id;
        }
    }
    return null;
}