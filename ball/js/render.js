const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

let rdata = {
    lines : [],
    balls : [],
    skillSelect: null,
    skillRange : {},
    skillRoles : [0,0,0,0,0],
    status : 1,
    baseLine: null,
}

function initRender(lines, status, base, collisions, roles) {
    setLines(lines);
    rdata.status = status;
    rdata.base = base;
    rdata.collisions = collisions;
    rdata.baseLine = {x1: 0, y1: base.y, x2: canvas.width, y2: base.y, color: "#aaaaaa", width:1}
    rdata.roles = roles;
}

function setLines(lines) {
    rdata.lines.length = 0;
    for (let l of lines) {
        let line = copyLine(l);
        if (line.solid) {
            line.setColor(ColorSet.LineSolid);
        } else {
            line.setColor(ColorSet.LineDash);
        }
        rdata.lines.push(line);
    }
}

function addSkillRange(cid, ranges) {
    let skillRanges = [];
    for (let r of ranges) {
        skillRanges.push({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            color: "rgba(255, 97, 97, 0.5)"
        });
    }
    rdata.skillRange[cid] = skillRanges;
}

function removeSkillRange(cid) {
    delete rdata.skillRange[cid];
}

function resetSkillRoles() {
    for (let i = 0; i < rdata.skillRoles.length; i++) {
        rdata.skillRoles[i] = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawDashLine(rdata.baseLine);

    for (let i = 0; i < rdata.roles.length; i++) {
        drawRole({x: i * 80 + 10, y: rdata.base.y + 60, width: 60, height: 80, color: rdata.roles[i].color, border:rdata.skillRoles[i] != 0});
    }

    for (let l of rdata.lines) {
        drawLine(l);
        for (let sl of l.hideLines) {
            drawLine(sl);
        }
        drawNormal(l);
    }

    for (let cid in rdata.skillRange) {
        let ranges = rdata.skillRange[cid];
        for (let r of ranges)
            drawRange(r);
    }

    for (let ball of rdata.balls) {
        // 起点或者消失的球不画
        if (ball.status != BallStatus.CREATING && ball.status != BallStatus.DESTROY && ball.y < Board.HEIGHT * Board.SIDE + 24) {
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
        } else if (rdata.begin != null) {
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
    } else if (rdata.status == GameState.GS_SKILL) {
        if (rdata.skillSelect) {
            rdata.skillSelect.color = "rgba(49, 194, 238, 0.5)";
            drawRange(rdata.skillSelect);
        }
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

function drawRole({x, y, width, height, color, border}) {
    ctx.beginPath();
    ctx.fillStyle = color;
    if (border) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#33bb33";
    }
    ctx.rect(x, y, width, height);
    if (border)
        ctx.stroke();
    ctx.fill();
}

function drawRange({x, y, width, height, color}) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.rect(x, y, width, height);
    ctx.fill();
}