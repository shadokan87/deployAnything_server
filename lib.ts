const { NodeVM } = require("vm2");
const vm = new NodeVM({ require: { external: true, root: "./" } });

export const functionToSandbox = (fn: Function) => {
    const str = `module.exports = ${fn.toString()};`
    return { str, sandboxed: vm.run(str) }
};