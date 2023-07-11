const BallStatus = {
    CREATING : 1,
    MOVING : 2,
    MOVED : 3,
    DESTROY : 4
}

const GameState = {
    GS_SKILL : 1,
    GS_AIM : 2,
    GS_PLAY : 3,
    GS_PUSH : 4,
    GS_FINISH : 5,
    GS_DEBUG : 6,
    GS_GROUP_DEBUG : 7,
}

let game = {
    status: GameState.GS_SKILL,
    aimDir: {x: 0, y: 0},
    collisions : [],
    base: {x: 200, y: 552},
    timer: -1,
    basSpeed: 8,
    speed: 1,
    speedAdd: 0,
    running: null,
    totalDist: 0,
    times: 50,
    roles: [
        { id: 1, count: 10, times: 50, color: "red", skill: {type: SkillType.BALL_ADD, dmg: 1000, cd: 4} },
        { id: 2, count: 10, times: 50, color: "orange", skill: {type: SkillType.DASH_BLOCK, round: 2, cd: 2} },
        { id: 3, count: 10, times: 50, color: "purple", skill: {type: SkillType.RANGE_TRIGGER, width: 4, height: 2, dmg1: 1000, dmg2: 500, round: 3, cd:3, push: true} },
        { id: 4, count: 10, times: 50, color: "skyblue", skill: {type: SkillType.ROUND_DAMAGE, width: 3, height: 3, dmg: 5000, round: 4, cd:4, push: true} },
        { id: 5, count: 10, times: 50, color: "cyan", skill: {type: SkillType.SOLID_BLOCK, round: 3, cd: 3} }
    ],
    distInterval: 15,
    lastDist: 0,
    gameMode: GameState.GS_PLAY,

    pushed: 0,
    chooseRole: null,
    skillCD: [0, 0, 0, 0, 0],

    replayJson: "",
    replay: [],
    isPlayReplay: false,

    cmds : null
}

function hidden(id) {
    let e = document.getElementById(id);
    e.style.display = 'none';
}

