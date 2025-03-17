function addTableListCell(tableRow, elmentBuilder) {
    var tableCell = document.createElement("td");
    tableCell.appendChild(elmentBuilder());
    tableRow.appendChild(tableCell);
}

function addTableListTextCell(tableRow, text) {
    addTableListCell(tableRow, ()=> {
        var box = document.createElement("p");
        box.innerText = text;
        return box;
    });
}

function addTableListButtonCell(tableRow, text, onclick, id) {
    addTableListCell(tableRow, ()=> {
        var box = document.createElement("button");
        if (id)
            box.id = id;
        box.innerText = text;
        box.addEventListener("click", onclick);
        return box;
    });
}

function addTableListSelectCell(tableRow, values, defaultValue, onchange) {
    addTableListCell(tableRow, ()=> {
        var box = document.createElement("select");
        for (var value of values) {
            var option = document.createElement("option");
            option.innerText = value;
            box.appendChild(option);
        }
        box.value = defaultValue;
        box.addEventListener("change", ()=>{onchange(box)});
        return box;
    });
}

var lastComputerData = {};
function handleComputerListDataUpdate(data) {
    lastComputerData = data;
    var targetElement = document.getElementById("computers_list");
    while (targetElement.children[0]) {
        targetElement.children[0].remove()
    }
    for (const computerId in data) {
        const computer = data[computerId];
        const tableRow = document.createElement("tr")
        
        for (const key in computer) {
            addTableListTextCell(tableRow, key + " : " + computer[key])
        }

        addTableListSelectCell(tableRow, ["default", ...avaliableClientSources], computer.source, (box)=>{
            emitServerSocketApi("set_computer_source", {
                computer_id: computerId,
                source: box.value
            });
        })

        addTableListSelectCell(tableRow, ["", ...Object.keys(avaliablePackages)], computer.package ? computer.package : "", (box)=>{
            emitServerSocketApi("set_computer_package", {
                computer_id: computerId,
                package: box.value
            });
        })

        addTableListButtonCell(tableRow, "Refresh Source", ()=>{
            emitServerSocketApi("refresh_computer_source", {
                computer_id: computerId
            });
        })

        targetElement.appendChild(tableRow);
    }
}

var avaliablePackages = {};
function handlePackagesListDataUpdate(data) {
    avaliablePackages = data;
    handleComputerListDataUpdate(lastComputerData);
    var targetElement = document.getElementById("packages_list");
    while (targetElement.children[0]) {
        targetElement.children[0].remove()
    }
    for (const packageName in data) {
        const package = data[packageName];
        const tableRow = document.createElement("tr")
        
        addTableListTextCell(tableRow, packageName)
        for (var k of package.files) {
            addTableListTextCell(tableRow, "file:" + k);
        }

        addTableListButtonCell(tableRow, "Delete", ()=>{
            tryRemovePackage(packageName)
        }, "remove_package_button_" + packageName.replaceAll(".", "_"))

        targetElement.appendChild(tableRow);
    }
}

function inputIssue(id, reason) {
    tippy("#" + id, {
        content: reason,
        trigger: "manual",
        delay: 500,
        theme: "light",
    })[0].show();
}

function submitNewPackage() {
    var nameInput = document.getElementById("add_package_name").value;
    var filesInput = document.getElementById("add_package_files").value;
    if (nameInput == "") return inputIssue("add_package_name", "Must not be empty");
    if (!/^[a-zA-Z 0-9\.]*$/.test(nameInput)) return inputIssue("add_package_name", "Invalid (can only be a-z, A-Z, 0-9, . or space)");
    if (filesInput == "") return inputIssue("add_package_files", "Must not be empty");
    if (!/^[a-zA-Z 0-9\.\/-]*$/.test(filesInput)) return inputIssue("add_package_files", "Invalid (can only be a-z, A-Z, 0-9, '.', ',', '-', '/' or space)");
    callServerSocketApi("add_new_package", {
        name: nameInput,
        files: filesInput
    }).then((data) => {
        if (!data.silent) {
            inputIssue("add_package_button", data.result)
        } else {
            console.log(data.result)
        }
        if (data.clear) {
            document.getElementById("add_package_name").value = "";
            document.getElementById("add_package_files").value = "";
        }
    });
}

function tryRemovePackage(name) {
    callServerSocketApi("remove_package", {
        name: name
    }).then((data) => {
        if (!data.silent) {
            inputIssue("remove_package_button_" + name.replaceAll(".", "_"), data.result)
        } else {
            console.log(data.result)
        }
        if (data.clear) {
            document.getElementById("add_package_name").value = "";
            document.getElementById("add_package_files").value = "";
        }
    });
}

addServerSocketRefreshHandler("computers_list", handleComputerListDataUpdate);
callServerSocketApi("get_data_for_computers_list").then((data) => {
    handleComputerListDataUpdate(data);
});

addServerSocketRefreshHandler("packages_list", handlePackagesListDataUpdate);
callServerSocketApi("get_data_for_packages_list").then((data) => {
    handlePackagesListDataUpdate(data);
});

var avaliableClientSources = [];
addServerSocketRefreshHandler("client_sources_list", (clientSources) => {
    avaliableClientSources = clientSources;
    handleComputerListDataUpdate(lastComputerData);
});
callServerSocketApi("get_data_for_client_sources_list").then((clientSources) => {
    avaliableClientSources = clientSources;
    handleComputerListDataUpdate(lastComputerData);
});

function copyInstallCommand() {
    var copyText = document.getElementById("install_command");

    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

document.getElementById("install_command").value =
    "wget run " + window.location.origin + "/computer/install.lua?token=" + CurrentAuthKey +
    "&host=" + window.location.origin +
    "&wshost=" + "ws://" + window.location.host;