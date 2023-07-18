function vector(line) {
    return {
        x : line.x2 - line.x1,
        y : line.y2 - line.y1
    }
}

function normalVector(v) {
    return {x : -v.y, y : v.x};
}

function length(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v) {
    let d = length(v);
    return {x: v.x / d, y: v.y / d};
}

function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

function vecEqual(v1, v2) {
    return Math.abs(v1.x - v2.x) < 1e-9 && Math.abs(v1.y - v2.y) < 1e-9;
}

function copyLine(line) {
    let obj = {};
    for (let k in line) {
        obj[k] = line[k];
    }
    return obj;
}

function assignPoint(src, dst) {
    dst.x = src.x;
    dst.y = src.y;
}

function copyPoint(pt) {
    return {x: pt.x, y: pt.y};
}

function copyRect(rect) {
    return {left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom};
}

function rectInserect(rect1, rect2) {
    if (rect1.left >= rect2.right || rect2.left >= rect1.right ||
        rect1.top >= rect2.bottom || rect2.top >= rect1.bottom)
        return false;
    else
        return true;
}

function lineInRect(line, rect) {
    if (line.y1 < rect.top || line.y1 > rect.bottom || line.y2 < rect.top || line.y2 > rect.bottom) {
        return false;
    } else {
        return true;
    }
}

function pointInRect(point, rect) {
    if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) {
        return false;
    } else {
        return true;
    }
}

function pointOnSide(point, rect) {
    return point.x == rect.left || point.x == rect.right || point.y == rect.top || point.y == rect.down;
}

function pointToLineDistance(point, line) {
    let px = point.x;
    let py = point.y;
    let x1 = line.x1;
    let y1 = line.y1;
    let x2 = line.x2;
    let y2 = line.y2;

    var A = px - x1;
    var B = py - y1;
    var C = x2 - x1;
    var D = y2 - y1;
  
    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = dot / len_sq;
  
    var xx, yy;
  
    if (param < 0 || (x1 === x2 && y1 === y2)) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
  
    var dx = px - xx;
    var dy = py - yy;
  
    return Math.sqrt(dx * dx + dy * dy);
}
   

function reflectVector(incident, normal) {
    let dt = dot(incident, normal);
    let r = {
        x : incident.x - 2 * dt * normal.x,
        y : incident.y - 2 * dt * normal.y
    };
    // 反射向量不能为0，略微加上一个偏移量
    if (r.x == 0 && r.y == 0) {
        console.warn("reflect zero, ajust it.");
        r.x = incident.x - 2.1 * dt * normal.x;
        r.y = incident.y - 2.1 * dt * normal.y;
    }
    return r;
}

function getRaySegmentIntersection(start, dir, line) {
    let segmentStart = {x: line.x1, y: line.y1};
    let segmentEnd = {x: line.x2, y: line.y2};

    const denominator = (segmentEnd.y - segmentStart.y) * (dir.x) - (segmentEnd.x - segmentStart.x) * (dir.y);
    if (denominator === 0) {
        return null; // 射线与线段平行或共线，没有交点
    }

    const t1 = ((segmentEnd.x - segmentStart.x) * (start.y - segmentStart.y) - (segmentEnd.y - segmentStart.y) * (start.x - segmentStart.x)) / denominator;
    const t2 = ((start.y - segmentStart.y) * (dir.x) - (start.x - segmentStart.x) * (dir.y)) / denominator;

    if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
        let intersectionX = start.x + t1 * dir.x;
        if (line.x1 == line.x2) {
            intersectionX = line.x1;
        }
        let intersectionY = start.y + t1 * dir.y;
        if (line.y1 == line.y2) {
            intersectionY = line.y1;
        }
        return { x: intersectionX, y: intersectionY };
    }

    return null; // 射线与线段不相交或交点不在线段上
}

function getIntersection(line1, line2) {
    // 这个算法有bug，无法检测交点在线段两端的情况
    let a = {x: line1.x1, y: line1.y1};
    let b = {x: line1.x2, y: line1.y2};
    let c = {x: line2.x1, y: line2.y1};
    let d = {x: line2.x2, y: line2.y2};
    
    // 三角形abc 面积的2倍  
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);  
  
    // 三角形abd 面积的2倍  
    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);   
  
    // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);  
    if (area_abc * area_abd >= 0) {  
        return null;  
    }  
  
    // 三角形cda 面积的2倍  
    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);  
    // 三角形cdb 面积的2倍  
    // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.  
    var area_cdb = area_cda + area_abc - area_abd ;  

    if (area_cda * area_cdb >= 0) {  
        return null;  
    }  
  
    //计算交点坐标  
    var t = area_cda / (area_abd - area_abc);  
    var dx = t * (b.x - a.x);
    var dy = t * (b.y - a.y);
    return { x: a.x + dx , y: a.y + dy };
}

