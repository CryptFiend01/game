let RenderConfig = {
    width : 8,
    height : 11,
    side : 48,
    xoffset : (canvas.width - 8 * 48) / 2,
    yoffset : 5
}

let GameRect = {
    left: RenderConfig.xoffset,
    top: RenderConfig.yoffset,
    right: RenderConfig.width * RenderConfig.side + RenderConfig.xoffset,
    bottom: RenderConfig.height * RenderConfig.side + RenderConfig.yoffset
}

let config = {
    frameLines : [
        {x1: GameRect.left, y1: GameRect.top, x2: GameRect.right, y2: GameRect.top, color: "#00aa11", hide:0},
        {x1: GameRect.right, y1: GameRect.top, x2: GameRect.right, y2: GameRect.bottom, color: "#00aa11", hide:0},
        {x1: GameRect.left, y1: GameRect.bottom, x2: GameRect.left, y2: GameRect.top, color: "#00aa11", hide:0},
    ],

    enemys: [],

    objects: null,
    monsters: null,
    stage: null
}

const SkillType = {
    BALL_ADD : 1,
    RANGE_TRIGGER : 2, 
    ROUND_DAMAGE : 3,
    SOLID_BLOCK : 4,
    DASH_BLOCK : 5
}

function makeLines(id, point, obj) {
    let lt = {x: point.x - obj.anchor.x, y: point.y - obj.anchor.y};
    let lines = [];
    for (let i = obj.points.length - 1; i >= 0; i--) {
        let j = i - 1;
        if (j < 0) {
            j = obj.points.length - 1;
        }
        let start = obj.points[i];
        let end = obj.points[j];
        let line = {
            x1: start.x + lt.x,
            y1: start.y + lt.y,
            x2: end.x + lt.x,
            y2: end.y + lt.y,
            color: "#00aa11",
            mid: id,
            hide: 0
        };
        line.normal = normalize(normalVector(vector(line)));
        lines.push(line);
    }
    return lines;
}

function makeRect(lines) {
    let rect = {};
    for (let l of lines) {
        let rl = {
            left: Math.min(l.x1, l.x2),
            top: Math.min(l.y1, l.y2),
            right: Math.max(l.x1, l.x2),
            bottom: Math.max(l.y1, l.y2)
        };
        if (rect.left == undefined) {
            rect.left = rl.left;
        } else {
            rect.left = Math.min(rect.left, rl.left);
        }

        if (rect.top == undefined) {
            rect.top = rl.top;
        } else {
            rect.top = Math.min(rect.top, rl.top);
        }

        if (rect.right == undefined) {
            rect.right = rl.right;
        } else {
            rect.right = Math.max(rect.right, rl.right);
        }

        if (rect.bottom == undefined) {
            rect.bottom = rl.bottom;
        } else {
            rect.bottom = Math.max(rect.bottom, rl.bottom);
        }
    }
    return rect;
}

function getMonster(cid) {
    for (let m of config.monsters) {
        if (m.id == cid) {
            return m;
        }
    }
    return null;
};

function loadData(onfinish) {
    $.getJSON("data/object.json", function(obj_data) {
        var objects = obj_data;
        config.objects = objects;
        $.getJSON("data/monster.json", function(mst_data) {
            var monsters = mst_data;
            config.monsters = monsters;
            
            $.getJSON("data/stage.json", function(stage_data) {
                var stage = stage_data;
                config.stage = stage;
                config.stage_monsters = {}
                for (let m of stage.monsters) {
                    config.stage_monsters[m.id] = m;
                    let mc = getMonster(m.cid);
                    if (mc == null) {
                        console.log("not find monster " + m.cid);
                        continue;
                    }
                    let obj = objects[mc.type];
                    if (!m.point) {
                        let x = Math.floor(m.grid % RenderConfig.width);
                        let y = Math.floor(m.grid / RenderConfig.width);
                        m.point = {
                            x: x * RenderConfig.side + obj.anchor.x + RenderConfig.xoffset,
                            y: y * RenderConfig.side + obj.anchor.y + RenderConfig.yoffset
                        }
                    }

                    let lines = makeLines(m.id, m.point, obj);
                    config.enemys.push({
                        id : m.id,
                        point : m.point,
                        hp : mc.hp,
                        obj : obj,
                        lines : lines,
                        rect: makeRect(lines)
                    });
                }

                for (let i = 0; i < config.frameLines.length; i++) {
                    config.frameLines[i].normal = normalize(normalVector(vector(config.frameLines[i])));
                }
                onfinish();
            });
        });
    });
}

function copyEnemies(enemys) {
    let ret = {};
    for (let enemy of enemys) {
        let e = {
            id: enemy.id,
            point: copyPoint(enemy.point),
            hp: enemy.hp,
            visible: true,
            obj: enemy.obj,
            lines: [],
            rect: copyRect(enemy.rect)
        }
        for (let l of enemy.lines) {
            e.lines.push(l);
        }
        ret[e.id] = e;
    }
    return ret;
}
