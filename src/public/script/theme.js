
// <!-- <link rel="stylesheet" href="theme/dark.css"/> -->

//TODO: add to href so server can prefetch, if multiple pages

var themeTarget = getCookie("theme");
if (themeTarget) {
    var linkToStyle = document.createElement("link");
    linkToStyle.rel = "stylesheet";
    linkToStyle.href = "theme/" + themeTarget + ".css";
    document.head.appendChild(linkToStyle);
}

function toggleDarkMode() {
    var darkMode = getCookie("theme") == "dark";
    if (darkMode) {
        setCookie("theme", "light", 365);
    } else {
        setCookie("theme", "dark", 365);
    }
    location.reload();
}