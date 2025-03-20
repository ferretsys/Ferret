var context = getCurrentLoadContext();

var lastComputerData = {};
function handleComputerListDataUpdate(data) {
    lastComputerData = data;
    var targetElement = context.getElementById("computers_list");
    while (targetElement.children[0]) {
        targetElement.children[0].remove()
    }

    const tableHeader = document.createElement("tr");
    tableHeader.classList.add("table-header")

    addTableListTextCell(tableHeader, "Id");
    addTableListTextCell(tableHeader, "Cn");
    addTableListTextCell(tableHeader, "Source");
    addTableListTextCell(tableHeader, "Package");
    addTableListTextCell(tableHeader, "Update");
    addTableListTextCell(tableHeader, "Remove");

    targetElement.appendChild(tableHeader);

    for (const computerId in data) {
        const computer = data[computerId];
        const tableRow = document.createElement("tr")
        
        addTableListTextCell(tableRow, computer.id);
        addTableColorIndicatorCell(tableRow, computer.connectedState ? "var(--status-ok)" : "var(--status-error)");

        addTableListSelectCell(tableRow, ["default", ...avaliableClientSources], computer.source, (value)=>{
            emitServerSocketApi("set_computer_source", {
                computer_id: computerId,
                source: value
            });
        })

        var packageDropdownOptions = convertPackageNamesToTree((Object.keys(avaliablePackages)));
        packageDropdownOptions.entries = packageDropdownOptions.entries || [];
        packageDropdownOptions.entries.push({value: null, text: "No package", class: "dropdown-option-no-package"});
        
        addTableTreeSelectCell(tableRow, packageDropdownOptions, computer.package || "No package", (value)=>{
            emitServerSocketApi("set_computer_package", {
                computer_id: computerId,
                package: value.value
            });
        })

        addTableListButtonCell(tableRow, "Refresh Source", ()=>{
            emitServerSocketApi("refresh_computer_source", {
                computer_id: computerId
            });
        })

        addTableListButtonCell(tableRow, "Remove", ()=>{
            tryRemoveComputer(computerId)
        }, "remove_computer_button_" + computerId)


        targetElement.appendChild(tableRow);
    }
}

function convertPackageNamesToTree(packageNames) {
    var baseNode = {};
    function walkAdd(node, directoryToWalk, entry) {
        if (directoryToWalk.length == 0) {
            node.entries = node.entries || [];
            node.entries.push(entry);
        } else {
            var nextDirectory = directoryToWalk.shift();
            node.children = node.children || {};
            node.children[nextDirectory] = node.children[nextDirectory] || {};
            node.children[nextDirectory].name = nextDirectory;
            walkAdd(node.children[nextDirectory], directoryToWalk, entry);
        }
    }

    for (var packageId of packageNames) {
        var packageDirectory = packageId.split(".");
        var name = packageDirectory.pop();
        var entry = {
            text: name,
            value: packageId
        };
        walkAdd(baseNode, packageDirectory, entry);
    }

    return baseNode;
}

var avaliablePackages = {};
function handlePackagesListDataUpdate(data) {
    avaliablePackages = data;
    handleComputerListDataUpdate(lastComputerData);
    var targetElement = context.getElementById("packages_list");
    while (targetElement.children[0]) {
        targetElement.children[0].remove()
    }
    
    const tableHeader = document.createElement("tr");
    tableHeader.classList.add("table-header")

    addTableListTextCell(tableHeader, "Name");
    addTableListTextCell(tableHeader, "File List");
    addTableListTextCell(tableHeader, "Delete");

    targetElement.appendChild(tableHeader);
    
    for (const packageName in data) {
        const package = data[packageName];
        const tableRow = document.createElement("tr");
        
        addTableListTextCell(tableRow, packageName)
        for (var k of package.files) {
            addTableListTextCell(tableRow, k);
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
    var nameInput = context.getElementById("add_package_name").value;
    var filesInput = context.getElementById("add_package_files").value;
    if (nameInput == "") return inputIssue("add_package_name", "Must not be empty");
    if (!/^[a-zA-Z 0-9\.]*$/.test(nameInput)) return inputIssue("add_package_name", "Invalid (can only be a-z, A-Z, 0-9, . or space)");
    if (filesInput == "") return inputIssue("add_package_files", "Must not be empty");
    if (!/^[a-zA-Z 0-9\.,\/-]*$/.test(filesInput)) return inputIssue("add_package_files", "Invalid (can only be a-z, A-Z, 0-9, '.', ',', '-', '/' or space)");
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
            context.getElementById("add_package_name").value = "";
            context.getElementById("add_package_files").value = "";
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
    });
}

function tryRemoveComputer(computerId) {
    callServerSocketApi("remove_computer", {
        computer_id: computerId
    }).then((data) => {
        console.log(data)
        if (!data.silent) {
            inputIssue("remove_computer_button_" + computerId, data.result)
        } else {
            console.log(data.result)
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
    var copyText = context.getElementById("install_command");

    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

function copyClientCommand() {
    var copyText = context.getElementById("client_command");

    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
}

context.getElementById("install_command").value =
    "wget run " + window.location.origin + "/computer/install.lua?token=" + CurrentAuthKey +
    "&host=" + window.location.origin +
    "&wshost=" + "ws://" + window.location.host;
    
context.getElementById("client_command").value =
    `node client ${(window.location.protocol == "https:" ? "wss:" : "ws:") + "//" + window.location.host} ${CurrentAuthKey}`;