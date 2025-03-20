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
SendRawToServer({
    type="computer_notify_ferret_state",
    state="startup"
});

local startup = ReadAllFile("startup.txt")

local function RunStartupThread()
    if startup ~= "" then
        print("Sent running")
        SendRawToServer({
            type="computer_notify_ferret_state",
            state="running",
            order=1
        });
        local startupStatus, err = pcall(function ()
            require("src/" .. string.sub(startup, 1, string.len(startup) - 4))
        end)

        if not startupStatus then
            print("Error in startup program", err)
            SendRawToServer({
                type="computer_notify_ferret_state",
                state="package_error" + err,
                order=2
            });
        end
    else
        term.setTextColor(colors.red);
        print("No startup specified")
        SendRawToServer({
            type="computer_notify_ferret_state",
            state="idle_no_startup",
            order=3
        });
        term.setTextColor(colors.white);
    end
end

parallel.waitForAll(RunStartupThread, RunWebsocketThread)