function loginWithToken() {
    var tokenInput = document.getElementById("network_token_input").value;
    var inputText = /[a-zA-Z0-9]{50}/;

    if (!inputText.test(tokenInput)) {
        console.log("Invalid token");
        tippy("#network_token_input", {
            content: "Invalid token input",
            trigger: "manual",
            delay: 500,
            theme: "light",
        })[0].show();
        return;
    }

    fetch("/validate_token", {
        method: "POST",
        body: tokenInput
    }).then(async (response) => {
        var response = await response.json();
        if (response.type == "is_valid_token") {
            document.cookie = "authToken=" + tokenInput + ";expires=" + new Date(Date.now() + 356 * 1000 * 60 * 60 * 24).toUTCString() + ";";

            addToTokenHistory(tokenInput, response.network_id);

            window.location.href = "/index.html";
        } else {
            tippy("#network_token_input", {
                content: "Server rejected token! Check that it is up to date",
                trigger: "manual",
                delay: 500,
                theme: "light",
            })[0].show();
        }
    })
}

function addToTokenHistory(token, networkId) {
    var newHistoryEntry = networkId + ":" + token;
    var existingHistory = getTokenHistoryFromCookies();
    var shouldAdd = true;
    if (existingHistory) {
        for (var entry of existingHistory) {
            if (entry.token == token) {
                shouldAdd = false;
                break
            }
        }
        if (existingHistory.length > 10) {
            existingHistory.pop();
        }
    }
    if (shouldAdd) {
        newHistoryEntry += existingHistory ? "," + existingHistory.map((e)=>e.id + ":" + e.token).join(",") : "";
        document.cookie = "authTokenHistory=" + newHistoryEntry + ";expires=" + new Date(Date.now() + 356 * 1000 * 60 * 60 * 24).toUTCString() + ";";
    }
}

function getRecentTokensStringFromCookies() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === 'authTokenHistory') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

function getTokenHistoryFromCookies() {
    var recent = getRecentTokensStringFromCookies();
    if (recent) {
        var tokens = recent.split(",");
        tokens = tokens.map((tokenString) => {
            return {
                id: tokenString.split(":")[0],
                token: tokenString.split(":")[1]
            }
        })
        return tokens;
    }
    return null;
}

function fillInRecentTokens(history) {
    if (history == []) return;
    document.getElementById("recent_networks_label").style.display = "";
    var target = document.getElementById("network_token_recent");
    for (const entry of history) {
        var button = document.createElement("button");
        button.innerText = entry.id + " (" + entry.token + ")";
        button.addEventListener("click", () => {
            document.getElementById("network_token_input").value = entry.token;
        });
        target.appendChild(button);
        target.appendChild(document.createElement("br"));
    }
}

var recent = getTokenHistoryFromCookies();
if (recent) fillInRecentTokens(recent);