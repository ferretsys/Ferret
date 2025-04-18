export class Connection {
    constructor(ws) {
        this.socket = ws;
        this.disconnectListeners = [];
    }

    addOnDisconnect(callback) {
        this.disconnectListeners.push(callback);
    }

    onDisconnect() {
        for (const callback of this.disconnectListeners) {
            callback();
        }
    }
}