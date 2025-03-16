import { link, readFileSync } from "fs";

function parseConfig(text) {
    var entries = {};
    var lines = text.split("\n");
    for (var line of lines) {
        var data = line.split("=");
        entries[data[0]] = data[1];
    }
    return entries;
}

const config = parseConfig(readFileSync("./config.txt").toString());

console.log("Config :", config);

