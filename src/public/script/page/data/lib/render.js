class Renderer3d {

    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.viewMatrix = this.createOrthroViewMatrix(new Vector3(0, 0, 0), 1/4 * Math.PI, 45, this.width/100, this.height/100);
        this.poseStack = [];
        
        this.renderTimeStart = Date.now();
    }

    getRenderTimeMs() {
        return Date.now() - this.renderTimeStart;
    }

    tickViewMatrix() {
        var renderTime = this.getRenderTimeMs();
        this.viewMatrix = this.createOrthroViewMatrix(new Vector3(0, 0, 0), 1/4 * Math.PI, 45 + renderTime/10000, 1/100, 1/100);
    }

    createOrthroViewMatrix(position, pitch, yaw, xScale, yScale) {
        const viewMatrix = new Matrix4()
            .translate(-position.x, -position.y, -position.z)
            .rotateY(yaw)
            .rotateX(pitch)
            .scale(xScale, yScale, 1);

        return viewMatrix;
    }

    transformToScreen(position) {
        for (let i = this.poseStack.length-1; i >= 0; i++) {
            position = this.poseStack[i].transform(position);
        }
        position = this.viewMatrix.transform(position);
        return position;
    }

    pushPose(pose) {
        this.poseStack.push(pose);
    }

    popPose() {
        this.poseStack.pop();
    }

    startPointBuffer() {
        this.pointBuffer = [];
    }

    bufferPoint(position, size, color) {
        const screenPos = this.transformToScreen(position);
        this.pointBuffer.push({
            worldPosition: position,
            position: screenPos,
            size: size,
            color: color
        });
    }

    drawPoint(position, size, color) {
        const screenPos = this.transformToScreen(position);
        const x = (screenPos.x) * this.width / 2 + this.width / 2;
        const y = (screenPos.y) * this.height / 2 + this.height / 2;
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, size, 0, Math.PI * 2);
        this.context.fill();
        this.context.closePath();
    }
    
    drawPointOfScreenPos(screenPos, size, color) {
        const x = (screenPos.x) * this.width / 2 + this.width / 2;
        const y = (screenPos.y) * this.height / 2 + this.height / 2;
        this.context.fillStyle = color;
        this.context.beginPath();
        this.context.arc(x, y, size, 0, Math.PI * 2);
        this.context.fill();
        this.context.closePath();
    }

    getAdjacentPointChunks(x, y, z) {
        var chunks = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i == 0 && j == 0 && z == 0) {
                    continue;
                }
                for (let k = -1; k <= 1; k++) {
                    chunks.push(((x >> 4) + i) + "," + ((y >> 4) + j) + "," + ((z >> 4) + k));
                }
            }
        }
        return chunks;
    }

    renderPointBuffer() {
        this.pointBuffer.sort((a, b) => {
            return b.position.z - a.position.z;
        });
        var chunks = {};
        for (var point of this.pointBuffer) {
            const worldPosition = point.worldPosition;
            var key = (worldPosition.x >> 4) + "," + (worldPosition.y >> 4) + "," + (worldPosition.z >> 4);
            if (!chunks[key]) {
                chunks[key] = [];
            }
            chunks[key].push(point);
        }
        for (var point of this.pointBuffer) {
            var worldPosition = point.worldPosition;
            var position = point.position;
            var keys = this.getAdjacentPointChunks(worldPosition.x, worldPosition.y, worldPosition.z);
            var points = []
            for (var key of keys) {
                if (chunks[key]) {
                    points.push(...chunks[key]);
                }
            }
            points = points.sort((a, b) => {
                return Math.abs(a.worldPosition.x - worldPosition.x) + Math.abs(a.worldPosition.y - worldPosition.y) + Math.abs(a.worldPosition.z - worldPosition.z)
                - (Math.abs(b.worldPosition.x - worldPosition.x) + Math.abs(b.worldPosition.y - worldPosition.y) + Math.abs(b.worldPosition.z - worldPosition.z));
            });
            var count = 5;
            for (var chunkPoint of points) {
                if (count-- <= 0) break;
                this.drawLineOfScreenPos(position, chunkPoint.position, 1, "rgb(255, 255, 255, " + 0.5 + ")");
            }
        }
        for (let i = 0; i < this.pointBuffer.length; i++) {
            const point = this.pointBuffer[i];
            this.drawPointOfScreenPos(point.position, point.size, point.color);
        }
    }
    
    drawLine(positionFrom, positionTo, size, color) {
        const screenPosFrom = this.transformToScreen(positionFrom);
        const screenPosTo = this.transformToScreen(positionTo);
        if ((screenPosFrom.x > 1 || screenPosFrom.x < -1 || screenPosFrom.y > 1 || screenPosFrom.y < -1) 
         && (screenPosTo.x > 1 || screenPosTo.x < -1 || screenPosTo.y > 1 || screenPosTo.y < -1)) {
            // Check if the line spans the screen by calculating intersections with screen boundaries
            const clipLine = (p1, p2, min, max) => {
            const t = (min - p1) / (p2 - p1);
            return t >= 0 && t <= 1 ? t : null;
            };

            const tLeft = clipLine(screenPosFrom.x, screenPosTo.x, -1, 1);
            const tRight = clipLine(screenPosFrom.x, screenPosTo.x, 1, -1);
            const tTop = clipLine(screenPosFrom.y, screenPosTo.y, -1, 1);
            const tBottom = clipLine(screenPosFrom.y, screenPosTo.y, 1, -1);

            if (!tLeft && !tRight && !tTop && !tBottom) {
            return;
            }
        }
        const xFrom = (screenPosFrom.x) * this.width / 2 + this.width / 2;
        const yFrom = (screenPosFrom.y) * this.height / 2 + this.height / 2;
        const xTo = (screenPosTo.x) * this.width / 2 + this.width / 2;
        const yTo = (screenPosTo.y) * this.height / 2 + this.height / 2;
        this.context.strokeStyle = color;
        this.context.lineWidth = size;
        this.context.beginPath();
        this.context.moveTo(xFrom, yFrom);
        this.context.lineTo(xTo, yTo);
        this.context.stroke();
        this.context.closePath();
    }

    drawLineOfScreenPos(positionFrom, positionTo, size, color) {
        const xFrom = (positionFrom.x) * this.width / 2 + this.width / 2;
        const yFrom = (positionFrom.y) * this.height / 2 + this.height / 2;
        const xTo = (positionTo.x) * this.width / 2 + this.width / 2;
        const yTo = (positionTo.y) * this.height / 2 + this.height / 2;
        this.context.strokeStyle = color;
        this.context.lineWidth = size;
        this.context.beginPath();
        this.context.moveTo(xFrom, yFrom);
        this.context.lineTo(xTo, yTo);
        this.context.stroke();
        this.context.closePath();
    }

}