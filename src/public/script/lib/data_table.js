var activeDataTables = [];

class DataTableCell {
    constructor(headerTitle, builder) {
        this.title = headerTitle;
        this.builder = builder;
    }

    createElementForNewData(entry, data) {
        return this.builder(this, entry, data);
    }

    textLabel(content) {
        var span = document.createElement("span");
        span.innerText = content;
        return span;
    }

    statusIndicator(statusName, tooltip) {
        var indicator = document.createElement("div");
        indicator.classList.add("color-indicator-cell");
        indicator.style.backgroundColor = `var(--status-${statusName})`;
        if (tooltip) {
            tippy(indicator, {
                content: tooltip,
            });
        }
        return indicator;
    }

    inlineStatusIndicator(statusName, tooltip) {
        var indicator = document.createElement("div");
        indicator.classList.add("color-indicator-cell", "inline-status-indicator");
        indicator.style.backgroundColor = `var(--status-${statusName})`;
        if (tooltip) {
            tippy(indicator, {
                content: tooltip,
            });
        }
        return indicator;
    }
    heartbeatIndicator(group, id) {
        var indicator = this.statusIndicator("none");
        indicator.classList.add("heartbeat-indicator");
        var className = "heartbeat-" + group + "-" + id;
        indicator.classList.add(className);
        var existingHeartbeat = heartbeats[className] || 0;
        if (Date.now() - existingHeartbeat < 2000) {
            var animation = animateHeartbeat(indicator);
            animation.currentTime = Date.now() - existingHeartbeat;
        }
        return indicator;
    }

    selectionTree(startNode, defaultValue, onchange) {
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
    }

    selectionList(values, defaultValue, onchange) {
        var selectionContainer = document.createElement("div")

        var valueBox = document.createElement("div");
        valueBox.classList.add("dropdown-button");
        valueBox.addEventListener("click", () => {options.style.display = options.style.display == "none" ? null : "none"});

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
            option.addEventListener("click", () => {
                valueBox.innerText = content;
                onchange(value);
            });
            options.appendChild(option);
        }
        
        valueBox.innerText = defaultContent || "Unknown";
        selectionContainer.appendChild(valueBox);
        selectionContainer.appendChild(options);
        return selectionContainer;
    }

    button(text, onclick, id) {
        var button = document.createElement("button");
        if (id) button.id = id;
        button.innerText = text;
        button.addEventListener("click", onclick);
        return button;
    }

    createElement(type, className, id) {
        var element = document.createElement(type);
        if (id) element.id = id;
        if (className) element.classList.add(className);
        return element;
    }

}

class DataTable {
    constructor(fields, sources, entriesSource) {
        this.fields = fields;
        this.sources = sources;
        this.entriesSource = entriesSource;
        this.element = document.createElement("div");
        this._innerElement = document.createElement("table");
        this.element.appendChild(this._innerElement);
        this.content = {};
        activeDataTables.push(this);
    }

    update() {
        var newInner = document.createElement("table");

        var headerRow = document.createElement("tr");
        for (var field of this.fields) {
            var newCell = document.createElement("th");
            newCell.innerText = field.title;
            headerRow.appendChild(newCell);
        }
        newInner.appendChild(headerRow);

        for (var key in this.content[this.entriesSource]) {
            var entry = this.content[this.entriesSource][key];
            entry = {...entry, key: key};
            var newRow = document.createElement("tr");

            for (var field of this.fields) {
                var newCell = document.createElement("td");
                newCell.appendChild(field.createElementForNewData(entry, this.content));
                newRow.appendChild(newCell);
            }

            newInner.appendChild(newRow);
        }

        this._innerElement.remove();
        this.element.appendChild(newInner);
        this._innerElement = newInner;
    }

    build() {
        emitServerSocketApi("needs_data_for_table_content", { sources: this.sources });
    }

    unbind() {
        activeDataTables.splice(activeDataTables.indexOf(this), 1);
    }
}

var dataContentConsumers = [];

function addDataContentConsumer(source, consumer) {
    dataContentConsumers.push({consumer: consumer, source: source});
}

setServerSocketMessageTypeHandler("data_content", (data) => {
    console.log("Recived data table content", data);

    var dataSourceTarget = data.source;
    var dataContent = data.content;
    
    for (var activeDataTable of activeDataTables) {
        if (activeDataTable.sources.indexOf(dataSourceTarget) != -1) {
            activeDataTable.content[dataSourceTarget] = dataContent;
            activeDataTable.update();
        }
    }

    for (var consumer of dataContentConsumers) {
        if (consumer.source == dataSourceTarget) {
            consumer.consumer(dataContent);
        }
    }
});

var heartbeats = {};

function animateHeartbeat(element) {
    return element.animate([
        { backgroundColor: "var(--status-heartbeat)" },
        { backgroundColor: "var(--status-heartbeat)" },
        { backgroundColor: "var(--status-none)" },
      ], { duration: 2000, iterations: 1 });
}

setServerSocketMessageTypeHandler("heartbeat_tick", (data) => {
    // console.log("Recived data heartbeat content", data);
    heartbeats["heartbeat-" + data.group + "-" + data.id] = Date.now();
    for (var element of document.getElementsByClassName("heartbeat-" + data.group + "-" + data.id)) {
        animateHeartbeat(element);
    }
});

emitServerSocketApi("needs_data_for_all_table_content");