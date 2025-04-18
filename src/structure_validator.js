export function isValidOrElseMessage(jsonObject, schema) {
    for (const key in schema) {
        if (!jsonObject.hasOwnProperty(key)) {
            return `Missing required key: ${key}`;
        }
        var expected = schema[key];
        if (schema[key] === "s") {
            expected = "string";
        }
        if (schema[key] === "n") {
            expected = "number";
        }
        if (typeof jsonObject[key] !== expected) {
            return `Invalid type for key: ${key}. Expected ${expected}, got ${typeof jsonObject[key]}`;
        }
    }
    return true;
}