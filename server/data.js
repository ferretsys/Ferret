import { existsSync, readFileSync, writeFileSync } from "fs";

export function readDataFile(src) {
    if (existsSync("./run/" + src)) {
        return JSON.parse(readFileSync("./run/" + src));
    } else {
        console.log(src, "File does not exist, reverting to defaults")
        return JSON.parse(readFileSync("./defaults/" + src));
    }
}

export function saveDataFile(src, data) {
    writeFileSync("./run/" + src, JSON.stringify(data, null, 2));
}