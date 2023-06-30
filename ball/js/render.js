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
        drawNormal(l);
    }

    for (let ball of rdata.balls) {
        // 起点或者消失的球不画
        if (ball.status != BallStatus.CREATING && ball.status != BallStatus.DESTROY) {
            drawBall(ball);
        }
    }

    if (rdata.status == GameState.GS_AIM) {
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
    } else if (rdata.status == GameState.GS_FINISH) {
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

function drawBall({x, y, radius, color, dir}) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, radius, 0, 2*Math.PI);
    ctx.fill();

    if (dir) {
        drawLine({x1:x, y1:y, x2:x+dir.x*20, y2:y+dir.y*20, color:"#233488", width:1});
    }   
}

function drawNormal(l) {
    if (l.hide == 0) {
        let mid = {
            x: l.x1 + (l.x2 - l.x1) / 2,
            y: l.y1 + (l.y2 - l.y1) / 2
        }
        let normal = {
            x1: mid.x,
            y1: mid.y,
            x2: mid.x + l.normal.x * 10,
            y2: mid.y + l.normal.y * 10,
            color: "#338899",
            hide: 0
        }
        drawLine(normal);
    }
}

function drawLine({x1, y1, x2, y2, color, width=2, hide}) {
    ctx.beginPath();
    ctx.lineWidth = width;
    if (hide > 0) {
        ctx.strokeStyle = "#ee7788";
    } else {
        ctx.strokeStyle = color;
    }
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
