local websocketHost = "ws://localhost:8080/cdn"
local socket = http.websocket(websocketHost)

local monitor = peripheral.wrap("right")
monitor.clear()
monitor.setCursorPos(1, 1)
function netLoop()
    if (not socket) then
        monitor.write("Failed to connect");
    end
    while true do        
        local data = {os.pullEvent()}
        if (data[1] == "websocket_message") then
            monitor.write(data[3]);
        end
        if (data[1] == "websocket_closed") then
            monitor.write("close " .. data[2]);
        end
    end
end

parallel.waitForAll(netLoop)