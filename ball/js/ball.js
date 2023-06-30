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
    gameMode: GameState.GS_GROUP_DEBUG
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

function test() {
    let line = {x1:198,y1:630,x2:170,y2:645,color:"#004411",mid:17,normal:{x:-0.472221412515419,y:-0.8814799700287821}};
    // let dir = {x:-0.39691115068546706, y:-0.9178570359601427};
    // let start = game.base;
    let start = {x:375, y:305};
    let dir = {x:0.24483931082618096, y:0.9695636708716766};
    let end = {x: start.x + dir.x * 1400, y: start.y + dir.y * 1400};
    let l = {x1: start.x, y1: start.y, x2: end.x, y2: end.y, color:"#bbaa11"};
    let lines = [];
    for (let ll of config.lines) {
        lines.push(ll);
    }

    lines.push({x2:375,y2:305,x1:345,y1:305,color:"#00aa11",mid:30,hide:0});
    lines.push({x2:405,y2:365,x1:375,y1:365,color:"#00aa11",mid:35,hide:0});
    lines.push({x2:375,y2:335,x1:375,y1:305,color:"#00aa11",mid:30,hide:0});

    for (let i = 0; i < lines.length; i++) {
        lines[i].normal = normalize(normalVector(vector(lines[i])));
    }
    
    for (let ll of lines) {
        drawLine(ll);
        drawNormal(ll);
    }
        
    drawLine(l);

    console.log("ray: " + objToString(l));
    
    let collide = checkNextInterpoint(start, dir, lines, [lines[4]]);
    if (collide.point == null) {
        console.log("no collide.");
        return;
    }
    console.log("collide:" + objToString(collide));
    let n = getReflectNorm(dir, collide.line);
    showVec("reflect", n);
    let dl = {x1: collide.point.x, y1: collide.point.y, x2: collide.point.x + n.x * 100, y2: collide.point.y + n.y * 100, color:"#00aa11"};
    drawLine(dl);
    let b1 = {x: dl.x1, y: dl.y1, radius:3, color: "#2233cc"};
    let b2 = {x: dl.x2, y: dl.y2, radius:3, color: "#cc3322"};
    drawBall(b1);
    drawBall(b2);
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

function startDebug() {
    console.log("cmd:" + objToString(game.running));
    game.timer = setInterval(updateDebug, 10);
}

function startGroupDebug() {
    console.log("cmd:" + objToString(game.running));
    game.timer = setInterval(updateGroupDebug, 10);
}

function onfinish() {
    if (ldata.cmds.length == 0) {
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

function moveAll(dist) {
    // 最后执行其他球的移动
    for (let ball of rdata.balls) {
        if (ball.status == BallStatus.MOVING) {
            ballMove(ball, dist);
        }
    }
}

function updateGroupDebug() {
    let cmd = game.running;
    if (cmd.type != CmdType.COLLIDE) {
        onfinish();
        return;
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
        clearInterval(game.timer);
        game.timer = -1;
        return;
    }

    let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
    if (dist <= game.speed - ball.dist) {
        if (cmd.reflect == null) {
            ball.status = BallStatus.DESTROY;
        } else {
            assignPoint(cmd.reflect, ball.dir);
        }
        assignPoint(cmd.target, ball);
        ball.target = null;
        // ball.dist += dist;

        // 移除死亡的单位
        if (cmd.dmg != null && cmd.dmg.hp == 0) {
            rdata.lines = removeDead(rdata.lines, cmd.dmg.id);
        }

        moveAll(dist);
        game.totalDist += dist;

        console.log("move finish.");
        game.running = null;
        clearInterval(game.timer);
        game.timer = -1;
        return;
    } else {
        moveAll();
        game.totalDist += game.speed;
    }

    //game.speed += game.speedAdd;

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
    let dist = length({x: cmd.target.x - ball.x, y: cmd.target.y - ball.y});
    if (dist <= game.speed - ball.dist) {
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
        console.log("move finish.")
        game.running = null;
        clearInterval(game.timer);
        game.timer = -1;
    } else {
        ballMove(ball);
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

            cmd = ldata.cmds.shift();
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
            console.log("cmd count:" + ldata.cmds.length);
            loadBalls();
            console.log("cmd count:" + ldata.cmds.length);
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
                    game.running = ldata.cmds.shift();
                    startDebug();
                }
            } else if (game.status == GameState.GS_GROUP_DEBUG) {
                if (game.timer == -1) {
                    game.running = ldata.cmds.shift();
                    startGroupDebug();
                }
            }
        })
    });   
}

initialze();
//test();

function test1() {
    // let start = {x:375, y:305};
    // let dir = {x:0.24483931082618096, y:0.9695636708716766};
    // //let dir = {x:0.2, y:0.9};
    // ldata.lines.push({x1:375,y1:305,x2:345,y2:305,color:"#00aa11",mid:30,hide:0,normal:{x:0,y:-1}});
    // ldata.lines.push({x1:405,y1:365,x2:375,y2:365,color:"#00aa11",mid:35,hide:0,normal:{x:0,y:-1}});
    // ldata.lines.push({x1:375,y1:335,x2:375,y2:305,color:"#00aa11",mid:30,hide:0,normal:{x:0,y:-1}});
    // let collide = getNextCollision(start, dir, ldata.lines[1]);
    // console.log("collide" + objToString(collide));
    // let line1 = {x1: 250, y1: 800, x2: 1164.1154708972479, y2: -260.3739462408073, hide:1, width:1};
    // let line2 = {x1:500,y1:0,x2:500,y2:900,color:"#00aa11",hide:0,normal:{x:-1,y:0}};

    let start = {x: 10, y: 10};
    let dir = {x: 0.5, y: 0.5};
    let line1 = {x1: start.x, y1: start.y, x2: start.x + dir.x * 50, y2: start.y + dir.y * 50, hide:1, width:1};
    let line2 = {x1:5,y1:15,x2:15,y2:5,color:"#00aa11",hide:0,normal:{x:-1,y:0}};
    //let pt = getIntersectionPoint(line1, line2);
    let pt = getRaySegmentIntersection(start, dir, line2);
    console.log(pt);
    //showVec("inter", pt);

    drawLine(line1);
    drawLine(line2);
}

//test1();