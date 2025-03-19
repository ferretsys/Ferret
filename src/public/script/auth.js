function getAuthKeyFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === 'authToken') {
            return decodeURIComponent(value);
        }
    }
    return null;
}

window.CurrentAuthKey = getAuthKeyFromCookie();
console.log('Auth Token:', CurrentAuthKey);

if (CurrentAuthKey == null) {
    window.location = "/get_auth.html";
} else {
    fetch("/validate_token", {
        method: "POST",
        body: CurrentAuthKey
    }).then(async (response) => {
        var response = await response.json();
        if (response.type != "is_valid_token") {
            window.location.href = "/get_auth.html";
        }
    })
}

function signout() {
    document.cookie = "authToken=none;expires=" + new Date(0).toUTCString() + ";";
    window.location.href = "/get_auth.html"
}