import { publicIpv4 } from "public-ip";
import { SERVER_HASH } from "../server_requests.js";
import fastGeoIp from "doc999tor-fast-geoip";

const socket = new WebSocket('ws://localhost:83');

var reconnectionAttempts = 0;

var serverStartTime = Math.floor(Date.now() / 1000);

var currentSocket = null;

var statistics = {
    timestamp: 0
}

function sendMonitorStatistics() {
    if (currentSocket == null) return;
    currentSocket.send(JSON.stringify({
        type: "runtime_statistics",
        data: statistics
    }));
}

async function sendServerStatistics() {
    if (currentSocket == null) return;
    publicIpv4()
        .then(ip => {
            fastGeoIp.lookup(ip)
            .then(geoData => {
                if (currentSocket != null)
                    currentSocket.send(JSON.stringify({
                        type: "server_statistics",
                        data: {
                            uptime: serverStartTime,
                            commit_hash: SERVER_HASH,
                            location: geoData.country + " " + geoData.region + " " + geoData.city,
                            ip,
                        }
                    }));
            })
            .catch(error => {
                console.warn('Failed to fetch location data for server', error);
                if (currentSocket != null)
                    currentSocket.send(JSON.stringify({
                        type: "server_statistics",
                        data: {
                            uptime: serverStartTime,
                            commit_hash: SERVER_HASH,
                            location: "unknown",
                            ip,
                        }
                    }));
            });
        })
        .catch(error => {
            console.warn('Failed to fetch ip data for server', error);
                if (currentSocket != null)
                    currentSocket.send(JSON.stringify({
                        type: "server_statistics",
                        data: {
                            uptime: serverStartTime,
                            commit_hash: SERVER_HASH,
                            location: "unknown",
                            ip: "offline",
                        }
                    }));
        });
}

function buildConnection(socket) {
    currentSocket = socket;
    socket.addEventListener('open', () => {
        reconnectionAttempts = 0;
        console.log('Connected to internal WebSocket server');
        sendServerStatistics();
        setInterval(() => {
            socket.send(JSON.stringify({ type: 'heartbeat' }));

            statistics.timestamp = Math.floor(Date.now() / 1000);
            sendMonitorStatistics();
        }, 10000);
    });

    socket.addEventListener('close', () => {
        console.log('Connection closed to internal monitoring WebSocket server');
        currentSocket = null;
        attemptRecconection();
    });

    socket.addEventListener('error', (error) => {
        console.error('Internal monitoring WebSocket error:', error);
        currentSocket = null;
        attemptRecconection();
    });
}

buildConnection(socket);

function attemptRecconection() {
    setTimeout(() => {
        reconnectionAttempts++;
        if (reconnectionAttempts == 2) {
            console.error(`(${reconnectionAttempts}) Failed to reconnect after 2 attempts, silencing attempts.`);
        } else if (reconnectionAttempts < 2) {
            console.log(`(${reconnectionAttempts}) Reconnecting to WebSocket server...`);
        }
        const newSocket = new WebSocket('ws://localhost:83');
        buildConnection(newSocket);
    }, 5000);
}
