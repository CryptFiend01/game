const BallStatus = {
    CREATING : 1,
    MOVING : 2,
    MOVED : 3,
    DESTROY : 4
}

const GameState = {
    GS_AIM : 1,
    GS_PLAY : 2,
    GS_FINISH : 3,
    GS_DEBUG : 4,
    GS_GROUP_DEBUG : 5
}

let game = {
    status: GameState.GS_AIM,
    aimDir: {x: 0, y: 0},
    collisions : [], // {x: 0, y: 0, radius: 2, color: "#1234bc"}
    base: {x: 250, y: 800},
    times: 10,
    timer: -1,
    basSpeed: 6,
    speed: 1,
    speedAdd: 0,
    running: null,
    totalDist: 0,
    distInterval: 15,
    lastDist: 0,
    gameMode: GameState.GS_PLAY,

    cmds : null
}

function objToString(o) {
    let s = "{";
    let sep = "";
    for (let k in o) {
        s += sep + k + ":";
        if (typeof(o[k]) == "object") {
            s += objToString(o[k]);    
        } else {
            s += o[k];
        }
        if (sep == "")
            sep = ",";
    }
    s += "}";
    return s;
}

function loadBalls() {
    let cmd = game.cmds.shift();
    while (cmd.type == CmdType.CREATE_BALL) {
        rdata.balls.push({
            id: cmd.id,
            x: game.base.x,
            y: game.base.y,
            radius: 5,
            color: "#ac2243",
            dir: {x:cmd.dir.x, y:cmd.dir.y},
            status: BallStatus.CREATING,
            dist: 0,
        });
        cmd = game.cmds.shift();
    }
    game.running = cmd;
}

function onfinish() {
    if (game.cmds.length == 0) {
        game.status = GameState.GS_AIM;
        rdata.balls.length = 0;
        rdata.status = game.status;

        clearInterval(game.timer);
        game.timer = -1;

        if (game.running.type == CmdType.WIN) {
            console.log("win.");
            game.status = GameState.GS_FINISH;
            rdata.status = game.status;
            draw();
        }
    }
}

function ballMove(ball, dist) {
    if (dist) {
        ball.x += ball.dir.x * (dist - ball.dist);
        ball.y += ball.dir.y * (dist - ball.dist);
    } else {
        ball.x += ball.dir.x * (game.speed - ball.dist);
        ball.y += ball.dir.y * (game.speed - ball.dist);
    }
    ball.status = BallStatus.MOVED;
}

function moveAll(dist) {
    // 最后执行其他球的移动
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.MOVING) {
            ballMove(ball, dist);
        }
    }
}

function aim() {
    let n = game.aimDir;
    let start = game.base;
    let ignores = [];
    while (game.collisions.length < game.times) {
        let collide = getNextCollision(start, n, ignores);
        if (collide.point == null) {
            console.log("collide times:" + game.collisions.length);
            showVec("start", start);
            showVec("dir", n);
            console.log("collide:" + objToString(collide));
            break;
        }
            
        game.collisions.push({x: collide.point.x, y: collide.point.y, radius: 2, color: "#1234bc"});

        let reflect = getReflectNorm(n, collide.line);

        start = collide.point;
        n = reflect;
        let temp = [collide.line];
        for (let l of ignores) {
            if (pointInLine(start, l)) {
                temp.push(l);
            }
        }
        ignores = temp;
    }
    draw();
}

