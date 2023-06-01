const menu = require("./input").menu;

const m = new menu();
m.newBar("testbar", 3);
m.newBool("testbool");
m.newInt("loooooongeeeeeeer");
m.newString("teststring");
m.newInt('custom', 2, -1, 5, 2);
m.newChose('chooseField', ["some1", "el2", "pashalka"]);
m.newNumInput('count', '', '');

m.cycle().then(value => console.table(value));

