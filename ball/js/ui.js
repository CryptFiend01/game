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
    gameCanvas.addEventListener("mousemove", (evt) => {
        let coord = document.getElementById("coord");
        coord.innerHTML = "坐标：" + evt.offsetX + "," + evt.offsetY;
        if (game.status == GameState.GS_AIM) {
            game.collisions.length = 0;
            let v = {x: evt.offsetX - game.base.x, y: evt.offsetY - game.base.y};
            // let v = {x: 400 - game.base.x, y: 626 - game.base.y};
            game.aimDir = normalize(v);
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

    gameCanvas.addEventListener("mousedown", (evt) => {
        if (game.status == GameState.GS_AIM) {
            if (game.aimDir.y < 0) {
                console.log("dir:" + vec2String(game.aimDir));
                hidden("replay");
                game.collisions.length = 0;
                game.status = game.gameMode;
                game.totalDist = 0;
                rdata.status = game.status;
                if (game.isDebug) {
                    document.getElementById("dir-x").value = game.aimDir.x;
                    document.getElementById("dir-y").value = game.aimDir.y;
                    document.getElementById("ball-speed").value = game.speed;
                    return;
                }

                game.speed = game.basSpeed;
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
        if (game.isDebug) {
            return;
        }
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
    if (!game.isPlayReplay && game.status == GameState.GS_SKILL) {
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

function finishSkill() {
    hidden("check-debug");
    if (game.status != GameState.GS_FINISH) {
        game.status = GameState.GS_AIM;
        rdata.status = game.status;
        hidden("skills");
        if (game.isDebug) {
            queryForDebug();
        }
    } else {
        alert("游戏结束，刷新重开！");
    }
}

function onLoadReplay() {
    if (game.isPlayReplay) {
        return;
    }

    show("replay-panel", 'flex');

    if (game.replayJson == "") {
        game.replayJson = `[{"op":1,"dir":{"x":-0.44859335021347907,"y":-0.8937359823483929}},{"op":1,"dir":{"x":-0.46675861955812287,"y":-0.8843847528469696}},{"op":1,"dir":{"x":-0.5484600326708852,"y":-0.8361767711211855}},{"op":1,"dir":{"x":-0.3240570572744072,"y":-0.9460375381720598}}]`;
    }

    const txt = document.getElementById("replay-json");
    txt.value = game.replayJson;
}

function checkTime() {
    hidden("skills");
    hidden("replay");
    hidden("check-debug");
    if (game.isRemote) {
        let res = httpPost(uri + "/check_time", "replay=" + jsonToLua(game.replayJson));
        if (!res || res.code != 0) {
            return;
        }
        alert("耗时:" + res.data + ", 请刷新页面继续！");
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
    hidden("check-debug");
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

function onDebugChange() {
    const chk = document.getElementById("open-debug");
    if (chk.checked) {
        show("debug-panel", "block");
    } else {
        hidden("debug-panel");
    }
    game.isDebug = chk.checked;
}

function onSpeedChange() {
    let inputSpeed = document.getElementById("ball-speed");
    let speed = parseFloat(inputSpeed.value);
    if (speed < 0) {
        speed = 0;
    }
    game.speed = speed;
}

function onDebugRunSteps() {
    if (rdata.balls.length > 0) {
        alert("只有每回合第一步可以快速多步跳过！");
        return;
    }
    let stepStr = document.getElementById("step").value;
    if (stepStr == "") {
        stepStr = "1";
        document.getElementById("step").value = stepStr;
    }
    let step = parseInt(stepStr);
    let x = parseFloat(document.getElementById("dir-x").value);
    let y = parseFloat(document.getElementById("dir-y").value);
    let res = httpPost(uri + "/debug_to_step", "user=" + game.user + "&x=" + x + "&y=" + y + "&step=" + step);
    if (!res || res.code != 0) {
        console.error("request debug_to_step failed!");
        return;
    }

    game.cmds = res.data;
    loadBalls();
    game.timer = setInterval(update, 10);

    queryForDebug();
}

function onDebugOneStep() {
    let res = httpPost(uri + "/debug_one_step", "user=" + game.user);
    if (!res || res.code != 0) {
        console.error("request debug_one_step failed!");
        return;
    }
    game.cmds = res.data;
    if (game.cmds.length == 0) {
        return;
    }
    game.running = game.cmds.shift();
    if (!game.running) {
        return;
    }
    game.timer = setInterval(update, 10);

    queryForDebug();
}
