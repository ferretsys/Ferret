import { SERVER_HASH } from "../server_requests.js";

const socket = new WebSocket('ws://localhost:83');

var reconnectionAttempts = 0;

var serverStartTime = Date.now();

var currentSocket = null;

var statistics = {
    uptime: 0
}

function sendMonitorStatistics() {
    if (currentSocket == null) return;
    currentSocket.send(JSON.stringify({
        type: "statistics",
        data: statistics
    }));
}

function sendServerStatistics() {
    if (currentSocket == null) return;
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(ipapiData => {
            if (currentSocket != null)
                currentSocket.send(JSON.stringify({
                    type: "server_statistics",
                    data: {
                        started: serverStartTime,
                        commit_hash: SERVER_HASH,
                        location: ipapiData.country + "/" + ipapiData.region + "/" + ipapiData.city,
                        ip: ipapiData.ip,
                    }
                }));
        })
        .catch(error => {
            console.error('Error fetching location data for server:', error);
        });
}

function buildConnection(socket) {
    reconnectionAttempts = 0;
    currentSocket = socket;
    socket.addEventListener('open', () => {
        console.log('Connected to internal WebSocket server');
        sendServerStatistics();
        setInterval(() => {
            socket.send(JSON.stringify({ type: 'heartbeat' }));

            statistics.uptime = Math.floor((Date.now() - serverStartTime) / 1000);
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
        if (reconnectionAttempts > 10) {
            console.error('Failed to reconnect after 10 attempts, silencing attempts.');
        } else {
            console.log('Reconnecting to WebSocket server...');
        }
        const newSocket = new WebSocket('ws://localhost:83');
        buildConnection(newSocket);
    }, 5000);
}
