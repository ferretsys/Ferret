local token = "${TOKEN}"
local host = "${HOST}"
local wshost = "${WSHOST}"
print("Installing to " .. host .. " with " .. token)

shell.run("rm /*")

function WriteAllFile(path, data)
    local file = fs.open(path, "w")
    file.write(data)
    file.close()
end

WriteAllFile("host.txt", host)
WriteAllFile("wshost.txt", wshost)
WriteAllFile("token.txt", token)

shell.run("wget " .. host .. "/computer/startup.lua startup.lua")
shell.run("wget " .. host .. "/computer/websocket.lua websocket.lua")
shell.run("reboot")