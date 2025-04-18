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
SendFerretState("startup");

local startup = ReadAllFile("startup.txt")

local function RunStartupThread()
    if startup ~= "" then
        print("Sent running")
        SendFerretState("running");
        local startupStatus, err = pcall(function ()
            require("src/" .. string.sub(startup, 1, string.len(startup) - 4))
        end)

        if not startupStatus then
            print("Error in startup program", err)
            if (err == "Terminated") then
                SendFerretState("shutdown");
            else
                SendFerretState("package_error");
            end
        end
    else
        term.setTextColor(colors.yellow);
        print("No startup specified");
        term.setTextColor(colors.white);
        SendFerretState("idle_no_startup");
    end
end

parallel.waitForAll(RunStartupThread, RunWebsocketThread)