var sources_context = getCurrentLoadContext();

var table = new DataTable([
    new DataTableCell("Name", (cell, entry, data) => {
        return cell.textLabel(entry.key);
    }),
    new DataTableCell("Subscribers", (cell, entry, data) => {
        return cell.textLabel(entry.subscribers);
    }),
    new DataTableCell("Remove", (cell, entry, data) => {
        return cell.button("Remove", () => {
            tryRemoveDataSource(entry.key)
        }, "remove_data_source_button_" + entry.key.replaceAll(".", "_"));
    }),
    new DataTableCell("Open", (cell, entry, data) => {
        return cell.button("Open", () => {
            window.open(`./data.html?data_source=${entry.key}`, '_blank', 'width=800,height=600');
        });
    }),
], ["data_sources"], "data_sources");

table.build();

function tryRemoveDataSource(name) {
    callServerSocketApi("remove_data_source", {
        name: name
    }).then((data) => {
        if (!data.silent) {
            inputIssue("remove_data_source_button_" + name.replaceAll(".", "_"), data.result)
        } else {
            console.log(data.result)
        }
    });
}
sources_context.getElementById("data_sources_list").appendChild(table.element);