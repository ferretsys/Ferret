function loginWithToken() {
    var input = document.getElementById("network_token_input").value;
    var inputText = /[a-zA-Z0-9]{50}/;

    if (!inputText.test(input)) {
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
        body: input
    }).then(async (response) => {
        var response = await response.text();
        if (response == "is_valid_token") {
            document.cookie = "authToken=" + input + ";expires=" + new Date(Date.now() + 356 * 1000 * 60 * 60 * 24).toUTCString() + ";";
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