function update() {
    // 按照间隔解锁球,初始化一帧的状态
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.CREATING) {
            if (game.totalDist >= (ball.id - 1) * game.distInterval) {
                ball.status = BallStatus.MOVING;
                ball.dist = -(game.totalDist - (ball.id - 1) * game.distInterval);
            } else {
                break;
            }
        } else if (ball.status != BallStatus.DESTROY) {
            ball.status = BallStatus.MOVING;
            ball.dist = 0;
        }
    }

    // 优先执行命令，看看有没有碰撞
    let cmd = game.running;
    let moveDist = 0;
    while (true) {
        let ball = rdata.balls[cmd.id-1];
        if (ball.status != BallStatus.MOVING) {
            console.error("cmd ball is not moving.")
            break;
        }
        //console.log(">run cmd ball:" + objToString(ball));

        let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
        if (game.lastDist > 0 && dist > game.lastDist) {
            console.error("ball " + ball.id + " is far away from target. ");
            console.log("dist:" + dist + ", lastdist:" + game.lastDist);
            console.log("ball.id:" + ball.id + ", cmd.id:" + cmd.id);
            console.log("ball count:" + rdata.balls.length);
            showVec("last point", game.lastPt);
            showVec("current point", ball);
            showVec("target", cmd.target);
            if (ball.target)
                showVec("ball target", ball.target);
            else
                console.log("ball target is null");
            showVec("old dir", ball.dir);
            ball.dir = normalize({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
            showVec("new dir", ball.dir);
        }
        game.lastDist = dist;
        game.lastPt = copyPoint(ball);
        ball.target = copyPoint(cmd.target);
        //console.log("ball:" + objToString(ball));
        //console.log("dist:" + dist);
        if (dist <= game.speed - ball.dist) {
            if (cmd.reflect == null) {
                ball.status = BallStatus.DESTROY;
            } else {
                assignPoint(cmd.reflect, ball.dir);
            }
            assignPoint(cmd.target, ball);
            ball.target = null;
            ball.dist += dist;
            moveDist += dist;

            // 移除死亡的单位
            if (cmd.dmg != null && cmd.dmg.hp == 0) {
                rdata.lines = removeDead(rdata.lines, cmd.dmg.id);
            }

            cmd = game.cmds.shift();
            game.lastDist = 0;
            game.lastPt = null;
            game.running = cmd;
            //console.log("next cmd:" + objToString(cmd));
            if (cmd.type != CmdType.COLLIDE) {
                break;
            }
        } else {
            ballMove(ball);
            moveDist += game.speed;
            break;
        }
    }

    // 最后执行其他球的移动
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.MOVING) {
            ballMove(ball, moveDist);
        }
    }
    
    game.totalDist += moveDist;
    game.speed += game.speedAdd;

    draw();
    onfinish();
}

function initialze() {
    loadData(function () {
        initLogic(game.base, game.times, game.distInterval);
        initRender(ldata.lines, game.status, game.base, game.collisions);
        addEventListener("mousemove", (evt) => {
            let coord = document.getElementById("coord");
            coord.innerHTML = "坐标：" + evt.offsetX + "," + evt.offsetY;
            if (game.status != GameState.GS_AIM) {
                return;
            }
            game.collisions.length = 0;
            let v = {x: evt.offsetX - game.base.x, y: evt.offsetY - game.base.y};
            //let v = {x: 400 - game.base.x, y: 626 - game.base.y};
            game.aimDir = normalize(v);
            coord.innerHTML += "  方向：" + game.aimDir.x + "," + game.aimDir.y;
            aim();
        });

        addEventListener("mousedown", (evt) => {
            if (game.status != GameState.GS_AIM) {
                return;
            }
            game.status = game.gameMode;
            game.totalDist = 0;
            game.speed = game.basSpeed;
            rdata.status = game.status;
            startRound(game.aimDir);
            updateRound();
            game.cmds = ldata.cmds;
            console.log("cmd count:" + game.cmds.length);
            loadBalls();
            console.log("cmd count:" + game.cmds.length);
            if (game.status == GameState.GS_PLAY) {
                game.timer = setInterval(update, 10);
            } else if (game.status == GameState.GS_DEBUG) {
                startDebug();
            } else if (game.status == GameState.GS_GROUP_DEBUG) {
                startGroupDebug();
            }
        });

        addEventListener("keydown", (evt) => {
            if (game.status == GameState.GS_PLAY) {
                if (game.timer == -1) {
                    game.timer = setInterval(update, 10);
                } else {
                    clearInterval(game.timer);
                    game.timer = -1;
                }
            } else if (game.status == GameState.GS_AIM) {
                game.logaim = !game.logaim;
                aim();
            } else if (game.status == GameState.GS_DEBUG) {
                if (game.timer == -1) {
                    game.running = game.cmds.shift();
                    startDebug();
                }
            } else if (game.status == GameState.GS_GROUP_DEBUG) {
                if (game.timer == -1) {
                    game.running = game.cmds.shift();
                    startGroupDebug();
                }
            }
        })
    });   
}

initialze();
//test1();
//test();