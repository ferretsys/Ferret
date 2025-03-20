function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

function setCookie(name, value) {
    document.cookie = `${name}=${value};expires=${new Date(Date.now() + 356 * 1000 * 60 * 60 * 24).toUTCString()};`;
}