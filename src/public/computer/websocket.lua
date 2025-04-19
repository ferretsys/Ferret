local socketHeaders = {
    COOKIE = "authToken=" .. Token .. ";" .. "computerid=" .. os.getComputerID() .. ";"
}
local socketHost = WsHost .. "/socket/computer";
local socket = http.websocket(socketHost, socketHeaders)
IsWebSocketValid = socket ~= false

SocketTimeOfLastReattempt = 0
SocketTimeOfLastSignal = 0
local reattemptInterval = 30
local lastFerretState = "none"
local resyncFerretState = nil

if not IsWebSocketValid then
    print("Failed to connect to websocket host " .. socketHost)
else
    print("Connected to websocket host " .. socketHost)
    SocketTimeOfLastSignal = os.clock()
end
SocketTimeOfLastReattempt = -999999

local function tryForWebSocketReconnection()
    if os.clock() - SocketTimeOfLastReattempt > reattemptInterval then
        print("Attempting reconnection " .. socketHost)
        SocketTimeOfLastReattempt = os.clock()
        socket = http.websocket(socketHost, socketHeaders)
        IsWebSocketValid = socket ~= false
        if not IsWebSocketValid then
            print("(Reattempt) Failed to connect to websocket host " .. socketHost)
        else
            print("Connected to websocket host " .. socketHost)
            lastFerretState = "reconnected"
            resyncFerretState = os.startTimer(1)
            SocketTimeOfLastSignal = os.clock()
        end
    end
end

local function endsWith(text, with)
    return string.sub(text, string.len(text) - string.len(with) + 1, string.len(text)) == with
end

local handlersByType = {}

function AddWebsocketHandlerOfType(type, handler)
    handlersByType[type] = handler
end

local function checkForNetworkEvents(event)
    if not IsWebSocketValid then
        tryForWebSocketReconnection()
        return
    end

    if event[1] == "websocket_closed" then
        IsWebSocketValid = false
        print("Websocket connection closed")
        tryForWebSocketReconnection()
        SocketTimeOfLastReattempt = os.clock()
    end

    local eventId = event[1]
    if eventId ~= "websocket_message" then
        return
    end
    SocketTimeOfLastSignal = os.clock()

    local message = event[3]
    -- print("Recived", message)

    local data = textutils.unserializeJSON(message);
    if data.type == "action" then
        if data.action == "refresh_computer_source" then
            SendFerretState("refreshing_computer_source");

            shell.run("rm /src/")
            shell.run("mkdir src")
            local startup = ""
            for index, fileData in ipairs(data.files) do
                if endsWith(fileData.name, "-startup.lua") then
                    startup = fileData.name
                end
                WriteAllFile("src/" .. fileData.name, fileData.content)
            end

            WriteAllFile("startup.txt", startup)
            print("Rebooting...")
            SendFerretState("rebooting")
            shell.run("reboot")
        end
    end

    local handler = handlersByType[data.type]
    if handler then
        local success, err = pcall(handler, data)
        if not success then
            print("Error in handler for type: " .. data.type .. " - " .. err)
            SendFerretState("package_network_error")
        end
    else
        print("No handler for type: " .. data.type .. " with data: " .. message)
    end
end

function RunWebsocketThread()
    local lastTimerId = os.startTimer(30) -- Used for causing a reconnection
    local socketHeartbeatTimerId = os.startTimer(10);
    while true do
        local eventData = { os.pullEvent() }
        if resyncFerretState ~= nil and eventData[1] == "timer" and eventData[2] == resyncFerretState then
            print("Sending new state")
            SendFerretState(lastFerretState)
            resyncFerretState = nil
        end
        if eventData[1] == "timer" and eventData[2] == lastTimerId then
            checkForNetworkEvents(eventData)
            lastTimerId = os.startTimer(30)
        elseif eventData[1] == "timer" and eventData[2] == socketHeartbeatTimerId then
            if IsWebSocketValid then
                socket.send("hb")
            end
            socketHeartbeatTimerId = os.startTimer(10)
        else
            checkForNetworkEvents(eventData)
        end
    end
end

function SendRawToServer(content)
    socket.send(textutils.serialiseJSON(content));
end

local order = 0
function SendFerretState(state)
    order = order + 1
    lastFerretState = state
    if not IsWebSocketValid then
        return
    end
    print("Sending ferret state", state)
    SendRawToServer({
        type = "computer_notify_ferret_state",
        state = state,
        order = order
    });
end
