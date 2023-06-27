const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

let rdata = {
    lines : [],
    balls : [],
    status : 1,
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    for (let l of rdata.lines) {
        drawLine(l);
    }

    for (let ball of rdata.balls) {
        // 起点或者消失的球不画
        if (ball.status != BallStatus.CREATING && ball.status != BallStatus.DESTROY) {
            drawBall(ball);
        }
    }

    if (rdata.status == 1) {
        drawBall({x: rdata.base.x, y: rdata.base.y, radius: 5, color: "#ac2234"});
        if (rdata.collisions.length > 0) {
            let start = rdata.base;
            for (let i = 0; i < rdata.collisions.length; i++) {
                drawBall(rdata.collisions[i]);
                let end = rdata.collisions[i];
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
                x: rdata.base.x + rdata.begin.x * 1400,
                y: rdata.base.y + rdata.begin.y * 1400
            }
            drawDashLine({
                x1: rdata.base.x,
                y1: rdata.base.y,
                x2: target.x,
                y2: target.y,
                color: "gray",
                width: 1
            });
        }
    } else if (rdata.status == 3) {
        ctx.font = 'bold 60px 微软雅黑';
        var grandient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        grandient.addColorStop('0', "magenta");
        grandient.addColorStop('0.3', 'blue');
        grandient.addColorStop('1.0', 'red');
        //用渐变填色
        ctx.fillStyle = grandient;
        ctx.fillText('赢   了', canvas.width / 2 - 100, canvas.height / 2 - 10);
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
