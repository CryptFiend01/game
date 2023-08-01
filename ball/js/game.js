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

const uri = "http://127.0.0.1:7777";

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
    roles: [],
    distInterval: 15,
    lastDist: 0,
    gameMode: GameState.GS_PLAY,
    isRemote: true,

    pushed: 0,
    chooseRole: null,
    skillCD: [0, 0, 0, 0, 0],

    //----逻辑不在本地运行时，需要处理本地对象的状态-----
    startLine: 0,
    enemys : {},
    lines: [],
    through: false,
    //---------------------------------------------

    replayJson: "",
    replay: [],
    isPlayReplay: false,

    cmds : null
}

function initialze() {
    loadData(function () {
        game.roles = config.roles;
        if (game.isRemote) {
            let res = httpPost(uri + "/init_game", "");
            if (!res || res.code != 0) {
                alert("init game failed!");
                return;
            }
            let ret = initEnemyLines();
            game.startLine = ret.startLine;
            game.enemys = ret.enemys;
            game.lines = ret.lines;
            initRender(game.lines, game.status, game.base, game.collisions, game.roles);
        } else {
            initLogic(game.base, game.distInterval, game.roles);
            initRender(ldata.lines, game.status, game.base, game.collisions, game.roles);
        }

        draw();
        addUIEvents();
    });   
}

function loadBalls() {
    let cmd = game.cmds.shift();
    while (cmd.type == CmdType.CREATE_BALL) {
        let role = game.roles[cmd.cid - 1];
        let ball = new Ball({
            id: cmd.bid,
            x: game.base.x,
            y: game.base.y,
            color: role.color,
            dir: {x:cmd.dir.x, y:cmd.dir.y},
            dist: 0
        });
        rdata.balls.push(ball);
        cmd = game.cmds.shift();
    }
    game.running = cmd;
}

function updatePush() {
    let totalPush = game.running.line * Board.SIDE;
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
        if (game.isRemote) {
            //pushDataMap(game, game.running.line);
            let res = httpPost(uri + "/get_board", "");
            if (!res || res.code != 0) {
                return;
            }
            //console.log(objToString(res.data));
            game.lines = [];
            for (let l of res.data) {
                let l1 = new Line(l);
                game.lines.push(l1);
            }
            setLines(game.lines);
        } else {
            setLines(ldata.lines);
        }
        game.running = game.cmds.shift();
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
        if (e.dmg.hp <= 0) {
            rdata.lines = removeDead(rdata.lines, e.id);
        }
    }
}

function onSkillCmd(cmd) {
    if (cmd.type == CmdType.ROLE_SKILL) {
        if (cmd.range) {
            console.log("add range:" + cmd.type)
            addSkillRange(cmd.cid, cmd.range);
        }
        if (cmd.effects) {
            updateSkillEffect(cmd.effects);
        }

        removeSkillReady(cmd.cid);
        
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
    } else if (cmd.type == CmdType.SKILL_READY) {
        rdata.skillRoles[cmd.cid-1] = 1;
        if (cmd.grid >= 0) {
            addSkillReady(cmd.cid, getSkillRanges(game.roles[cmd.cid-1], cmd.grid));
        }
    }
}

