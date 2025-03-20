const socket = new WebSocket("/socket/web");
var isOpen = false;
socket.onopen = () => {isOpen = true};

var nextRequestId = 0;
function getNextRequestId() {
    return nextRequestId++;
}

var requestPromises = {};

var refreshHandlers = {};
var messageTypeHandlers = {};

function addServerSocketRefreshHandler(id, handler) {
    refreshHandlers[id] = handler;
}

function setServerSocketMessageTypeHanlder(type, handler) {
    messageTypeHandlers[type] = handler;
}

socket.addEventListener("message", (content) => {
    var data = JSON.parse(content.data);

    if (data.type == "request_response") {
        if (requestPromises[data.request_id]) {
            requestPromises[data.request_id].resolve(data.response)
            delete requestPromises[data.request_id]
        }
        return;
    }
    if (data.type == "refresh_content") {
        if (refreshHandlers[data.content_id])
            refreshHandlers[data.content_id](data.content)
        else console.log("Recived refresh for id not present " + data.content_id);
        return;
    }
    if (messageTypeHandlers[data.type]) {
        messageTypeHandlers[data.type](data);
        return;
    }

    console.log("Unknown message", data);
})

async function emitServerSocketApi(endpoint, body) {
    if (!isOpen) {
        await new Promise((resolve, reject) => {
            socket.addEventListener("open", resolve);
        })
    }
    if (body == null) body = {}
    if (CurrentAuthKey == null) {
        throw "Tried to call api without a authkey";
    }

    socket.send(JSON.stringify({
        type: "emit",
        endpoint: endpoint,
        body: body
    }));
}

async function callServerSocketApi(endpoint, body) {
    if (!isOpen) {
        await new Promise((resolve, reject) => {
            socket.addEventListener("open", resolve);
        })
    }
    if (body == null) body = {}
    if (CurrentAuthKey == null) {
        throw "Tried to call api without a authkey";
    }

    var requestId = getNextRequestId();

    var requestContent = {
        type: "request",
        request_id: requestId,
        endpoint: endpoint,
        body: body
    };

    var requestEntry = {
        content: requestContent,
        resolve: null
    }

    var requestPromise = new Promise((resolve, reject) => {
        requestEntry.resolve = resolve;
    });

    requestPromises[requestId] = requestEntry;

    socket.send(JSON.stringify(requestContent));

    return requestPromise;
}