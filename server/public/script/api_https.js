async function callServerHttpsApi(endpoint, body) {
    if (body == null) body = {}
    if (CurrentAuthKey == null) {
        throw "Tried to call api without a authkey";
    }
    const response = await fetch("api/" + endpoint, {
        method: "POST",
        body: body
    });
    return await await response.json();
}