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
        options.classList.add("selector-options");
        options.style.display = "none";

        var defaultContent = null;
        for (const value of values) {
            var option = document.createElement("div");
            option.classList.add("selector-option");
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
        options.classList.add("selector-options");
        options.style.display = "none";

        addSelectTreeNode(startNode, options, (value) => {
            valueBox.innerText = value.text;
            onchange(value);
        });

        valueBox.innerText = defaultValue;
        selectionContainer.appendChild(valueBox);
        selectionContainer.appendChild(options);
        return selectionContainer;
    });
}