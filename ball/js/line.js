class Line {
    constructor({x1, y1, x2, y2, solid, mid, color, width=1, hide=0}) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.solid = solid;
        this.mid = mid;
        this.hide = hide;
        this.hideLines = [];
        this.color =  color;
        this.width = width;
        this.normal = normalize(normalVector(vector(this)));
    }

    toString() {
        return "[" + this.x1 + "," + this.y1 + "," + this.x2 + "," + this.y2 + "]";
    }

    setColor(color) {
        this.color = color;
    }

    isHitHide(point) {
        if (this.hideLines.length == 0) {
            return false;
        }
        for (let l of this.hideLines) {
            if (pointInLine(point, l)) {
                return true;
            }
        }
        return false;
    }

    addHideLine(line) {
        this.hideLines.push(line);
    }

    hideEachOther(line) {
        let l1 = this;
        let l2 = line;
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
                l2.addHideLine(l1);
            } else if (pointInLine(p21, l1) && pointInLine(p22, l1)) {
                l2.hide = l1.mid;
                l1.addHideLine(l2);
            } else if (pointInLine(p11, l2)) {
                if (pointInLine(p21, l1) && !vequal(p11, p21)) {
                    let l = new Line({x1: p11.x, y1: p11.y, x2: p21.x, y2: p21.y, hide:mixId(l1.mid, l2.mid)});
                    l1.addHideLine(l);
                    l2.addHideLine(l);
                } else if (pointInLine(p22, l1) && !vequal(p11, p22)) {
                    let l = new Line({x1: p11.x, y1: p11.y, x2: p22.x, y2: p22.y, hide:mixId(l1.mid, l2.mid)});
                    l1.addHideLine(l);
                    l2.addHideLine(l);
                }
            } else if (pointInLine(p12, l2)) {
                if (pointInLine(p21, l1) && !vequal(p12, p21)) {
                    let l = new Line({x1: p12.x, y1: p12.y, x2: p21.x, y2: p21.y, hide:mixId(l1.mid, l2.mid)});
                    l1.addHideLine(l);
                    l2.addHideLine(l);
                } else if (pointInLine(p22, l1) && !vequal(p12, p22)) {
                    let l = new Line({x1: p12.x, y1: p12.y, x2: p22.x, y2: p22.y, hide:mixId(l1.mid, l2.mid)});
                    l1.addHideLine(l);
                    l2.addHideLine(l);
                }
            }
        }
    }

    move(yoffset) {
        this.y1 += yoffset;
        this.y2 += yoffset;
        this.hide = 0;
        this.hideLines.length = 0;
    }

    getReflectNorm(dir) {
        let through = ldata.isThrough;
        // 虚线或者穿透球不是打在边框上
        if (!this.solid || (through && this.mid > 0)) {
            return dir;
        }
        let normal = this.normal;
        let rft = reflectVector(dir, normal);
        let rft_normal = normalize(rft);
        if (rft_normal.x == 0 || rft_normal.y == 0) {
            let angle = Math.PI / 36;
            // 旋转一个角度
            let rotate = {
                x : rft_normal.x * Math.cos(angle) - rft_normal.y * Math.sin(angle),
                y : rft_normal.x * Math.sin(angle) + rft_normal.y * Math.cos(angle)
            };
            rft_normal = rotate;
        }
        return rft_normal;
    }

    unHide(mid) {
        if (this.hide == mid) {
            this.hide = 0;
        }

        let temp = [];
        for (let l1 of this.hideLines) {
            let ids = unMixId(l1.mid);
            if (ids[0] != mid && ids[1] != mid) {
                temp.push(l1);
            }
        }
        this.hideLines = temp;
    }

    isHiden() {
        return this.hide > 0 || this.hideLines.length > 0;
    }
}