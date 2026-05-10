const alasql = require('alasql');
try {
    const res = alasql("print table");
    console.log("RES:", res);
} catch (e) {
    console.log("ERR:", e.message);
}
