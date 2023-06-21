const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

let rdata = {
    lines : [],
    balls : [],
    collisions : []
}

function draw(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let l of data.lines) {
        drawLine(l);
    }

    for (let ball in data.balls) {
        if (ball.dir) {
            drawBall(ball);
        }
    }

    if (data.status == 1) {
        drawBall({x: data.ballBase.x, y: data.ballBase.y, radius: 5, color: "#ac2234"});
        if (data.collisions.length > 0) {
            let start = data.ballBase;
            for (let i = 0; i < data.collisions.length; i++) {
                drawBall(data.collisions[i]);
                let end = data.collisions[i];
                drawDashLine({
                    x1: start.x,
                    y1: start.y,
                    x2: end.x,
                    y2: end.y,
                    color: "gray",
                    width: 1
                });
                start = end;
            }
        } else {
            let target = {
                x: data.ballBase.x + data.begin.x * 1400,
                y: data.ballBase.y + data.begin.y * 1400
            }
            drawDashLine({
                x1: data.ballBase.x,
                y1: data.ballBase.y,
                x2: target.x,
                y2: target.y,
                color: "gray",
                width: 1
            });
        }
    }
}

function drawBall({x, y, radius, color}) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.fill();
}

function drawLine({x1, y1, x2, y2, color, width=2}) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawDashLine({x1, y1, x2, y2, color, width=2}) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    let old = ctx.getLineDash();
    ctx.setLineDash([20, 5]);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash(old);
}
