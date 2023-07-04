function startDebug() {
    console.log("cmd:" + objToString(game.running));
    game.timer = setInterval(updateDebug, 10);
}

function startGroupDebug() {
    console.log("cmd:" + objToString(game.running));
    game.timer = setInterval(updateGroupDebug, 10);
}

function updateGroupDebug() {
    let cmdCount = game.cmds.length;
    let d = run(0);
    game.totalDist += d;
    while (d > 0 && d < game.speed) {
        let x = run(d);
        if (x == -1) {
            break;
        }
        game.totalDist += x;
        d += x;
    }

    let stop = cmdCount != game.cmds.length;

    game.speed += game.speedAdd;
    if (game.timer > 0 && stop) {
        clearInterval(game.timer);
        game.timer = -1;
    }
    draw();
}

function updateDebug() {
    let cmd = game.running;
    if (cmd.type != CmdType.COLLIDE) {
        onfinish();
        return;
    }
    let ball = rdata.balls[cmd.id-1];
    ball.dist = 0;
    if (ball.status == BallStatus.CREATING) {
        ball.status = BallStatus.MOVING;
    }
    let d = game.speed - ball.dist;
    let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
    if (dist <= d) {
        if (cmd.reflect == null) {
            ball.status = BallStatus.DESTROY;
        } else {
            assignPoint(cmd.reflect, ball.dir);
        }
        assignPoint(cmd.target, ball);
        ball.target = null;
        ball.dist += dist;

        // 移除死亡的单位
        if (cmd.dmg != null && cmd.dmg.hp == 0) {
            rdata.lines = removeDead(rdata.lines, cmd.dmg.id);
        }
        game.running = null;
        clearInterval(game.timer);
        game.timer = -1;
    } else {
        ballMove(ball, d);
    }

    draw();
}
