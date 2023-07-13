class Heap {
    constructor(less) {
        this.heap = [];
        this.less = less;
    }

    add(e) {
        this.heap.push(e);
        let i = this.heap.length - 1;
        while (i > 0) {
            let j = (i % 2 == 0) ? (Math.floor(i / 2) - 1) : Math.floor(i / 2);
            if (this.less(this.heap[i], this.heap[j])) {
                this.swap(i, j);
                i = j;
            } else {
                break;
            }
        }
    }

    swap(i, j) {
        let temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    pop() {
        if (this.heap.length == 0) {
            return null;
        }

        let e = this.heap[0];
        this.heap[0] = this.heap[this.heap.length - 1];
        this.heap.pop();

        if (this.heap.length > 1) {
            let i = 0;
            while (i < this.heap.length) {
                let m = i*2 + 1;
                let n = i*2 + 2;
                if (m >= this.heap.length) {
                    break;
                }
                if (n >= this.heap.length) {
                    // console.log("heap length:" + this.heap.length + " m:" + m + " i:" + i);
                    // console.log("m:" + objToString(this.heap[m]));
                    // console.log("i:" + objToString(this.heap[i]));
                    if (this.less(this.heap[m], this.heap[i])) {
                        this.swap(m, i);
                    }
                    break;
                } else {
                    let k = this.less(this.heap[m], this.heap[n]) ? m : n;
                    if (this.less(this.heap[k], this.heap[i])) {
                        this.swap(k, i);
                        i = k;
                    } else {
                        break;
                    }
                }
            }
        }

        return e;
    }
 
    empty() {
        return this.heap.length == 0;
    }

    count() {
        return this.heap.length;
    }

    clear() {
        this.heap.length = 0;
    }

    show() {
        let s = "";
        for (let e of this.heap) {
            s += objToString(e) + " \n";
        }
        console.log(s);
    }
}