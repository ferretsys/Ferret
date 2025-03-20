var computers_context = getCurrentLoadContext();

//TODO remove implicit dependency on legacy main for avaliable client sources and avaliable client packages

var table = new DataTable([
    new DataTableCell("Id", (cell, data) => {
        return cell.textLabel(data.id);
    }),
    new DataTableCell("Cn", (cell, data) => {
        return cell.statusIndicator(data.connectedState ? "ok" : "none");
    }),
    new DataTableCell("Hb", (cell, data) => {
        return cell.heartbeatIndicator("computers", data.id);
    }),
    new DataTableCell("Source", (cell, data) => {
        return cell.selectionList(["default", ...avaliableClientSources], data.source, (value) => {
            emitServerSocketApi("set_computer_source", {
                computer_id: data.id,
                source: value
            });
        });
    }),
    new DataTableCell("Package", (cell, data) => {
        var packageDropdownOptions = convertPackageNamesToTree((Object.keys(avaliablePackages)));

        packageDropdownOptions.entries = packageDropdownOptions.entries || [];
        packageDropdownOptions.entries.push({value: null, text: "No package", class: "dropdown-option-no-package"});

        return cell.selectionTree(packageDropdownOptions, data.package || "No package", (value) => {
            emitServerSocketApi("set_computer_package", {
                computer_id: data.id,
                package: value.value
            });
        });
    }),
    new DataTableCell("Update", (cell, data) => {
        return cell.button("Update", () => {
            emitServerSocketApi("refresh_computer_source", {
                computer_id: data.id
            });
        });
    }),
    new DataTableCell("Remove", (cell, data) => {
        return cell.button("Remove", () => {
            tryRemoveComputer(data.id)
        }, "remove_computer_button_" + data.id);
    }),
], "computers");

table.build();

computers_context.getElementById("computers_table").appendChild(table.element);