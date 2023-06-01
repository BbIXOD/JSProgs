'use strict';
class Network {
    randWeight() {
        return Math.random() - Math.random();
    }

    create(layers, inputs, outputs, optimal = Math.ceil((inputs + outputs) / 2), actFoo = x => Math.tanh(x), delta = null) {
        this.actFoo = actFoo;
        this.delta = delta;
        layers = layers < 3 ? 3 : layers;

        this.values = new Array(layers - 2);
        for (let i = 0; i < layers - 2; i++)
            this.values[i] = new Float32Array(optimal);
        this.values.push(new Float32Array(outputs));
        this.values.unshift(new Float32Array(inputs));


        this.weights = [];
        for (let i = 0; i < layers - 3; i++) {
            this.weights.push([]);
            for (let j = 0; j < optimal; j++) {
                this.weights[i].push(new Float32Array(optimal+1));
            }
        }
        this.weights.unshift([]);
        for (let i = 0; i < optimal; i++) {
            this.weights[0].push(new Float32Array(inputs+1));
        }
        this.weights.push([]);
        for (let i = 0; i < outputs; i++) {
            this.weights.at(-1).push(new Float32Array(optimal+1));
        }

        for (const layer of this.weights)
            for (const neuron of layer)
                for (const weight in neuron)
                    neuron[weight] = this.randWeight();
        return this;
    }

    loadFrom(file, foo = x => Math.tanh(x)) {
        const fs = require('fs');
        const nn = JSON.parse(fs.readFileSync(file, 'utf8'));
        nn.actFoo = foo;
        for (let layer = 0;  layer < nn.weights.length; layer++)
            nn.weights[layer] = nn.weights[layer].map(x => Object.values(x));

        return this.load(nn);
    }

    load(source) {
        this.weights = source.weights;
        this.actFoo = source.actFoo;
        this.delta = source.delta;

        const length = source.weights.length;
        this.values = new Array(length);
        this.values[0] = new Float32Array(source.weights[0][0].length - 1);
        for (let i = 1; i < length; i++)
            this.values[i] = new Float32Array(source.weights[1].length);
        this.values.push(new Float32Array(source.weights.at(-1).length));
        return this;
    }

    save(file = null) {
        const saving = {
            weights: this.weights,
            actFoo: this.actFoo,
            delta: this.delta,
        }
        if (file) {
            const fs = require('fs');
            fs.writeFileSync(file, JSON.stringify(saving), 'utf8');
        }

        return saving;
    }

    round(delta) {
        let arg = delta ? delta : 0.1;
        let roundTo = 0;
        while (arg < 1) {
            arg *= 10;
            roundTo++;
        }
        return roundTo;
    }

    activate(layer, neuron) {
        let sum = 0, count = 0;
        const arr = this.weights[layer][neuron];
        for (const value of this.values[layer]) {
            sum += value * arr[count++];
        }
        sum += arr[count];
        this.values[++layer][neuron] = this.actFoo(sum);
    }

    ask(...args) {
        this.askTrain(...args);
        this.showRes();
        return this;
    }

    askTrain(...args) {
        if (args.length !== this.values[0].length) {
            throw new Error("Incorrect arguments amount")
        }

        for (const value in this.values[0]) {
            this.values[0][value] = args.shift();
        }

        for (let layer = 0;  layer < this.weights.length; layer++) {
            for (let neuron = 0;  neuron < this.weights[layer].length; neuron++) {
                this.activate(layer, neuron)
            }
        }
        return this;
    }

    train(d, ...args) {
        const flag = args.at(-1) === 'debug';
        if (flag) args.pop();
        this.delta = d;
        let delta, curDelta;
        const step = d / this.weights.flat().length;

        const changing = (el1, el2 = 1) => {
            return el1 * el2;
        }

        const changeWeight = (mod, layer, neuron) => {
            const length = this.weights[layer][neuron].length - 1;
            const w = this.weights[layer][neuron];
            for (let weight = 0; weight < length; weight++) {
                w[weight] += changing(mod, this.values[layer][weight]) * step;
            }
            w[length] += changing(mod) * step;
            if (layer === 0) return;
            layer--;
            for (let weight = 0; weight < length; weight++) {
                changeWeight(mod * this.weights[layer][neuron][weight], layer, weight);
            }
        }
        do {
            delta = 0;
            for (const arr of args) {
                const inputs = arr.slice(0, this.values[0].length);
                const outputs = arr.slice(this.values[0].length)
                this.askTrain(...inputs);

                for (let neuron = 0; neuron < this.weights.at(-1).length; neuron++) {
                    curDelta =  outputs[neuron] - this.values.at(-1)[neuron];
                    changeWeight(curDelta, this.weights.length - 1, neuron);
                    delta += Math.abs(curDelta);
                }
            }
            delta /= args.length;
            //console.log(delta);
        } while (delta >= d);
        return this;
    }

