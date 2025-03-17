import { readFileSync, writeFileSync } from "fs";

export function readDataFile(src) {
    return JSON.parse(readFileSync("./data/" + src));
}

export function saveDataFile(src, data) {
    writeFileSync("./data/" + src, JSON.stringify(data, null, 2));
}