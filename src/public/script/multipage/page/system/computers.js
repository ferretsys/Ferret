var computers_context = getCurrentLoadContext();

//TODO remove implicit dependency on legacy main for avaliable client sources and avaliable client packages

var table = new DataTable([
    new DataTableCell("Id", (cell, entry, data) => {
        return cell.textLabel(entry.id);
    }),
    new DataTableCell("Cn", (cell, entry, data) => {
        return cell.statusIndicator(entry.connectedState ? "ok" : "none");
    }),
    new DataTableCell("Hb", (cell, entry, data) => {
        return cell.heartbeatIndicator("computers", entry.id);
    }),
    new DataTableCell("Fe", (cell, entry, data) => {
        return cell.statusIndicator(entry.ferretState || "none", entry.ferretState);
    }),
    new DataTableCell("Source", (cell, entry, data) => {
        return cell.selectionList(["default", ...(data.sources || [])], entry.source, (value) => {
            emitServerSocketApi("set_computer_source", {
                computer_id: entry.id,
                source: value
            });
        });
    }),
    new DataTableCell("Package", (cell, entry, data) => {
        var packageDropdownOptions = convertPackageNamesToTree(Object.keys(data.packages || {}));

        packageDropdownOptions.entries = packageDropdownOptions.entries || [];
        packageDropdownOptions.entries.push({value: null, text: "No package", class: "dropdown-option-no-package"});

        return cell.selectionTree(packageDropdownOptions, entry.package || "No package", (value) => {
            emitServerSocketApi("set_computer_package", {
                computer_id: entry.id,
                package: value.value
            })
        });
    }),
    new DataTableCell("Update", (cell, entry, data) => {
        return cell.button("Update", () => {
            callServerSocketApi("refresh_computer_source", {
                computer_id: entry.id
            }).then((response) => {
                tippy("#refresh_computer_source_" + entry.id, {
                    content: response.result,
                    trigger: "manual",
                    delay: 500,
                    theme: "light",
                })[0].show();
            });
        }, "refresh_computer_source_" + entry.id);
    }),
    new DataTableCell("Remove", (cell, entry, data) => {
        return cell.button("Remove", () => {
            tryRemoveComputer(entry.id)
        }, "remove_computer_button_" + entry.id);
    }),
], ["computers", "packages", "sources"], "computers");

table.build();

computers_context.getElementById("computers_table").appendChild(table.element);