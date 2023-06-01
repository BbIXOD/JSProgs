'use strict';
class Menu {
    constructor() {
        this.array = [];
        this.col = 0;
        this.symbols = {
            chose: "\x1b[42m",
            chose2: "\x1b[33m",
            chose3: "\x1b[30m",
            normal: "\x1b[0m",
            on: "on",
            off: "off",
            full: "█",
            void: ".",
            borderLeft: "<",
            borderRight: ">",
            borderLeft2: "",
            borderRight2: "|",
        }
    }

    check(val, min, max) {
        if (val < min) return max + val - min + 1;
        if (val > max) return min + val - max - 1;
        return val
    }

    changeValue(incr) {
        if (this.col === this.array.length) return;


        const current = this.array[this.col];
        if (current.type === 'string' || current.type === 'numString') return;

        if (current.type === 'bool') {
            current.val = !current.val;
        }
        else {
            const step = current.step ? current.step : 1;
            const signed = incr ? step : -step;
            current.val = this.check(current.val + signed, current.min, current.max);
        }
    }

    newInt(item, val = 0, min = -Infinity, max = Infinity, step = 1, def = 'let') {
        this.array.push({type: "int", name:item, val, min, max, step, def});
    }

    newString(item, val = '', def = 'let') {
        this.array.push({type: "string", name: item, val, def});
    }

    newNumInput(item, val = '', def = 'let') {
        this.array.push({type: "numString", name: item, val, def});
    }

    newBool(item, val = false, def = 'let') {
        this.array.push({type: "bool", name: item, val, def});
    }

    newBar(item, val = 0, max = 10, def = 'let') {
        this.array.push({type: "bar", name: item, val, min: 0, max, def});
    }

    newChose(item, val = [''], def = 'let') {
        this.array.push({type: "choose", name: item, val: 0, min: 0, max:val.length - 1, def, list: val});
    }

    show(swipe = 'none') {
        console.clear();
        const color = (color, item) => {
            return color + item + this.symbols.normal;
        }

        const data = {};
        let maxLength = 0;
        for (let el = 0; el < this.array.length; el++) {
            const item = this.array[el];
            const name = item.name;
            let val = item.val;
            let bl, br;

            if (name.length > maxLength) maxLength = name.length;
            if (item.type === "string" || item.type === "numString") {
                bl = this.symbols.borderLeft2;
                br = this.col === el && swipe === "enter" ?
                    color(this.symbols.chose3, this.symbols.borderLeft2) : this.symbols.borderRight2;
            }
            else{
                bl = this.col === el && swipe === "left" ?
                    color(this.symbols.chose2, this.symbols.borderLeft) : this.symbols.borderLeft;
                br = this.col === el && swipe === "right" ?
                    color(this.symbols.chose2, this.symbols.borderRight) : this.symbols.borderRight;
            }


            if (item.type === "bool")
                val = val ? "on" : "off";
            else if (item.type === "bar")
                val = this.symbols.full.repeat(val) + this.symbols.void.repeat(item.max - val);
            else if (item.type === "choose")
                val = item.list[val];

            data[name] = bl + val + br;
        }
        data["exit"] = '';

        let el = 0;
        for (const [key, value] of Object.entries(data)) {
            const name = el++ === this.col ? color(this.symbols.chose, key) : key;
            console.log(name + ' '.repeat(maxLength - key.length) + '\t' + value);
        }
    }

    clip(side) {
        this.show(side);
        setTimeout(this.show.bind(this), 250);
    }

    cycle() {
        return new Promise((resolve) => {
            const stdin = process.stdin;
            stdin.setRawMode(true);
            stdin.setEncoding('utf8');
            stdin.resume();

            this.show();
            const obj = {};

            stdin.on('data', key => {
                if (key === '\r' && this.col === this.array.length) {
                    stdin.pause();
                    console.clear();
                    for (let el of this.array) {
                        if (el.type === 'numString') obj[el.name] = Number(el.val);
                        else if (el.type === 'choose') obj[el.name] = el.list[el.val];
                        obj[el.name] = el.val;
                    }
                    resolve(obj);
                } else if (key === '\x1b[A') {
                    this.col = this.check(this.col - 1, 0, this.array.length);
                    this.show();
                } else if (key === '\x1b[B') {
                    this.col = this.check(this.col + 1, 0, this.array.length);
                    this.show();
                } else if (this.array[this.col].type === 'string' || this.array[this.col].type === 'numString') {
                    const point = this.array[this.col];
                    if (key === '\b') point.val = point.val.substring(0, point.val.length - 1);
                    else if ((point.type === 'string' && key.match(/^[\w\s]/) && key.match(/[^\r]/))
                        || (point.type === 'numString' && key.match(/^\d/))) {
                        point.val += key;
                    }
                    this.clip('enter');
                } else if (key === '\x1B[D' || key === '\x1B[C') {
                    const right = key === '\x1B[C';
                    this.changeValue(right);
                    const side = right ? 'right' : 'left';
                    this.clip(side);
                }
            });
        })
    }
}

module.exports.menu = Menu;