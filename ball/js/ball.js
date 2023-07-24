class Ball {
    constructor({id, x, y, dir, dist, collide, role, color, interLen}) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.role = role;

        this.collide = collide;
        this.dist = dist;
        this.passed = 0;
        this.times = 0;
        this.ctimes = 0;
        this.ignores = [];
        this.hit = 0;
        this.oldState = {ignores:[], hit:0, collide:null};
        this.interLen = interLen;

        this.color = color;
        this.radius = 5;
        this.status = BallStatus.CREATING;   
    }

    getPos() {
        // 计算新的碰撞时，球可能已经移动的了一段距离，逻辑部分不会实时改变球的坐标，所以需要重新计算当前位置，这部分可以考虑每次直接把球的当前点算出来
        let pos = {x: this.x + this.dir.x * this.passed, y: this.y + this.dir.y * this.passed};
        // 首次碰撞，需要将前置等待时间减去
        if (this.ctimes == 0) {
            pos.x -= this.interLen * this.dir.x;
            pos.y -= this.interLen * this.dir.y;
        }
        return pos;
    }

    saveState() {
        this.oldState.hit = this.hit;
        if (this.collide && this.collide.point) {
            this.oldState.collide = { 
                point: copyPoint(this.collide.point),
                line: this.collide.line
            };
        }
        this.oldState.ignores.length = 0;
        for (let l of this.ignores) {
            this.oldState.ignores.push(l);
        }
    }

    recoverState() {
        this.hit = this.oldState.hit;
        if (this.oldState.collide && this.oldState.collide.point) {
            this.collide.point = copyPoint(this.oldState.collide.point);
            this.collide.line = this.oldState.collide.line;
        }
        this.ignores.length = 0;
        for (let l of this.oldState.ignores) {
            this.ignores.push(l);
        }
    }

    willCollide() {
        return this.collide.point != null;
    }

    checkIgnore() {
        this.ignores = resetIgnore(this.getPos(), this.ignores, this.collide);
    }

    calcCollide() {
        this.checkIgnore();
        let start = this.getPos();
        let collide = lcheckNextCollide(start, this.dir, this.ignores, this.hit);
        this.collide = collide;
        // 虚线物体或者当前为穿透球，需要记录正在那个敌方体内，再次碰撞其他物体前不会反复计算碰撞伤害
        this.hit = getHitId(this.collide);
        if (this.collide.point != null) {
            this.dist = distance({x:collide.point.x - this.x, y:collide.point.y - this.y});
            if (this.ctimes == 0) {
                // 还未第一次触发弹射的球，因为目标消失而重新计算碰撞点，需要加上起点等待距离
                this.dist += this.interLen;
            }
        } else {
            this.dist = 0;
        }
    }

    nextCollidePoint() {
        return this.collide.point;
    }

    nextCollideId() {
        if (!this.collide.line) {
            return -1;
        }
        return this.collide.line.mid;
    }

    nextCollideLine() {
        return this.collide.line;
    }

    restDist() {
        // 本次移动距离为弹射时的总距离-已经走过的距离
        return this.dist - this.passed;
    }

    move(d) {
        console.assert(this.dist >= 0, "dist can't be nagetive.");
        this.passed += d;
    }

    update() {
        if (this.hit == 0) {
            this.times += 1;
        }
        this.ctimes += 1;
        // 达到撞击次数上限，就不再计算该球
        if (this.times < this.role.times) {
            let l = this.nextCollideLine();
            this.dir = l.getReflectNorm(this.dir);
            this.passed = 0; // 只有反弹时才需要将pass设置为0
            assignPoint(this.collide.point, this);
            this.saveState();
            this.calcCollide();
            return true;
        } else {
            return false;
        }
    }
}

function ballLess(a, b) {
    let da = a.dist - a.passed;
    let db = b.dist - b.passed;
    if (da < db) {
        return true;
    } else if (da > db) {
        return false;
    } else {
        if (a.id < b.id) {
            return true;
        } else {
            return false;
        }
    }
}
