var packages_context = getCurrentLoadContext();

//TODO remove implicit dependency on legacy main for avaliable client sources and avaliable client packages

var table = new DataTable([
    new DataTableCell("Name", (cell, entry, data) => {
        return cell.textLabel(entry.key);
    }),
    new DataTableCell("Files", (cell, entry, data) => {
        return cell.textLabel(entry.files);
    }),
    new DataTableCell("Remove", (cell, entry, data) => {
        return cell.button("Remove", () => {
            tryRemovePackage(entry.key)
        }, "remove_package_button_" + entry.key.replaceAll(".", "_"));
    }),
], ["packages"], "packages");

table.build();

packages_context.getElementById("packages_table").appendChild(table.element);