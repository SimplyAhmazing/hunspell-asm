"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emscripten_wasm_loader_1 = require("emscripten-wasm-loader");
const hunspellMock = require("../../src/lib/node/hunspell");
const loadModule_1 = require("../../src/loadModule");
jest.mock('../../src/lib/node/hunspell', () => jest.fn());
jest.mock('emscripten-wasm-loader', () => ({
    isWasmEnabled: jest.fn(),
    isNode: jest.fn(),
    getModuleLoader: jest.fn(),
    mountBuffer: jest.fn(),
    unmount: jest.fn()
}));
const getModuleMock = () => ({
    cwrap: jest.fn(),
    FS: { mkdir: jest.fn() },
    Runtime: jest.fn(),
    getValue: jest.fn(),
    UTF8ToString: jest.fn()
});
describe('loadModule', () => {
    it('should create moduleLoader on browser', async () => {
        const mockModuleLoader = jest.fn();
        emscripten_wasm_loader_1.isNode.mockReturnValue(false);
        emscripten_wasm_loader_1.getModuleLoader.mockImplementationOnce((cb) => {
            cb(getModuleMock());
            return mockModuleLoader;
        });
        await loadModule_1.loadModule();
        expect(emscripten_wasm_loader_1.getModuleLoader.mock.calls[0][1]).toEqual(hunspellMock);
    });
    it('should create module on node', async () => {
        const mockModuleLoader = jest.fn();
        emscripten_wasm_loader_1.isNode.mockReturnValue(true);
        emscripten_wasm_loader_1.getModuleLoader.mockReturnValueOnce(mockModuleLoader);
        await loadModule_1.loadModule();
        expect(emscripten_wasm_loader_1.getModuleLoader.mock.calls[0][1]).toEqual(hunspellMock);
    });
});
//# sourceMappingURL=loadModule-spec.js.map