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

const authKey = getAuthKeyFromCookie();
console.log('Auth Token:', authKey);

if (authKey == null) {
    window.location = "/get_auth.html";
}