
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