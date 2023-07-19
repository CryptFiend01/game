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
    console.log(name + ": [" + v.x + "," + v.y + "]");
}

function vec2String(v) {
    return "[" + v.x + "," + v.y + "]";
}

function copyLine(line) {
    let l = new Line(line);
    for (let l1 of line.hideLines) {
        l.hideLines.push(new Line(l1));
    }
    return l;
}

function checkNextInterpoint(start, dir, ignores, hitid) {
    let lines = ldata.lines;
    let isThrough = ldata.isThrough;
    let nearest = 1e10;
    let inter = { point: null, line: null };
    for (let i = 0; i < lines.length; i++) {
        let l = lines[i];
        // 检测是否碰到虚线
        if (hitid > 0 && l.mid == hitid) {
            continue;
        }
        // 起点所在的线条不检查，防止在同一条线上反复碰撞
        if (ignores.indexOf(l) != -1 || (l.hide != 0 && !isThrough)) {
            continue;
        }
        let angle = getAngle(dir, l.normal);
        if (angle > Math.PI / 2) {
            continue;
        }
        let p = getRaySegmentIntersection(start, dir, l);
        if (p != null) {
            // 检测是否碰到内部隐藏虚线，非完整隐藏线段
            if (l.isHitHide(p)) {
                continue;
            }
            let dist = distance({x: p.x - start.x, y: p.y - start.y});
            if (dist < nearest || (dist == nearest && !inter.line.solid && l.solid)) {
                inter.point = p;
                inter.line = l;
                nearest = dist;
            }
        }
    }

    return inter;
}

function mixId(id1, id2) {
    return id1 * 1000 + id2;
}

function unMixId(id) {
    return [Math.floor(id / 1000), id % 1000];
}

function _hidenLine(l1, lines) {
    for (let i = 3; i < lines.length; i++) {
        if (l1 === lines[i] || !lines[i].solid)
            continue;
        let l2 = lines[i];
        l1.hideEachOther(l2);
    }
}

function hidenPartLines(parts, lines) {
    for (let l1 of parts) {
        if (!l1.solid) {
            continue;
        }
        _hidenLine(l1, lines);
    }
}

function hidenInline(lines) {
    for (let j = 3; j < lines.length; j++) {
        let l1 = lines[j];
        if (!l1.solid) {
            continue;
        }
        _hidenLine(l1, lines);
    }
}
