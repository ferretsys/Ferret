
function addSelectTreeNode(node, target, onchange) {
    if (node.name) {
        var nodeLabel = document.createElement("div");
        nodeLabel.classList.add("tree-selector-group-label");
        nodeLabel.innerText = node.name;
        target.appendChild(nodeLabel);

        var nodeBox = document.createElement("div");
        nodeBox.classList.add("tree-selector-group");
        target.appendChild(nodeBox);
        target = nodeBox;
    }

    if (node.children) {
        for (var child of Object.values(node.children)) {
            addSelectTreeNode(child, target, onchange);
        }
    }

    if (node.entries) {
        for (const entry of node.entries) {
            var entryBox = document.createElement("div");

            entryBox.classList.add("tree-selector-option");
            if (entry.class) entryBox.classList.add(entry.class);

            entryBox.innerText = entry.text;
            entryBox.addEventListener("click", ()=>{
                onchange(entry);
            });
    
            target.appendChild(entryBox);
        }
    }
}

function convertUngroupedNamesToTree(names, seperator) {
    if (!seperator) seperator = "/";
    
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

    for (var name of names) {
        var packageDirectory = name.split(seperator);
        var text = packageDirectory.pop();
        var entry = {
            text: text,
            value: name
        };
        walkAdd(baseNode, packageDirectory, entry);
    }

    return baseNode;
}
