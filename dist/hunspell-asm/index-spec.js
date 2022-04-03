"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index = require("../../src/index");
describe('index', () => {
    it('should export correctly', () => {
        const { enableLogger, log, loadModule } = index;
        expect(enableLogger).toBeDefined();
        expect(log).toBeDefined();
        expect(loadModule).toBeDefined();
    });
});
//# sourceMappingURL=index-spec.js.map