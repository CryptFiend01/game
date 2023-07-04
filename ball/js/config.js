let config = {
    lines : [
        {x1: 0, y1: 0, x2: canvas.width, y2: 0, color: "#00aa11", hide:0},
        {x1: canvas.width, y1: 0, x2: canvas.width, y2: canvas.height, color: "#00aa11", hide:0},
        {x1: canvas.width, y1: canvas.height, x2: 0, y2: canvas.height, color: "#00aa11", hide:0},
        {x1: 0, y1: canvas.height, x2: 0, y2: 0, color: "#00aa11", hide:0},
    ],

    objects: null,
    monsters: null,
    stage: null
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
                    let lines = makeLines(m.id, m.point, obj);
                    for (let j = 0; j < lines.length; j++) {
                        config.lines.push(lines[j]);
                    }
                }

                // 通过线段数据生成法线向量
                for (let i = 0; i < config.lines.length; i++) {
                    config.lines[i].normal = normalize(normalVector(vector(config.lines[i])));
                }

                // 隐去内线
                for (let j = 0; j < config.lines.length; j++) {
                    let l1 = config.lines[j];
                    for (let i = 0; i < config.lines.length; i++) {
                        if (i == j)
                            continue;
                        let l2 = config.lines[i];
                        if ((l1.x1 == l2.x1 && l1.y1 == l2.y1 && l1.x2 == l2.x2 && l1.y2 == l2.y2) ||
                            (l1.x1 == l2.x2 && l1.y1 == l2.y2 && l1.x2 == l2.x1 && l1.y2 == l2.y1)) {
                            l1.hide = l2.mid;
                            l2.hide = l1.mid;
                        }
                    }
                }
                onfinish();
            });
        });
    });
}
