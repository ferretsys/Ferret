import { publicIpv4 } from "public-ip";
import { SERVER_HASH } from "../server_requests.js";
import fastGeoIp from "doc999tor-fast-geoip";
import os from "os";

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

function formatCPUUsages(cpus) {
    var usages = [];
    for (var cpu of cpus) {
        var total = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
        var usage = ((total - cpu.times.idle) / total) * 100;
        usages.push(usage.toFixed(2) + "%");
    }
    return usages.join(" | ");
}

var sendStatisticsInterval = null;
function buildConnection(socket) {
    currentSocket = socket;
    socket.addEventListener('open', () => {
        reconnectionAttempts = 0;
        console.log('Connected to internal WebSocket server');
        sendServerStatistics();
        sendStatisticsInterval = setInterval(() => {
            socket.send(JSON.stringify({ type: 'heartbeat' }));

            statistics.timestamp = Math.ceil(Date.now() / 1000);

            statistics.os_uptime = Math.ceil(os.uptime() / 60) + " minutes";
            
            statistics.os_memory = `${Math.ceil(os.freemem() / 1000000)}/${Math.ceil(os.totalmem() / 1000000)}MB free`;
            statistics.os_memory_usage = `${Math.ceil((1 - os.freemem() / os.totalmem()) * 100)}%`;

            statistics.os_cpu = os.cpus().length + " CPUS " + os.cpus()[0].model;
            statistics.os_cpu_usage = formatCPUUsages(os.cpus());

            const memoryUsage = process.memoryUsage();
            statistics.process_memory_usage_of_os = `${Math.ceil(memoryUsage.rss / os.totalmem())}%`;
            statistics.process_memory_usage_of_system = `${Math.ceil(memoryUsage.rss / (os.totalmem() - os.freemem()))}%`;
            statistics.process_memory_allocated = `${Math.ceil(memoryUsage.rss / 1000000)}MB`;
            statistics.process_memory_heap_total = `${Math.ceil(memoryUsage.heapTotal / 1000000)}MB`;
            statistics.process_memory_heap_used = `${Math.ceil(memoryUsage.heapUsed / 1000000)}MB`;
            statistics.process_memory_external_memory = `${Math.ceil(memoryUsage.external / 1000000)}MB`;

            sendMonitorStatistics();
        }, 10000);
    });

    socket.addEventListener('close', () => {
        console.log('Connection closed to internal monitoring WebSocket server');
        clearInterval(sendStatisticsInterval);
        currentSocket = null;
        attemptRecconection();
    });

    socket.addEventListener('error', (error) => {
        console.error('Error in internal WebSocket connection:');
        currentSocket = null;
        clearInterval(sendStatisticsInterval);
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
