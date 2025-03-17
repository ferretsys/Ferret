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
}