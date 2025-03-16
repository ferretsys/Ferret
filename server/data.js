import { readFileSync } from "fs";

export function readDataFile(src) {
    return JSON.parse(readFileSync("./data/" + src));
}