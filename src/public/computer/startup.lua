function ReadAllFile(path)
    local file = fs.open(path, "r")
    if (file == nil) then
        return ""
    end
    local data = file.readAll()
    file.close()
    return data
end

function WriteAllFile(path, data)
    local file = fs.open(path, "w")
    file.write(data)
    file.close()
end

Host = ReadAllFile("host.txt")
WsHost = ReadAllFile("wshost.txt")
Token = ReadAllFile("token.txt")

--Tells the server about this computer, but doesent do much else, maybe remove
http.post(Host .. "/computer_startup", textutils.serializeJSON({
    token = Token,
    computer_id = os.getComputerID()
}), { ["Content-Type"] = "text/plain"})

require("websocket")

local startup = ReadAllFile("startup.txt")

local function RunStartupThread()
    if startup ~= "" then
        require("src/" .. string.sub(startup, 1, string.len(startup) - 4))
    else
        print("No startup specified")
    end
end

parallel.waitForAll(RunStartupThread, RunWebsocketThread)