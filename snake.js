const Network = require("./network").nn;
const rf = require("./network").rfc(200, 40 * 4 ** 2, [5, 6, 3]);

class Snake {
    constructor(x, y, border = true, draw = true, hunger = undefined, symbols = undefined) {
        const START_SNAKE = 3;

        this.symbols = symbols === undefined ? {
            air: ' ',
            head: "@",
            deadHead: '%',
            body: '*',
            apple: '$',
            border: '#',
        } : symbols;

        if (hunger) {
            this.curH = hunger;
            this.hunger = hunger;
        }
        this.alive = true;
        this.draw = draw;
        this.score = 0;
        this.applePos = {x: 0, y: 0};

        this.x = x;
        this.y = y;
        this.field = [];
        for (let i = 0; i < y; i++) {
            const arr = new Array(x).fill(this.symbols.air);
            if (border) {
                arr.push(this.symbols.border);
                arr.unshift(this.symbols.border);
            }
            this.field.push(arr);
        }
        if (border) {
            this.field.push(new Array(x + 2).fill(this.symbols.border));
            this.field.unshift(new Array(x + 2).fill(this.symbols.border));
            this.x++;
            this.y++;
        }


        this.snake = [];
        this.snake.push({ x: this.rInt(x - START_SNAKE, START_SNAKE),
            y: this.rInt(y - START_SNAKE, START_SNAKE) });


        const bias = {x: 0, y: 0};
        this.rInt(2) === 0 ? bias.x = this.rInt(2) * 2 - 1 : bias.y = this.rInt(2) * 2 - 1;
        this.dir = {x: -bias.x, y: -bias.y};
        for (let i = 1; i < START_SNAKE; i++) {
            const prev = this.snake.at(-1);
            this.snake.push({x: bias.x + prev.x, y: bias.y + prev.y});
        }


        this.newApple();
        this.render();
        if (draw) this.drawField();
    }

    rInt(max, min = 0) {
        return min + Math.floor(Math.random() * (max - min))
    }

    toWorldCoord(pos) {
        if (pos.y === this.y) pos.y = 0;
        if (pos.y === -1) pos.y = this.y - 1;
        if (pos.x === this.x) pos.x = 0;
        if (pos.x === -1) pos.x = this.x - 1;
        return pos;
    }

    getChar(pos) {
        this.toWorldCoord(pos);
        return this.field[pos.y][pos.x];
    }

    setChar(pos, value) {
        this.toWorldCoord(pos);
        this.field[pos.y][pos.x] = value;
    }

    newApple() {
        const free = [];
        for (const string in this.field)
            for (const place in this.field[string])
                if (this.field[string][place] === this.symbols.air)
                    free.push({y: string, x: place});
        const pos = free[this.rInt(free.length)];
        this.applePos = pos;
        return this.setChar(pos, this.symbols.apple);
    }

    drawField() {
        console.clear();
        for (const string of this.field) {
            let str = '';
            for (const place of string)
                str += place;
            console.log(str);
        }
        console.log(this.curH);
    }

    render( last = false) {
        if (this.getChar(this.snake[0]) === this.symbols.apple) {
            this.score++;
            this.newApple();
            if (this.hunger) this.curH = this.hunger;
        }
        for (const body of this.snake)
            this.setChar(body, this.symbols.body);
        this.setChar(this.snake[0], last ? this.symbols.deadHead : this.symbols.head);
        if (this.draw) this.drawField();
        if (last) {
            this.alive = false;
            if (this.draw) console.log(this.score);
        }
    }

    mov() {
        const first = this.snake[0];
        const newFirst = {x: first.x + this.dir.x, y: first.y + this.dir.y};
        if (this.hunger && this.curH === 0) return this.render(true);

        if (this.getChar(newFirst) === this.symbols.air
            || newFirst.x === this.snake.at(-1).x
            && newFirst.y === this.snake.at(-1).y) this.setChar(this.snake.pop(), this.symbols.air);
        else if (this.getChar(newFirst) === this.symbols.body
            || this.getChar(newFirst) === this.symbols.border) {
            return this.render(true);
        }

        if(this.hunger) this.curH--;

        this.snake.unshift(newFirst);
        return this.render();
    }

    turn(direction) {
        const tArr = Object.values(this.dir);
            const temp = {x: tArr[1], y: tArr[0]};
            if (direction === 'left') temp.x *= -1
            else if (direction === 'right') temp.y *= -1;
            this.dir = temp;
            return this;
    }

    locate() {
        const arr = [];
        const temp = [this.dir.x, this.dir.y];
        for (let i = 0; i < 4; i++) {
            let char = this.symbols.air;
            let pos = {x: this.snake[0].x, y: this.snake[0].y};
            let dist = 0;
            while (char === this.symbols.air || char === this.symbols.apple) {
                pos.x += temp[0];
                pos.y += temp[1];
                dist++;
                char = this.getChar(pos);
            }
            arr.push(dist);
            const temp2 = temp[0];
            temp[0] = -temp[1];
            temp[1] = temp2;
        }
        const distance = [this.applePos.x - this.snake[0].x, this.applePos.y - this.snake[0].y];
        if (this.dir.y === 0) {
            arr.push(distance[0] * this.dir.x);
            arr.push(distance[1] * this.dir.x);
        }
        else {
            arr.push(distance[1] * this.dir.y);
            arr.push(distance[0] * this.dir.y * -1);
        }
        //arr.push(this.snake.length);
        return arr;
    }
}

const play = () => {
    const snake = new Snake(10, 10, true, true, 30);

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();

    stdin.on('data', key => {
        if (key === 'a') snake.turn('right');
        else if (key === 'd') snake.turn('left');
    })

    const loop = (ms) => setTimeout(() => {
        snake.mov();
        snake.locate();
        if (!snake.alive) process.exit(0);
        loop(ms)
    }, ms);
    loop(500);
}


    const playNN = (network) => {
        const s = new Snake(10, 10, true, true, 40);
        const cycle = async() => {
            const out = network.askTrain(...s.locate()).values.at(-1);
            let max = -1;
            let maxI = 2;
            for (let i = 0; i < out.length; i++)
                if (out[i] > max) {
                    max = out[i];
                    maxI = i;
                }
            if (maxI === 0) await s.turn('right');
            else if (maxI === 1) await s.turn('left');
            await s.mov();
            if (s.alive) return setTimeout(cycle, 1000);
        };
        cycle();
    }

const teach = () => {
    const foo = rf;
    let f;
    do {
        const array = [];
        for (let i = 0; i < 5; i++) {
            const s = new Snake(10, 10, true, false, 20);
            let time = 0;

            while (s.alive) {
                const out = foo(0, ...s.locate());
                let max = -1;
                let maxI = 2;
                for (let j = 0; j < out.length; j++)
                    if (out[j] > max) {
                        max = out[j];
                        maxI = j;
                    }
                if (maxI === 0) s.turn('right');
                else if (maxI === 1) s.turn('left');
                s.mov();
                time++;
            }
            array.push(time * 4 ** (s.score + 1));

        }
        const min = Math.min(...array);
        f = foo(min);
    } while (typeof f === 'function');



    playNN(f)
    f.save("./nn.json");
}
teach();
//play();
//playNN(new Network().loadFrom("./nn.json"));