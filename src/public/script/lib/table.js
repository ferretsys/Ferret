function addTableCell(tableRow, elmentBuilder) {
    var tableCell = document.createElement("td");
    tableCell.appendChild(elmentBuilder());
    tableRow.appendChild(tableCell);
}

function addTableListTextCell(tableRow, text) {
    addTableCell(tableRow, ()=> {
        var box = document.createElement("p");
        box.innerText = text;
        return box;
    });
}

function addTableColorIndicatorCell(tableRow, color) {
    addTableCell(tableRow, ()=> {
        var box = document.createElement("div");
        box.classList.add("color-indicator-cell");
        box.style.backgroundColor = color;
        return box;
    });
}

function addTableListButtonCell(tableRow, text, onclick, id) {
    addTableCell(tableRow, ()=> {
        var box = document.createElement("button");
        if (id)
            box.id = id;
        box.innerText = text;
        box.addEventListener("click", onclick);
        return box;
    });
}

function addTableListSelectCell(tableRow, values, defaultValue, onchange) {
    addTableCell(tableRow, ()=> {
        var selectionContainer = document.createElement("div")

        var valueBox = document.createElement("div");
        valueBox.classList.add("dropdown-button");
        valueBox.addEventListener("click", ()=>{options.style.display = options.style.display == "none" ? null : "none"});

        var options = document.createElement("div");
        options.classList.add("dropdown-selector-options");
        options.style.display = "none";

        var defaultContent = null;
        for (const value of values) {
            var option = document.createElement("div");
            option.classList.add("dropdown-selector-option");
            if (value.class) option.classList.add(value.class);
            const content = value.text || value;
            if (content == defaultValue) {
                defaultContent = content;
            }
            option.innerText = content;
            option.addEventListener("click", ()=>{
                valueBox.innerText = content;
                onchange(value);
            });
            options.appendChild(option);
        }
        
        valueBox.innerText = defaultContent || "Unknown";
        selectionContainer.appendChild(valueBox);
        selectionContainer.appendChild(options);
        return selectionContainer;
    });
}

function addTableListSelectNode(node, target, valueBox, onchange) {
    if (node.name) {
        var nodeLabel = document.createElement("div");
        nodeLabel.classList.add("dropdown-selector-tree-label");
        nodeLabel.innerText = node.name;
        target.appendChild(nodeLabel);

        var nodeBox = document.createElement("div");
        nodeBox.classList.add("dropdown-selector-tree");
        target.appendChild(nodeBox);
        target = nodeBox;
    }

    if (node.children) {
        for (var child of Object.values(node.children)) {
            addTableListSelectNode(child, target, valueBox, onchange);
        }
    }

    if (node.entries) {
        for (const entry of node.entries) {
            var entryBox = document.createElement("div");

            entryBox.classList.add("dropdown-selector-option");
            if (entry.class) entryBox.classList.add(entry.class);

            entryBox.innerText = entry.text;
            entryBox.addEventListener("click", ()=>{
                valueBox.innerText = entry.value;
                onchange(entry.value);
            });
    
            target.appendChild(entryBox);
        }
    }
}

function addTableTreeSelectCell(tableRow, startNode, defaultValue, onchange) {
    addTableCell(tableRow, ()=> {
        var selectionContainer = document.createElement("div")

        var valueBox = document.createElement("div");
        valueBox.classList.add("dropdown-button");
        valueBox.addEventListener("click", () => {
            options.style.display =
                options.style.display == "none" ? null : "none"
        });

        var options = document.createElement("div");
        options.classList.add("dropdown-selector-options");
        options.style.display = "none";

        addTableListSelectNode(startNode, options, valueBox, onchange);

        valueBox.innerText = defaultValue;
        selectionContainer.appendChild(valueBox);
        selectionContainer.appendChild(options);
        return selectionContainer;
    });
}