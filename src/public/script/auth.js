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
        body: input
    }).then(async (response) => {
        var response = await response.text();
        if (response != "is_valid_token") {
            window.location.href = "/get_auth.html";
        }
    })
}