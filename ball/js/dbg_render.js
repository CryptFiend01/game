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
}