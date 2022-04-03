"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../../src/util/logger");
describe('logger', () => {
    it('should do nothing by default', () => {
        expect(() => logger_1.log('')).not.toThrowError();
    });
    it('should allow override logger', () => {
        const mock = jest.fn();
        logger_1.enableLogger(mock);
        const message = 'message';
        const value = { value: 'value' };
        logger_1.log(message, value);
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock.mock.calls[0]).toEqual([`hunspell::${message}`, value]);
    });
});
//# sourceMappingURL=logger-spec.js.map