function getAngle(v1, v2) {
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const magnitude1 = length(v1);
    const magnitude2 = length(v2);
    const cosTheta = dotProduct / (magnitude1 * magnitude2);
    const theta = Math.acos(cosTheta);
    return Math.PI - theta;
}

function checkNextInterpoint(start, dir, lines, ignores, dashid, isThrough) {
    let nearest = 1e10;
    let inter = { point: null, line: null };
    for (let i = 0; i < lines.length; i++) {
        let l = lines[i];
        // 检测是否碰到虚线
        if (dashid > 0 && l.mid == dashid) {
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
            if (hitHide(p, l)) {
                continue;
            }
            let dist = length({x: p.x - start.x, y: p.y - start.y});
            if (dist < nearest || (dist == nearest && !inter.line.solid && l.solid)) {
                inter.point = p;
                inter.line = l;
                nearest = dist;
            }
        }
    }

    return inter;
}

function pointInLine(point, line) {
    if (line.x1 == line.x2) {
        let up = Math.max(line.y1, line.y2);
        let down = Math.min(line.y1, line.y2);
        return point.x == line.x1 && point.y >= down && point.y <= up;
    } else if (line.y1 == line.y2) {
        let left = Math.min(line.x1, line.x2);
        let right = Math.max(line.x1, line.x2);
        return point.y == line.y1 && point.x >= left && point.x <= right;
    } else {
        let d = length({x: line.x2 - line.x1, y: line.y2 - line.y1});
        let d2 = length({x: line.x1 - point.x, y: line.y1 - point.y});
        let d3 = length({x: line.x2 - point.x, y: line.y2 - point.y});
        return (d - d2 - d3) == 0;
    }
}

function hitHide(point, line) {
    if (line.hideLines == null) {
        return false;
    }
    for (let l of line.hideLines) {
        if (pointInLine(point, l)) {
            return true;
        }
    }
    return false;
}

function addHideLine(line, hideLine) {
    if (line.hideLines == null) {
        line.hideLines = [hideLine];
    } else {
        line.hideLines.push(hideLine);
    }
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
        if ((l1.x1 == l2.x1 && l1.y1 == l2.y1 && l1.x2 == l2.x2 && l1.y2 == l2.y2) ||
            (l1.x1 == l2.x2 && l1.y1 == l2.y2 && l1.x2 == l2.x1 && l1.y2 == l2.y1)) {
            l1.hide = l2.mid;
            l2.hide = l1.mid;
        } else {
            let p11 = {x: l1.x1, y: l1.y1};
            let p12 = {x: l1.x2, y: l1.y2};
            let p21 = {x: l2.x1, y: l2.y1};
            let p22 = {x: l2.x2, y: l2.y2};
            if (pointInLine(p11, l2) && pointInLine(p12, l2)) {
                l1.hide = l2.mid;
                addHideLine(l2, l1);
            } else if (pointInLine(p21, l1) && pointInLine(p22, l1)) {
                l2.hide = l1.mid;
                addHideLine(l1, l2);
            } else if (pointInLine(p11, l2)) {
                if (pointInLine(p21, l1) && !vecEqual(p11, p21)) {
                    let line = {x1: p11.x, y1: p11.y, x2: p21.x, y2: p21.y, hide:mixId(l1.mid, l2.mid)};
                    addHideLine(l1, line);
                    addHideLine(l2, line);
                } else if (pointInLine(p22, l1) && !vecEqual(p11, p22)) {
                    let line = {x1: p11.x, y1: p11.y, x2: p22.x, y2: p22.y, hide:mixId(l1.mid, l2.mid)};
                    addHideLine(l1, line);
                    addHideLine(l2, line);
                }
            } else if (pointInLine(p12, l2)) {
                if (pointInLine(p21, l1) && !vecEqual(p12, p21)) {
                    let line = {x1: p12.x, y1: p12.y, x2: p21.x, y2: p21.y, hide:mixId(l1.mid, l2.mid)};
                    addHideLine(l1, line);
                    addHideLine(l2, line);
                } else if (pointInLine(p22, l1) && !vecEqual(p12, p22)) {
                    let line = {x1: p12.x, y1: p12.y, x2: p22.x, y2: p22.y, hide:mixId(l1.mid, l2.mid)};
                    addHideLine(l1, line);
                    addHideLine(l2, line);
                }
            }
        }
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