function onfinish() {
    while (game.running != null) {
        let cmd = game.running;
        console.log(objToString(cmd));
        if (cmd.type == CmdType.PUSH) {
            console.log("start push!");
            startPush();
            return;
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
            resetSkillRoles();
            assignPoint(cmd.base, game.base);
            game.through = false;
        } else if (cmd.type == CmdType.WIN) {
            console.assert(game.cmds.length == 0, "other cmd after win." + objToString(game.cmds));
            break;
        } else {
            onSkillCmd(cmd);
        }
        game.running = game.cmds.shift();
    }
    if (game.cmds.length == 0) {
        game.status = GameState.GS_SKILL;
        rdata.balls.length = 0;
        rdata.status = game.status;
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
            var replayJson;
            if (game.isRemote) {
                let res = httpPost(uri + "/get_replay", "");
                if (!res || res.code != 0) {
                    return;
                }
                replayJson = JSON.stringify(res.data);
                console.log(replayJson);
            } else {
                replayJson = JSON.stringify(ldata.ops);
                console.log(replayJson);
            }

            if (!game.isPlayReplay) {
                alert("录像数据，可复制保存进行回放：" + replayJson);
            }
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

function lineEvts(cmd, data) {
    
}

function run(pass) {
    let cmd = game.running;
    if (cmd.type != CmdType.COLLIDE) {
        console.log("other cmd:" + objToString(cmd));
        if (cmd.type == CmdType.ROLE_SKILL || cmd.type == CmdType.SKILL_READY || cmd.type == CmdType.SKILL_EFFECT || cmd.type == CmdType.REMOVE_SKILL) {
            onSkillCmd(cmd);
            game.running = game.cmds.shift();
            return 0;
        } else {
            console.log("exit run.");
            return -1;
        }
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

    //console.log("ball " + cmd.bid + " move. total ball count:" + rdata.balls.length);
    let ball = rdata.balls[cmd.bid-1];
    if (ball.status != BallStatus.MOVING) {
        console.error("Ball " + ball.id + " is not moving.");
        console.log("cmd:" + objToString(cmd));
        game.running = null;
        return -1;
    }
    let rest = game.speed - pass;
    let v = {x: cmd.target.x - ball.x, y: cmd.target.y - ball.y};
    let dist = distance(v);
    if (dist <= rest) {
        moveAll(dist);

        if (cmd.reflect == null) {
            ball.status = BallStatus.DESTROY;
        } else {
            assignPoint(cmd.reflect, ball.dir);
        }

        // 移除死亡的单位
        if (cmd.dmg != null && cmd.dmg.hp <= 0) {
            rdata.lines = removeDead(rdata.lines, cmd.dmg.id);
        }

        // 处理事件
        if (cmd.evts) {
            for (let evt of cmd.evts) {
                if (evt.type == EvtType.CALL_ENEMY) {
                    let mc = getMonster(evt.cid);
                    let obj = config.objects[mc.type];
                    let point = getPointByGrid(obj, evt.grid);
                    let lines = makeLines(evt.id, point, obj, mc.solid);
                    for (let l of lines) {
                        l.setColor(ColorSet.LineSolid);
                        rdata.lines.push(l);
                    }
                    hidenPartLines(lines, rdata.lines, frameLines.length);
                }
            }
        }

        if (game.isRemote) {
            // 移除死亡的单位
            if (cmd.dmg != null) {
                game.enemys[cmd.dmg.id].hp = cmd.dmg.hp;
                if (cmd.dmg.hp <= 0) 
                    game.lines = removeDead(game.lines, cmd.dmg.id);
            }

            // 处理事件
            if (cmd.evts) {
                for (let evt of cmd.evts) {
                    if (evt.type == EvtType.CALL_ENEMY) {
                        let mc = getMonster(evt.cid);
                        let obj = config.objects[mc.type];
                        let point = getPointByGrid(obj, evt.grid);
                        let lines = makeLines(evt.id, point, obj, mc.solid);
                        let enemy = {
                            id : evt.id,
                            point : point,
                            grid: evt.grid,
                            hp : mc.hp,
                            visible: true,
                            solid : mc.solid,
                            evt: mc.evt,
                            obj : obj,
                            lines : lines,
                            rect: makeRect(lines)
                        };
                        game.enemys[evt.id] = enemy;
                        for (let l of lines) {
                            l.setColor(ColorSet.LineSolid);
                            game.lines.push(l);
                        }
                        hidenPartLines(lines, game.lines, frameLines.length);
                    }
                }
            }
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

    if (d >= 0) {
        game.totalDist += d;
        while (d >= 0 && d < game.speed) {
            let x = run(d);
            if (x == -1) {
                d = -1;
                break;
            }
            game.totalDist += x;
            d += x;
        }
    }

    if (d == -1) {
        onfinish();
    }

    game.speed += game.speedAdd;
    
    draw();
}

function inRange(line) {
    return lineInRect(line, EnemyRect);
}

function getGridPoint(x, y) {
    return {
        x: Math.floor((x - Offset.x) / Board.SIDE), 
        y: Math.floor((y - Offset.y) / Board.SIDE)
    };
}

function gridToPoint(grid) {
    return {
        x: Math.floor(grid % Board.WIDTH),
        y: Math.floor(grid / Board.WIDTH)
    }
}

function getSkillSelectRange(role, x, y) {
    let skill = role.skill;
    let p = getGridPoint(x, y);
    return getRectRange(p, skill.width, skill.height);
}

function getSkillRanges(role, grid) {
    let skill = role.skill;
    let p = gridToPoint(grid);
    let ranges = [];
    if (skill.shape == "rect") {
        ranges.push(getRectRange(p, skill.width, skill.height));
    } else if (skill.shape == "cross") {
        ranges = getCrossRange(p, skill.horizon, skill.vertical);
    }
    return ranges;
}

function doShootBall() {
    if (game.isRemote) {
        let res = httpPost(uri + "/shoot_ball", "x=" + game.aimDir.x + "&y=" + game.aimDir.y);
        if (!res || res.code != 0) {
            return false;
        }
        game.cmds = res.data;
    } else {
        startRound(game.aimDir);
        updateRound();
        game.cmds = ldata.cmds;
    }
    //console.log(objToString(game.cmds));
    return true;
}

function doUseSkill(role, target) {
    hidden("replay");
    if (game.isRemote) {
        let args = "rid=" + role.id;
        if (target) {
            args += "&x=" + target.x + "&y=" + target.y;
        } else {
            args += "&x=-1&y=-1";
        }
        let res = httpPost(uri + "/use_skill", args);
        if (!res || res.code != 0) {
            return false;
        }
        game.cmds = res.data;
        if (role.skill.type == SkillType.BALL_THROUGH) {
            game.through = true;
        }
    } else {
        useSkill(role, target);
        game.cmds = ldata.cmds;
    }

    console.log(objToString(game.cmds));

    game.running = game.cmds.shift();
    rdata.skillRoles[role.id-1] = 1;
    onfinish();
    draw();
    return true;
}

function playNext() {
    if (game.replay.length == 0) {
        return;
    }

    let op = game.replay.shift();
    if (op.op == OpType.SKILL) {
        let role = game.roles[op.rid - 1];
        doUseSkill(role, op.target);
    } else if (op.op == OpType.BALL) {
        assignPoint(op.dir, game.aimDir);
        game.collisions.length = 0;
        game.status = GameState.GS_PLAY;
        game.totalDist = 0;
        game.speed = game.basSpeed;
        rdata.status = game.status;
        if (!doShootBall()) {
            console.error("shoot ball failed!");
            return;
        }
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

initialze();
//testVectorAngle();
//test1();
//test();
//testHeap();
//testRect();
//test2();
//test3();