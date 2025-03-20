
function updateStats() {
    callServerSocketApi("get_server_infos").then((data) => {
        document.getElementById("network_id").innerText = "(" + data.network_id + ")";
        var entries = [];
        for (var key in data.stats) {
            var value = data.stats[key];
            if (key == "hash") {
                value = `<a href='https://github.com/ferretsys/Ferret/commit/${value}'>${value}</a>`
            }
            entries.push(key + " - " + value);
        }
        document.getElementById("server_stats").innerHTML = `server info: ${entries.join(" / ")}`;
    });
}
updateStats();
setInterval(updateStats, 10000);