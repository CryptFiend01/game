let game = {
    status: 1,
    aimDir: {x: 0, y: 0},
    collisions : [], // {x: 0, y: 0, radius: 2, color: "#1234bc"}
    base: {x: 250, y: 800},
    times: 10,
    timer: -1,
    basSpeed: 3,
    speed: 3,
    running: null,
    totalDist: 0,
    distInterval: 15,
}

const BallStatus = {
    CREATING : 1,
    MOVING : 2,
    MOVED : 3,
    DESTROY : 4
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

function aim() {
    let n = game.aimDir;
    let start = game.base;
    while (game.collisions.length < game.times) {
        let collide = getNextCollision(start, n);
        if (collide.point == null)
            break;
        game.collisions.push({x: collide.point.x, y: collide.point.y, radius: 2, color: "#1234bc"});

        n = getReflectNorm(start, collide);
        start = collide.point;
    }
    draw();
}

function loadBalls() {
    let cmd = ldata.cmds.shift();
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
        cmd = ldata.cmds.shift();
    }
    game.running = cmd;
}

function ballMove(ball) {
    ball.x += ball.dir.x * (game.speed - ball.dist);
    ball.y += ball.dir.y * (game.speed - ball.dist);
    ball.status = BallStatus.MOVED;
}

function update() {
    // 按照间隔解锁球,初始化一帧的状态
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.CREATING) {
            if (game.totalDist >= (ball.id - 1) * game.distInterval) {
                ball.status = BallStatus.MOVING;
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
    while (true) {
        //console.log("cmd:" + objToString(cmd));
        let ball = rdata.balls[cmd.id-1];
        if (ball.status != BallStatus.MOVING) {
            break;
        }

        let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
        //console.log("ball:" + objToString(ball));
        //console.log("dist:" + dist);
        if (dist <= game.speed - ball.dist) {
            if (cmd.reflect == null) {
                ball.status = BallStatus.DESTROY;
            } else {
                assignPoint(cmd.reflect, ball.dir);
            }
            assignPoint(cmd.target, ball);
            ball.dist += dist;

            // 移除死亡的单位
            if (cmd.dmg != null && cmd.dmg.hp == 0) {
                let temp = [];
                for (let l of rdata.lines) {
                    if (!l.mid || l.mid != cmd.dmg.id) {
                        temp.push(l);
                    }
                }
                rdata.lines = temp;
            }

            cmd = ldata.cmds.shift();
            console.log("next cmd:" + objToString(cmd));
            if (cmd.type != CmdType.COLLIDE) {
                break;
            }
            game.running = cmd;
        } else {
            ballMove(ball);
            break;
        }
    }

    // 最后执行其他球的移动
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.MOVING) {
            ballMove(ball);
        }
    }
    
    game.totalDist += game.speed;
    game.speed += 0.1;

    draw();

    if (ldata.cmds.length == 0) {
        clearInterval(game.timer);
        game.status = 1;
        game.timer = -1;
        rdata.balls.length = 0;
        rdata.status = game.status;

        if (cmd.type == CmdType.WIN) {
            console.log("win.");
            // reset();
            game.status = 3;
            rdata.status = game.status;
            draw();
        }
    }
}

function initRender() {
    rdata.lines.length = 0;
    for (let l of ldata.lines) {
        rdata.lines.push(copyLine(l));
    }
    rdata.status = game.status;
    rdata.base = game.base;
    rdata.collisions = game.collisions;
}

function reset() {
    initLogic(game.base, game.times, game.distInterval);
    initRender();
}

function initialze() {
    loadData(function () {
        reset();
        addEventListener("mousemove", (evt) => {
            if (game.status != 1) {
                return;
            }
            game.collisions.length = 0;
            let v = {x: evt.offsetX - game.base.x, y: evt.offsetY - game.base.y};
            game.aimDir = normalize(v);
            aim();
        });

        addEventListener("mousedown", (evt) => {
            if (game.status == 2) {
                return;
            }
            game.status = 2;
            game.totalDist = 0;
            game.speed = game.basSpeed;
            rdata.status = game.status;
            startRound(game.aimDir);
            updateRound();
            console.log("cmd count:" + ldata.cmds.length);
            loadBalls();
            console.log("cmd count:" + ldata.cmds.length);
            game.timer = setInterval(update, 10);
        });

        addEventListener("keydown", (evt) => {
            if (game.status == 2) {
                if (game.timer == -1) {
                    game.timer = setInterval(update, 10);
                } else {
                    clearInterval(game.timer);
                    game.timer = -1;
                }
            }
        })
    });   
}

initialze();
