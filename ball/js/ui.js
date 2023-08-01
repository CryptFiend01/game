let debugs = {
    dirs : [
        {x:0.9898253866177398,y:-0.1422873993263001}
    ],
    round: 10,
    speeds: [8, 8, 1],
}

function hidden(id) {
    let e = document.getElementById(id);
    e.style.display = 'none';
}

function show(id, display) {
    let e = document.getElementById(id);
    e.style.display = display;
}

function pointInRange(point) {
    return pointInRect(point, EnemyRect);
}

function addUIEvents() {
    canvas.addEventListener("mousemove", (evt) => {
        let coord = document.getElementById("coord");
        coord.innerHTML = "坐标：" + evt.offsetX + "," + evt.offsetY;
        if (game.status == GameState.GS_AIM) {
            game.collisions.length = 0;
            let v = {x: evt.offsetX - game.base.x, y: evt.offsetY - game.base.y};
            // let v = {x: 400 - game.base.x, y: 626 - game.base.y};
            game.aimDir = normalize(v);
            if (debugs.round < debugs.dirs.length) {
                game.aimDir = debugs.dirs[debugs.round];
                console.log("game.aimDir:" + vec2String(game.aimDir))
            }
            coord.innerHTML += "  方向：" + game.aimDir.x + "," + game.aimDir.y;
            var collisions;
            if (game.isRemote) {
                collisions = aim(game.base, game.aimDir, game.times, game.lines, game.through);
            } else {
                collisions = laim(game.base, game.aimDir, game.times);
            }
            for (let c of collisions) {
                c.radius = 2;
                c.color = "#1234bc";
                game.collisions.push(c);
            }
        } else if (game.status == GameState.GS_SKILL) {
            if (game.chooseRole && pointInRange({x: evt.offsetX, y: evt.offsetY})) {
                let range = getSkillSelectRange(game.chooseRole, evt.offsetX, evt.offsetY);
                rdata.skillSelect = range;
            } else {
                rdata.skillSelect = null;
            }
        }
        draw();
    });

    canvas.addEventListener("mousedown", (evt) => {
        if (game.status == GameState.GS_AIM) {
            if (debugs.round < debugs.speeds.length)
                game.speed = debugs.speeds[debugs.round];
            else
                game.speed = game.basSpeed;
            debugs.round += 1;
            if (game.aimDir.y < 0) {
                console.log("dir:" + vec2String(game.aimDir));
                hidden("replay");
                game.collisions.length = 0;
                game.status = game.gameMode;
                game.totalDist = 0;
                //game.speed = game.basSpeed;
                rdata.status = game.status;
                if (!doShootBall()) {
                    alert("shoot ball failed!");
                    return;
                }
                loadBalls();
                if (game.status == GameState.GS_PLAY) {
                    game.timer = setInterval(update, 10);
                } else if (game.status == GameState.GS_DEBUG) {
                    startDebug();
                } else if (game.status == GameState.GS_GROUP_DEBUG) {
                    console.log(objToString(game.cmds));
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
            // aim();
            // console.log(objToString(game.collisions));
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
    });
}

function openSkillPanel() {
    if (!game.isPlayReplay) {
        show("skills", "block");
    }
}

function clickSkill(n) {
    // let role = game.roles[n-1];
    // game.chooseRole = null;
    // rdata.skillSelect = null;
    // if (role.skill.type == SkillType.BALL_ADD) {
    //     doUseSkill(role, null);
    // } else if (role.skill.type == SkillType.BALL_THROUGH) {
    //     doUseSkill(role, null);
    // } else if (role.skill.type == SkillType.ROUND_DAMAGE) {
    //     game.chooseRole = role;
    //     game.skillRect = getRectRange({x:0, y:0}, role.skill.width, role.skill.height);
    // } else {
    //     alert("开发中...");
    // }
    alert("技能改为弹球中自动释放，无法手动释放！");
}

function onLoadReplay() {
    if (game.isPlayReplay) {
        return;
    }

    show("replay-panel", 'flex');

    if (game.replayJson == "") {
        game.replayJson = `[{"op":1,"dir":{"x":0.5325610156747096,"y":-0.8463916141973062}},{"op":2,"rid":2,"target":null},{"op":1,"dir":{"x":0.9934426493385763,"y":-0.11433154628163784}},{"op":1,"dir":{"x":-0.3814768190268935,"y":-0.9243784054948074}},{"op":1,"dir":{"x":0.8042220213578353,"y":-0.5943289832770379}},{"op":1,"dir":{"x":0.024139638005420124,"y":-0.999708596480478}},{"op":1,"dir":{"x":0.68998715731442,"y":-0.7238216097500583}},{"op":1,"dir":{"x":0.990920028025033,"y":-0.13445258665740792}},{"op":2,"rid":2,"target":null},{"op":1,"dir":{"x":-0.971882644821338,"y":-0.23546576119487345}}]`;
    }

    const txt = document.getElementById("replay-json");
    txt.value = game.replayJson;
}

function checkTime() {
    hidden("skills");
    hidden("replay");
    if (game.isRemote) {

    } else {
        let startTime = Date.now();
        console.time("check total");
        initLogic(game.base, game.distInterval, game.roles);
        while (game.replay.length > 0) {
            let rep = game.replay.shift();
            if (rep.op == OpType.SKILL) {
                let role = game.roles[rep.rid - 1];
                useSkill(role, rep.target);
            } else if (rep.op == OpType.BALL) {
                startRound(rep.dir);
                updateRound();
            }
        }
        console.timeEnd("check total");
        let endTime = Date.now();
        alert("耗时:" + (endTime - startTime) + ", 请刷新页面继续！");
    }

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
