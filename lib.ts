const { NodeVM } = require("vm2");
const vm = new NodeVM({ allowAsync: true, require: { external: true, root: "./" } });

/**
 * Takes a function and prepares it for sandboxed execution.
 *
 * @template T - The type of the function to sandbox.
 * @param fn - The function to be sandboxed.
 * @returns An object containing:
 *   - `str`: The stringified version of the function as a CommonJS module export.
 *   - `sandboxed`: The result of executing the stringified function in a VM sandbox, cast to type T.
 *
 * @remarks
 * This utility is useful for isolating function execution in a virtual machine context.
 * 
 * @example
 * ```typescript
 * const add = (a: number, b: number) => a + b;
 * const { str, sandboxed } = functionToSandbox(add);
 * console.log(sandboxed(2, 3)); // 5
 * ```
 */
export const functionToSandbox = <T extends Function>(fn: T) => {
    const str = `module.exports = ${fn.toString()};`
    return { str, sandboxed: vm.run(str) as T}
};