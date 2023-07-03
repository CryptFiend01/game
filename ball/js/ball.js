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
    timer: -1,
    basSpeed: 20,
    speed: 1,
    speedAdd: 0,
    running: null,
    totalDist: 0,
    times: 50,
    ballCount: 50,
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
            totalDist: 0
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
    let d = dist - ball.dist;
    ball.x += ball.dir.x * d;
    ball.y += ball.dir.y * d;
    ball.totalDist += d;
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

function run(pass) {
    let cmd = game.running;
    if (cmd.type != CmdType.COLLIDE) {
        onfinish();
        return -1;
    }

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

    let ball = rdata.balls[cmd.id-1];
    if (ball.status != BallStatus.MOVING) {
        console.error("Ball " + ball.id + " is not moving.");
        console.log("cmd:" + objToString(cmd));
        game.running = null;
        return -1;
    }
    let rest = game.speed - pass;
    let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
    if (dist <= rest) {
        moveAll(dist);

        if (cmd.reflect == null) {
            ball.status = BallStatus.DESTROY;
        } else {
            assignPoint(cmd.reflect, ball.dir);
        }

        // 移除死亡的单位
        if (cmd.dmg != null && cmd.dmg.hp == 0) {
            rdata.lines = removeDead(rdata.lines, cmd.dmg.id);
        }

        game.running = null;
        return dist;
    } else {
        moveAll(rest);
        return rest;
    }
}

function update() {
    if (game.running == null) {
        game.running = game.cmds.shift();
        //console.log("next cmd:" + objToString(game.running));
    }
    let d = run(0);
    //console.log("move length:" + d);
    game.totalDist += d;
    while (d > 0 && d < game.speed) {
        game.running = game.cmds.shift();
        //console.log("next cmd:" + objToString(game.running));
        let x = run(d);
        if (x == -1) {
            break;
        }
        //console.log("move length:" + x);
        game.totalDist += x;
        d += x;
    }

    game.speed += game.speedAdd;
    //console.log("speed:" + game.speed);
    
    draw();
}

function initialze() {
    loadData(function () {
        initLogic(game.base, game.times, game.distInterval, game.ballCount);
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
            game.collisions.length = 0;
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
            // for (let i = 0; i < 30; i++) {
            //     console.log(objToString(game.cmds[i]));
            // }
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
                    startGroupDebug();
                }
            }
        })
    });   
}

initialze();
//test1();
//test();