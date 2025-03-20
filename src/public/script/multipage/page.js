class RenderedPage {
    constructor(path, element) {
        this.path = path;
        this.element = element
    }
}

class ScriptContext {
    constructor(element) {
        this.element = element;
    }
    getElementById(id) {
        return this.element.querySelector("#" + id);
    }    
}

var renderedPages = {};
var pageContainer = document.getElementById("page_content");

var currentPageElement = null;
setCurrentPage(Pages[0]);

var currentLoadContext = null; //Used to transfer the element to the script being run

function getCurrentLoadContext() {
    return new ScriptContext(currentLoadContext);
}

async function setCurrentPage(page) {
    console.log("Loading page", page);
    if (typeof(page) != "string") throw "Set the current page to a non string value!";

    if (currentPageElement) {
        currentPageElement.remove();
    }

    if (renderedPages[page]) {
        pageContainer.appendChild(renderedPages[page].element);
    } else {
        var element = document.createElement("div");
        var response = await fetch("multipage/" + page + ".html");
        element.innerHTML = await response.text();

        renderedPages[page] = new RenderedPage(page, element);

        // var scriptResponse = await fetch();
        var script = document.createElement("script");
        script.src = "script/multipage/page/" + page + ".js"

        currentLoadContext = element;

        document.body.appendChild(script);

        pageContainer.appendChild(element);
    }
    currentPageElement = renderedPages[page].element;
    console.log("Loaded page");
}

function loadPageTree() {
    var startNode = convertUngroupedNamesToTree(Pages);
    
    var options = document.createElement("div");
    options.classList.add("page-selector-options");

    addSelectTreeNode(startNode, options, (value) => {
        setCurrentPage(value.value);
    });

    document.getElementById("page_navigator").appendChild(options);
}

loadPageTree();