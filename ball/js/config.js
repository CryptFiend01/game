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
    down: RenderConfig.height * RenderConfig.side + RenderConfig.yoffset
}

let config = {
    frameLines : [
        {x1: GameRect.left, y1: GameRect.top, x2: GameRect.right, y2: GameRect.top, color: "#00aa11", hide:0},
        {x1: GameRect.right, y1: GameRect.top, x2: GameRect.right, y2: GameRect.down, color: "#00aa11", hide:0},
        {x1: GameRect.left, y1: GameRect.down, x2: GameRect.left, y2: GameRect.top, color: "#00aa11", hide:0},
    ],

    lines: [],

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
        lines.push({
            x1: start.x + lt.x,
            y1: start.y + lt.y,
            x2: end.x + lt.x,
            y2: end.y + lt.y,
            color: "#00aa11",
            mid: id,
            hide: 0
        });
    }
    return lines;
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
                    for (let j = 0; j < lines.length; j++) {
                        config.lines.push(lines[j]);
                    }
                }

                for (let i = 0; i < config.frameLines.length; i++) {
                    config.frameLines[i].normal = normalize(normalVector(vector(config.frameLines[i])));
                }

                // 通过线段数据生成法线向量
                for (let i = 0; i < config.lines.length; i++) {
                    config.lines[i].normal = normalize(normalVector(vector(config.lines[i])));
                }
                onfinish();
            });
        });
    });
}
