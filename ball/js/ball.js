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
    base: {x: 200, y: 552},
    timer: -1,
    basSpeed: 3,
    speed: 1,
    speedAdd: 0,
    frame: 0,
    running: null,
    totalDist: 0,
    times: 50,
    roles: [
        { id: 1, count: 10, times: 50, color: "red" },
        { id: 2, count: 10, times: 50, color: "orange" },
        { id: 3, count: 10, times: 50, color: "purple" },
        { id: 4, count: 10, times: 50, color: "skyblue" },
        { id: 5, count: 10, times: 50, color: "cyan" }
    ],
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

function getNextTarget(ball) {
    ball.nextTarget = null;
    for (let cmd of game.cmds) {
        if (cmd.type == CmdType.COLLIDE && cmd.id == ball.id) {
            ball.nextTarget = cmd.target;
            break;
        }
    }
}

function loadBalls() {
    let cmd = game.cmds.shift();
    while (cmd.type == CmdType.CREATE_BALL) {
        let role = game.roles[cmd.cid - 1];
        let ball = {
            id: cmd.id,
            x: game.base.x,
            y: game.base.y,
            radius: 5,
            color: role.color,
            dir: {x:cmd.dir.x, y:cmd.dir.y},
            status: BallStatus.CREATING,
            dist: 0,
            totalDist: 0
        };
        getNextTarget(ball);
        rdata.balls.push(ball);
        cmd = game.cmds.shift();
    }
    game.running = cmd;
}

function onfinish() {
    if (game.cmds.length == 0) {
        game.status = GameState.GS_AIM;
        rdata.balls.length = 0;
        rdata.status = game.status;
        assignPoint(ldata.base, game.base);

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
    // if (ball.nextTarget) {
    //     let nextDist = length({x:ball.x-ball.nextTarget.x, y:ball.y-ball.nextTarget.y});
    //     if (nextDist < d) {
    //         console.error("ball " + ball.id + " move over next target, game.running.id=" + game.running.id);
    //     }
    // }
    ball.x += ball.dir.x * d;
    ball.y += ball.dir.y * d;
    ball.totalDist += d;
    ball.status = BallStatus.MOVED;
}

function getShortestBall() {
    let shortest = {dist:1e9, bid:0, target:{x:0,y:0}};
    for (let ball of rdata.balls) {
        let d = length({x:ball.x-ball.nextTarget.x, y:ball.y-ball.nextTarget.y});
        if (d < shortest.dist) {
            shortest.bid = ball.id;
            shortest.dist = d;
            assignPoint(ball.nextTarget, shortest.target);
        }
    }
    return shortest;
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
    let v = {x: cmd.target.x - ball.x, y: cmd.target.y - ball.y};
    let dist = length(v);
    if (dist <= rest) {
        moveAll(dist);

        if (cmd.reflect == null) {
            ball.status = BallStatus.DESTROY;
        } else {
            assignPoint(cmd.reflect, ball.dir);
            getNextTarget(ball);
        }

        // 移除死亡的单位
        if (cmd.dmg != null && cmd.dmg.hp == 0) {
            rdata.lines = removeDead(rdata.lines, cmd.dmg.id);
        }

        game.running = game.cmds.shift();
        return dist;
    } else {
        moveAll(rest);
        return rest;
    }
}

function update() {
    let d = run(0);
    game.totalDist += d;
    while (d > 0 && d < game.speed) {
        let x = run(d);
        if (x == -1) {
            d = -1;
            break;
        }
        game.totalDist += x;
        d += x;
    }

    if (d == -1) {
        onfinish();
    }

    game.speed += game.speedAdd;
    
    draw();
}

function initialze() {
    loadData(function () {
        initLogic(game.base, game.distInterval, game.roles);
        initRender(ldata.lines, game.status, game.base, game.collisions, game.roles);
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
            game.frame = 0;
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
//testHeap();
