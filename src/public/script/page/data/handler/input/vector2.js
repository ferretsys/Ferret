const MAX_UPDATE_RATE_MS = 50;

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

const ratio = 900/800;

var width = window.innerWidth;
var height = window.innerHeight;

console.log("Width: " + width + ", Height: " + height);

const maxAxis = Math.min(width, height) * ratio;
var renderWidth = Math.min(width, maxAxis);
var renderHeight = Math.min(height, maxAxis);

console.log("(scaled) Width: " + width + ", Height: " + height);
canvas.width = width;
canvas.height = height;

dataContainer.innerHTML = "";
dataContainer.appendChild(canvas);

function drawLine(x1, y1, x2, y2, color = "gray", width=2) {
    context.beginPath();
    context.moveTo(x1 / 100 * renderWidth, y1 / 100 * renderHeight);
    context.lineTo(x2 / 100 * renderWidth, y2 / 100 * renderHeight);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
}

var mouseDown = false;
var value = {x: 0, y: 0};

function clampValue() {
    value.x = Math.max(-1, Math.min(value.x, 1));
    value.y = Math.max(-1, Math.min(value.y, 1));
}

function getValueOfMouse(mouseX, mouseY) {
    var x = ((mouseX / renderWidth) - 0.1) * (1 / 0.8) * 2 - 1;
    var y = ((mouseY / renderHeight) - 0.1) * (1 / 0.8) * 2 - 1;
    return {x: x, y: -y};
}

canvas.addEventListener("mousedown", function (event) {
    mouseDown = true;
    value = getValueOfMouse(event.clientX, event.clientY);
    clampValue();
    tickSendData();
});

canvas.addEventListener("mouseup", function (event) {
    mouseDown = false;
});

canvas.addEventListener("mousemove", function (event) {
    if (mouseDown) {
        value = getValueOfMouse(event.clientX, event.clientY);
        clampValue();
        tickSendData();
    }
});

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    var gridWidth = 80;
    var gridCount = 20;
    var subgrid = 5;
    var gridPadding = (100 - gridWidth) / 2;

    var subgridColor = "#555555";
    var gridColor = "gray";

    for (let grid = 0; grid <= gridCount; grid++) {
        var gridDrawPos = grid * (gridWidth / gridCount) + 10;
        drawLine(gridPadding, gridDrawPos, 100 - gridPadding, gridDrawPos, subgridColor);
        drawLine(gridDrawPos, 100 - gridPadding, gridDrawPos, gridPadding, subgridColor);
    }
    for (let grid = 0; grid <= gridCount / subgrid; grid++) {
        var isAxis = grid == (gridCount / subgrid / 2);
        var gridDrawPos = grid * subgrid * (gridWidth / gridCount) + 10;
        drawLine(gridPadding, gridDrawPos, 100 - gridPadding, gridDrawPos, isAxis ? "#457B9D" : gridColor);
        drawLine(gridDrawPos, 100 - gridPadding, gridDrawPos, gridPadding, isAxis ? "#E63946" :gridColor);
    }

    drawLine(50, 50, (value.x * 40) + 50, (-value.y * 40) + 50, "#0A8754", width=4);

    context.font = "16px Arial";

    context.save();
    context.translate(renderWidth / 2, renderHeight / 2);

    context.fillStyle = "#457B9D";
    context.fillText(`x: ${value.x.toFixed(3)}`, 10, -10);
    
    context.fillStyle = "#E63946";
    context.rotate(Math.PI / 2);
    context.fillText(`y: ${value.y.toFixed(3)}`, 10, -10);
    
    context.restore();

    requestAnimationFrame(draw);
}

draw();

var sendTimeout = null;
var lastDataSend = 0;

function tickSendData() {
    if (sendTimeout != null) {
        return;
    }
    if (lastDataSend + MAX_UPDATE_RATE_MS > Date.now()) {
        sendTimeout = setTimeout(function () {
            sendTimeout = null;
            sendDataPacket();
        }, MAX_UPDATE_RATE_MS);
        return;
    }
    sendDataPacket();
    lastDataSend = Date.now();
}

function sendDataPacket() {
    lastDataSend = Date.now();
    var data = {
        type: "new_data",
        entry: {
            x: value.x,
            y: value.y,
        },
    };

    dataSocket.send(JSON.stringify(data));
}

return {
    update: function (data, time) {},
}