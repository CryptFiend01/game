const dbgCanvas = document.getElementById("debug-canvas");
const dbgCtx = dbgCanvas.getContext("2d");

function queryForDebug() {
    let res = httpPost(uri + "/get_board", "user=" + game.user);
    if (!res || res.code != 0) {
        alert("init game failed!");
        return;
    }

    //console.log(objToString(res.data));
    drawDebug(res.data);
}

function drawDebug(data) {
    dbgCtx.clearRect(0, 0, Canvas.width, Canvas.height);

    for (let l of data.lines) {
        if (l.solid) {
            l.color = ColorSet.LineSolid;
        } else {
            l.color = ColorSet.LineDash;
        }
        
        drawLine(dbgCtx, l);
        if (l.hideLines) {
            for (let sl of l.hideLines) {
                drawLine(dbgCtx, sl);
            }
        }
        drawNormal(dbgCtx, l);
    }

    for (let ball of data.balls) {
        if (ball.id <= 0) {
            continue;
        }
        // 起点或者消失的球不画
        if (ball.y < Board.HEIGHT * Board.SIDE + 24) {
            ball.color = config.roles[ball.rid-1].color;
            ball.radius = 5;
            drawBall(dbgCtx, ball);
        }
    }
}