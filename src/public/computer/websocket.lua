local socketHeaders = {
    COOKIE="authToken=" .. Token .. ";" .. "computerid=" .. os.getComputerID() .. ";"
}
local socketHost = WsHost .. "/socket/computer";
local socket = http.websocket(socketHost, socketHeaders)
IsWebSocketValid = socket ~= false

SocketTimeOfLastReattempt = 0
SocketTimeOfLastSignal = 0
local reattemptInterval = 30

if not IsWebSocketValid then
    print("Failed to connect to websocket host " .. socketHost)
else
    print("Connected to websocket host " .. socketHost)
    SocketTimeOfLastSignal = os.clock()
end
SocketTimeOfLastReattempt = os.clock()

local function tryForWebSocketReconnection()
    if os.clock() - SocketTimeOfLastReattempt > reattemptInterval then
        SocketTimeOfLastReattempt = os.clock()
        socket = http.websocket(socketHost, socketHeaders)
        IsWebSocketValid = socket ~= false
        if not IsWebSocketValid then
            print("(Reattempt) Failed to connect to websocket host " .. socketHost)
        else
            print("Connected to websocket host " .. socketHost)
            SocketTimeOfLastSignal = os.clock()
        end
    end
end

local function endsWith(text, with)
    return string.sub(text, string.len(text)-string.len(with) + 1, string.len(text))==with
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
    print("Recived", message)

    local data = textutils.unserializeJSON(message);
    if data.type == "action" then
        if data.action == "refresh_computer_source" then
            SendRawToServer({
                type="computer_notify_state",
                state="refreshing_computer_source"
            });
            print("Refreshing source")

            
            for index, fileData in ipairs(data.files) do
                if (fileData == "404") then
                    SendRawToServer({
                        type="computer_notify_state",
                        state="missing_file_for_reboot"
                    });
                    return
                end
            end

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
            SendRawToServer({
                type="computer_notify_state",
                state="rebooting"
            });
            shell.run("reboot")
        end
    end
end

function RunWebsocketThread()
    while true do
        local eventData = {os.pullEvent()}
        checkForNetworkEvents(eventData)
    end
end

function SendRawToServer(content)
    socket.send(textutils.serialiseJSON(content));
end