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

function showVec(name, v) {
    console.log(name + ": {x:" + v.x + ",y:" + v.y + "}");
}

function vec2String(v) {
    return "{x:" + v.x + ",y:" + v.y + "}";
}

function copyLine(line) {
    let l = new Line(line);
    for (let l1 of line.hideLines) {
        l.hideLines.push(new Line(l1));
    }
    return l;
}

function getPointByGrid(obj, grid) {
    let x = Math.floor(grid % Board.WIDTH);
    let y = Math.floor(grid / Board.WIDTH);
    return {
        x: x * Board.SIDE + obj.anchor.x + Offset.x,
        y: y * Board.SIDE + obj.anchor.y + Offset.y
    }
}

function makeRect(lines) {
    let rect = {left: 1e10, right: 1e-10, top: 1e10, bottom: 1e-10};
    for (let l of lines) {
        let rl = {
            left: Math.min(l.x1, l.x2),
            top: Math.min(l.y1, l.y2),
            right: Math.max(l.x1, l.x2),
            bottom: Math.max(l.y1, l.y2)
        };
        rect.left = Math.min(rect.left, rl.left);
        rect.top = Math.min(rect.top, rl.top);
        rect.right = Math.max(rect.right, rl.right);
        rect.bottom = Math.max(rect.bottom, rl.bottom);
    }
    return rect;
}

function _hidenLine(l1, lines, start) {
    for (let i = start; i < lines.length; i++) {
        if (l1 === lines[i] || !lines[i].solid)
            continue;
        let l2 = lines[i];
        l1.hideEachOther(l2);
    }
}

function hidenPartLines(parts, lines, start) {
    for (let l1 of parts) {
        if (!l1.solid) {
            continue;
        }
        _hidenLine(l1, lines, start);
    }
}

function hidenInline(lines, start) {
    for (let j = start; j < lines.length; j++) {
        let l1 = lines[j];
        if (!l1.solid) {
            continue;
        }
        _hidenLine(l1, lines, start);
    }
}
