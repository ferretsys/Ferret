const TRAIL_TICK_RATE_MS = 250;

var renderData = {
    objects: {

    },
    pointcloud: {
        base: [
            
        ]
    }
}

for (var i = 0; i < 2500; i++) {
    var x = 10 * (i % 50);
    var z = 10 * (i / 50);
    renderData.pointcloud.base.push([
        50 - x, 7 * Math.sin(x) / 7 + 20 * Math.sin(z) / 4,  50 -z,
        "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ")"
    ]);
}

const canvas = document.createElement('canvas');

var width = window.innerWidth;
var height = window.innerHeight;

console.log("Width: " + width + ", Height: " + height);

canvas.width = width;
canvas.height = height;

dataContainer.innerHTML = "";
dataContainer.appendChild(canvas);

const render = new Renderer3d(canvas);

function renderGrid() {
    
    var gridSize = 128;
    var gridMin = -gridSize;
    var gridMax = gridSize;
    
    var mainGridStep = 16;

    var subgridColor = "#555555";
    var gridColor = "gray";

    for (let grid = gridMin; grid <= gridMax; grid += mainGridStep) {
        render.drawLine(
            new Vector3(grid, 0, gridMin),
            new Vector3(grid, 0, gridMax),
            1, subgridColor
        );
        render.drawLine(
            new Vector3(gridMin, 0, grid),
            new Vector3(gridMax, 0, grid),
            1, subgridColor
        );
    }
}

function draw() {
    render.tickViewMatrix();
    render.context.clearRect(0, 0, canvas.width, canvas.height);
    
    renderGrid();

    render.startPointBuffer();
    for (var groupId in renderData.pointcloud) {
        var group = renderData.pointcloud[groupId];
        for (var i = 0; i < group.length; i++) {
            var point = group[i];
            render.bufferPoint(new Vector3(point[0], point[1], point[2]), 5, point[3]);
        }
    }
    render.renderPointBuffer();

    // for (let grid = 0; grid <= gridCount / subgrid; grid++) {
    //     var isAxis = grid == (gridCount / subgrid / 2);
    //     var gridDrawPos = grid * subgrid * (gridWidth / gridCount) + 10;
    //     drawLine(gridPadding, gridDrawPos, 100 - gridPadding, gridDrawPos, isAxis ? "#457B9D" : gridColor);
    //     drawLine(gridDrawPos, 100 - gridPadding, gridDrawPos, gridPadding, isAxis ? "#E63946" :gridColor);
    // }

    // drawLine(50, 50, (value.x * 40) + 50, (-value.y * 40) + 50, "#0A8754", width=4);

    // context.font = "16px Arial";

    // context.save();
    // context.translate(renderWidth / 2, renderHeight / 2);

    // context.fillStyle = "#457B9D";
    // context.fillText(`x: ${value.x.toFixed(3)}`, 10, -10);
    
    // context.fillStyle = "#E63946";
    // context.rotate(Math.PI / 2);
    // context.fillText(`y: ${value.y.toFixed(3)}`, 10, -10);
    
    // context.restore();

    requestAnimationFrame(draw);
}

draw();

return {
    update: () => {}
}