function show(id, display) {
    let e = document.getElementById(id);
    e.style.display = display;
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

function updatePush() {
    let totalPush = game.running.line * RenderConfig.side;
    let pushPixel = 8;
    if (rdata.lines.length > 3) {
        game.pushed += pushPixel;

        let temp = [];
        for (let i = 0; i < 3; i++) {
            temp.push(rdata.lines[i]);
        }
    
        for (let i = 3; i < rdata.lines.length; i++) {
            let line = rdata.lines[i];
            line.y1 += pushPixel;
            line.y2 += pushPixel;
            if (inRange(line)) {
                temp.push(line);
            }
        }
        rdata.lines = temp;
    
        draw();
    } else {
        game.pushed = totalPush;
    }

    if (game.pushed >= totalPush) {
        console.log("push finish!");
        game.running = game.cmds.shift();
        setLines(ldata.lines);
        onfinish();
    }
}

function startPush() {
    game.pushed = 0;
    rdata.balls.length = 0;
    clearInterval(game.timer);
    game.timer = setInterval(updatePush, 50);
}

function updateSkillEffect(effects) {
    for (let e of effects) {
        if (e.hp <= 0) {
            rdata.lines = removeDead(rdata.lines, e.id);
        }
    }
}

function onfinish() {
    while (game.running != null) {
        let cmd = game.running;
        if (cmd.type == CmdType.PUSH) {
            startPush();
            return;
        } else if (cmd.type == CmdType.ROLE_SKILL) {
            if (cmd.range) {
                addSkillRange(cmd.cid, cmd.range);
            }
            if (cmd.effects) {
                updateSkillEffect(cmd.effects);
            }
            
            if (cmd.cd > 0) {
                const btn = document.getElementById("skill"+cmd.cid);
                btn.disabled = true;
                btn.innerHTML = cmd.cd;
                game.skillCD[cmd.cid - 1] = cmd.cd;
            }
        } else if (cmd.type == CmdType.REMOVE_SKILL) {
            removeSkillRange(cmd.cid);
        } else if (cmd.type == CmdType.SKILL_EFFECT) {
            updateSkillEffect(cmd.effects);
        } else if (cmd.type == CmdType.ROUND_END) {
            for (let i = 0; i < game.skillCD.length; i++) {
                if (game.skillCD[i] > 0) {
                    game.skillCD[i] -= 1;
                    const btn = document.getElementById("skill"+(i+1));
                    if (game.skillCD[i] <= 0) {
                        btn.innerHTML = "";
                        btn.disabled = false;
                    } else {
                        btn.innerHTML = game.skillCD[i];
                    }
                }
            }
        } else if (cmd.type == CmdType.WIN) {
            break;
        }
        game.running = game.cmds.shift();
    }
    if (game.cmds.length == 0) {
        game.status = GameState.GS_SKILL;
        rdata.balls.length = 0;
        rdata.status = game.status;
        assignPoint(ldata.base, game.base);
        openSkillPanel();

        if (game.timer > 0) {
            clearInterval(game.timer);
            game.timer = -1;
        }

        if (game.running && game.running.type == CmdType.WIN) {
            console.log("win.");
            game.status = GameState.GS_FINISH;
            rdata.status = game.status;
            rdata.skillSelect = null;
            rdata.skillRange = {};
            console.log(JSON.stringify(ldata.ops));
        }

        draw();

        if (game.isPlayReplay) {
            playNext();
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
    if (cmd.type != CmdType.COLLIDE && cmd.type != CmdType.HIT) {
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
        if (cmd.dmg != null && cmd.dmg.hp <= 0) {
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

function getGridPoint(x, y) {
    return {
        x: Math.floor((x - RenderConfig.xoffset) / RenderConfig.side), 
        y: Math.floor((y - RenderConfig.yoffset) / RenderConfig.side)
    };
}

function getSkillSelectRange(role, x, y) {
    let skill = role.skill;
    let p = getGridPoint(x, y);
    return getSkillRange(p, skill.width, skill.height);
}

function doUseSkill(role, target) {
    hidden("replay");
    useSkill(role, target);
    game.cmds = ldata.cmds;
    game.running = game.cmds.shift();
    onfinish();
    draw();
}

function initialze() {
    loadData(function () {
        initLogic(game.base, game.distInterval, game.roles);
        initRender(ldata.lines, game.status, game.base, game.collisions, game.roles);
        draw();
        canvas.addEventListener("mousemove", (evt) => {
            let coord = document.getElementById("coord");
            coord.innerHTML = "坐标：" + evt.offsetX + "," + evt.offsetY;
            if (game.status == GameState.GS_AIM) {
                game.collisions.length = 0;
                let v = {x: evt.offsetX - game.base.x, y: evt.offsetY - game.base.y};
                //let v = {x: 400 - game.base.x, y: 626 - game.base.y};
                game.aimDir = normalize(v);
                coord.innerHTML += "  方向：" + game.aimDir.x + "," + game.aimDir.y;
                aim();
            } else if (game.status == GameState.GS_SKILL) {
                if (game.chooseRole && pointInRange({x: evt.offsetX, y: evt.offsetY})) {
                    let range = getSkillSelectRange(game.chooseRole, evt.offsetX, evt.offsetY);
                    rdata.skillSelect = range;
                } else {
                    rdata.skillSelect = null;
                }
                draw();
            }
        });

        canvas.addEventListener("mousedown", (evt) => {
            if (game.status == GameState.GS_AIM) {
                if (game.aimDir.y < 0) {
                    hidden("replay");
                    game.collisions.length = 0;
                    game.status = game.gameMode;
                    game.totalDist = 0;
                    game.speed = game.basSpeed;
                    rdata.status = game.status;
                    startRound(game.aimDir);
                    updateRound();
                    game.cmds = ldata.cmds;
                    loadBalls();
                    if (game.status == GameState.GS_PLAY) {
                        game.timer = setInterval(update, 10);
                    } else if (game.status == GameState.GS_DEBUG) {
                        startDebug();
                    } else if (game.status == GameState.GS_GROUP_DEBUG) {
                        startGroupDebug();
                    }
                }
            } else if (game.status == GameState.GS_SKILL) {
                if (game.chooseRole && pointInRange({x: evt.offsetX, y: evt.offsetY})) {
                    let target = getGridPoint(evt.offsetX, evt.offsetY);
                    doUseSkill(game.chooseRole, target);
                    rdata.skillSelect = null;
                    game.chooseRole = null;
                }
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

function playNext() {
    if (game.replay.length == 0) {
        return;
    }

    let op = game.replay.shift();
    if (op.op == "skill") {
        let role = game.roles[op.rid - 1];
        doUseSkill(role, op.target);
    } else if (op.op == "ball") {
        assignPoint(op.dir, game.aimDir);
        game.collisions.length = 0;
        game.status = GameState.GS_PLAY;
        game.totalDist = 0;
        game.speed = game.basSpeed;
        rdata.status = game.status;
        startRound(game.aimDir);
        updateRound();
        game.cmds = ldata.cmds;
        loadBalls();
        //console.log("ball cmds:" + objToString(game.cmds));
        game.timer = setInterval(update, 10);
    }
}

function finishSkill() {
    if (game.status != GameState.GS_FINISH) {
        game.status = GameState.GS_AIM;
        rdata.status = game.status;
        hidden("skills");
    } else {
        alert("游戏结束，刷新重开！");
    }
}

function openSkillPanel() {
    if (!game.isPlayReplay) {
        show("skills", "block");
    }
}

function clickSkill(n) {
    let role = game.roles[n-1];
    game.chooseRole = null;
    rdata.skillSelect = null;
    if (role.skill.type == SkillType.BALL_ADD) {
        doUseSkill(role, null);
    } else if (role.skill.type == SkillType.ROUND_DAMAGE) {
        game.chooseRole = role;
        game.skillRect = getSkillRange({x:0, y:0}, role.skill.width, role.skill.height);
    } else {
        alert("开发中...");
    }
}

function onLoadReplay() {
    if (game.isPlayReplay) {
        return;
    }

    show("replay-panel", 'flex');

    if (game.replayJson == "") {
        game.replayJson = `[{"op":"ball","dir":{"x":0.49513253046682293,"y":-0.8688174591210289}},{"op":"skill","rid":4,"target":{"x":4,"y":2}},{"op":"ball","dir":{"x":-0.46590041397228493,"y":-0.8848371625674712}},{"op":"ball","dir":{"x":0.9887287120386224,"y":-0.14971818189667802}},{"op":"ball","dir":{"x":0.9812449729172427,"y":-0.19276489079871362}},{"op":"ball","dir":{"x":0.9895165780714621,"y":-0.1444193259980946}},{"op":"ball","dir":{"x":-0.07254272312081671,"y":-0.9973653058544881}},{"op":"skill","rid":4,"target":{"x":2,"y":4}},{"op":"ball","dir":{"x":-0.9554604493220478,"y":-0.2951191789452365}},{"op":"ball","dir":{"x":-0.11739051815670926,"y":-0.9930858302517961}},{"op":"ball","dir":{"x":0.9482040612282301,"y":-0.3176618615293486}},{"op":"ball","dir":{"x":0.9760884762056063,"y":-0.2173736106766812}},{"op":"skill","rid":4,"target":{"x":1,"y":4}},{"op":"ball","dir":{"x":-0.13987816192827124,"y":-0.9901687229031062}}]`;
    }

    const txt = document.getElementById("replay-json");
    txt.value = game.replayJson;
}

function checkTime() {
    console.time("check total");
    while (game.replay.length > 0) {
        let rep = game.replay.shift();
        if (rep.op == "skill") {
            let role = game.roles[rep.rid - 1];
            useSkill(role, rep.target);
        } else if (rep.op == "ball") {
            startRound(rep.dir);
            updateRound();
        }
    }
    console.timeEnd("check total");
}

function onPlay() {
    if (game.replay.length == 0) {
        alert("没有有效的录像信息……");
        return;
    }
    game.isPlayReplay = true;
    hidden("replay");
    hidden("skills");
    playNext();
}

function onCancel() {
    hidden("replay-panel");
}

function onSetReplay() {
    const txt = document.getElementById("replay-json");
    let data = txt.value;
    try {
        game.replay = JSON.parse(data);
    } catch (e) {
        alert("错误的数据，请填写正确的json数据！");
        game.replay = [];
        return;
    }
    
    hidden("replay-panel");
    game.replayJson = data;
}

initialze();
//test1();
//test();
//testHeap();
//testRect();