    showRes() {
        const r = this.round(this.delta);
        const showing = (where) => {
            let str = '';
            for (const val of where) {
                str += val.toFixed(r) + ' '; //maybe here must be always floor rounding
            }
            console.log(str);
        }

        console.log("Inputs: ");
        showing(this.values[0]);
        console.log("Outputs: ");
        showing(this.values.at(-1));
        return this;
    }
}

const rainForce = (count, max, pars) => {
    let i = 0;
    const co =new Float32Array(count);
    const nns = (() => {
        const arr = new Array(count);
        for (let el = 0; el < count; el++)
            arr[el] = new Network().create(...pars);
        return arr;
    })();

    const randVal = max => Math.floor(Math.random() * max);

     const cycle = (score, ...inputs) => {
            co[i] += score;
            if (inputs[0] === undefined) {
                i++;
                if (i === count) return nextGen();
                return cycle;
            }
            return  nns[i].askTrain(...inputs).values.at(-1);
    }

    const nextGen = () => {
        for (let el = 0; el < count; el++) {
            if (co[el] >= max) return nns[el];
        }
         for (let el = 1; el < count; el++) {
             co[el] += co[el - 1];
         }

        const nnsOld = [];
        for (let el in nns)
            nnsOld[el] = JSON.parse(JSON.stringify(nns[el].weights));

        for (let  i = 0; i < count; i++) {
            let indexF = 0, indexM = 0;
            const randomF = Math.random() * co.at(-1);
            while (indexF < count && randomF > co[indexF++]) {}
            indexF--;
            const randomM = Math.random() * co.at(-1);
            while (indexM < count && randomM > co[indexM++]) {}
            indexM--;

            const el = nns[i];

            for (const layer in el.weights)
                for (const neuron in el.weights[layer])
                    for (const weight in el.weights[layer][neuron]) {

                        if (randVal(101) === 100) {
                            el.weights[layer][neuron][weight] = el.randWeight();
                        } else {
                            const indexP = randVal(2) === 0 ? indexF : indexM;
                            el.weights[layer][neuron][weight] = nnsOld[indexP][layer][neuron][weight];
                        }
                    }
        }
        i = 0;
        co.fill(0);
        return cycle;
    }

    return cycle;
}

const test = (mode = "all") => {
    const boolTest = [
        //[1, 1, 1, 1, 0],
        [1, 0, 1, 1, 0],
        [1, 0, 0, 1, 0],
        [0, 1, 0, 0, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 1],
        [0, 0, 0, 0, 1],
    ]
    if (mode === "all" || mode === "train") {

        const nn1 = new Network();
        nn1.create(3, 3, 2, undefined)
            .load(nn1.save("nn.json"))
            .loadFrom("nn.json", x => Math.tanh(x))
            .train(0.01, ...boolTest)
            .askTrain(0, 0, 1)
            .showRes()
            .ask(1, 1, 1);
    }
    if (mode === "all" || mode === "evo") {
        const inputs = 3;
        const t = rainForce(200, 49, [3, inputs, 1, undefined, x => x > 0 ? x : 0.1*x]);
        let score = 0;
        let out;
        do {
            score = 0;
            for (const el of boolTest) {
                const inp = el.slice(0, inputs);
                const res = t(0, ...inp);
                const output = el[inputs];
                const re = 1 / (Math.abs(output - res[0]) + 1);
                score += 10 ** re;
            }
            out = t(score);
        } while (typeof out === 'function');
        out.ask(0, 0, 1).ask(1, 0, 0).ask(0, 1, 0);
    }

}

//test("train");

module.exports.rfc = rainForce;
module.exports.nn = Network;