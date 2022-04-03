"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lodash_1 = require("lodash");
const path = require("path");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const loadModule_1 = require("../../src/loadModule");
const util_1 = require("../util");
const readFile = rxjs_1.bindNodeCallback(fs.readFile);
const mountBufferHunspell = async (factory, dirPath, fixture) => {
    const buffers = [];
    const read = async (filePath) => {
        const mountedPath = factory.mountBuffer((await readFile(filePath).toPromise()));
        buffers.push(mountedPath);
        return mountedPath;
    };
    const aff = await read(path.join(`${dirPath}`, `${fixture}.aff`));
    const dic = await read(path.join(`${dirPath}`, `${fixture}.dic`));
    const hunspell = factory.create(aff, dic);
    return {
        read,
        hunspell,
        dispose: () => {
            hunspell.dispose();
            buffers.forEach((x) => factory.unmount(x));
        },
    };
};
/**
 * Location to fixture files
 */
const baseFixturePath = path.join(__dirname, '../__fixtures__');
var TestType;
(function (TestType) {
    TestType["MatchSpell"] = ".good";
    TestType["MismatchSpell"] = ".wrong";
    TestType["Suggestion"] = ".sug";
    TestType["Stem"] = ".stem";
})(TestType || (TestType = {}));
var MountType;
(function (MountType) {
    MountType["Buffer"] = "buffer";
})(MountType || (MountType = {}));
/**
 * Iterate fixture directory, returns array of test for specified type.
 * @param fixturePath path to fixture
 * @param testType type of test by fixture extension. `good` is for matched spell, `wrong` for misspell, `sug` for suggestion.
 */
const getFixtureList = (fixturePath, testType, skipList = []) => lodash_1.flatten(fs
    .readdirSync(fixturePath)
    .filter((file) => path.extname(file) === testType)
    .map((file) => path.basename(file, testType))
    .filter((x) => {
    if (lodash_1.includes(skipList, x)) {
        console.log(`Skipping test fixture '${x}'`); //tslint:disable-line:no-console
        return false;
    }
    return true;
})
    .map((fixture) => [
    [fixture, MountType.Buffer, async (factory) => await mountBufferHunspell(factory, baseFixturePath, fixture)],
]));
const readWords = async (fixture, testType) => await readFile(`${path.join(baseFixturePath, fixture)}${testType}`, 'utf-8')
    .pipe(operators_1.map((value) => value.split('\n').filter((x) => !!x)))
    .toPromise();
const getExpectedWords = (expectedWordsFileName) => {
    return ([
        ...fs
            .readFileSync(expectedWordsFileName, 'utf-8')
            .split('\n')
            .filter((x) => !!x)
            .map((x) => {
            const splitted = x.split(', ');
            if (splitted.length === 1 && !lodash_1.includes(util_1.excludedWords, splitted[0])) {
                return splitted[0];
            }
            const filtered = splitted.filter((word) => !lodash_1.includes(util_1.excludedWords, word));
            if (filtered.length > 0) {
                return filtered;
            }
            return null;
        }),
    ] || []).filter((x) => !!x);
};
/**
 * running original hunspell's spec.
 *
 */
describe('hunspell', () => {
    let hunspellFactory;
    //load module one time before test begins
    beforeAll(async () => {
        hunspellFactory = await loadModule_1.loadModule();
    });
    /**
     * Function to generate test case for each test fixtures.
     * Test case reads fixture setup (*.good, *.wrong, *.sug), run assertion function to compare with expected value.
     * @param fixture name of fixture, in absolute path form without extension of file.
     * @param testType type of test by fixture extension. `good` is for matched spell, `wrong` for misspell, `sug` for suggestion.
     * @param assertionValue function to get value to assert
     * @param expected expected value to compare with assertionValue.
     */
    const buildSpellAssertion = (testType, expectedValue, skipList = []) => {
        const fixtureList = getFixtureList(baseFixturePath, testType, skipList);
        it.each(fixtureList)(`fixture '%s' for %s`, async (fixture, _mountType, factory) => {
            const { hunspell, dispose } = await factory(hunspellFactory);
            const words = await readWords(fixture, testType);
            words
                .filter((word) => !lodash_1.includes(util_1.excludedWords, word))
                .forEach((word) => {
                const value = hunspell.spell(word);
                expect({ word, value }).toEqual({ word, value: expectedValue });
            });
            dispose();
        });
    };
    describe('should match correct word', () => {
        const matchCorrectWordFixtureSkipList = ['morph'];
        buildSpellAssertion(TestType.MatchSpell, true, matchCorrectWordFixtureSkipList);
    });
    describe('should match missplled word', () => {
        buildSpellAssertion(TestType.MismatchSpell, false);
    });
    describe('should suggest misspelled word-refactor', () => {
        const testType = TestType.Suggestion;
        const suggestionFixtureSkipList = ['1463589', 'i54633', 'map'];
        const fixtureList = getFixtureList(baseFixturePath, TestType.Suggestion, suggestionFixtureSkipList);
        it.each(fixtureList)(`fixture '%s' for %s`, async (fixture, _mountType, factory) => {
            const { hunspell, dispose } = await factory(hunspellFactory);
            const base = path.join(baseFixturePath, `${fixture}`);
            const expectedSuggestions = getExpectedWords(`${base}${testType}`);
            const words = await readWords(fixture, TestType.MismatchSpell);
            //run suggestion, construct results into Array<string|Array<string>>
            const suggested = [];
            words
                .filter((word) => !lodash_1.includes(util_1.excludedWords, word))
                .forEach((word) => {
                const ret = hunspell.suggest(word);
                if (ret.length > 0) {
                    suggested.push(ret.length > 1 ? ret : ret[0]);
                }
            });
            //fixture should equal to actual suggestion
            expect(suggested).toEqual(expectedSuggestions);
            dispose();
        });
    });
    describe('should suggest stems', () => {
        const testType = TestType.Stem;
        const fixtureList = getFixtureList(baseFixturePath, testType, []);
        it.each(fixtureList)(`fixture '%s' for %s`, async (fixture, _mountType, factory) => {
            const { hunspell, dispose } = await factory(hunspellFactory);
            const base = path.join(baseFixturePath, `${fixture}`);
            const expectedStems = getExpectedWords(`${base}${testType}`);
            const words = await readWords(fixture, TestType.MatchSpell);
            //run stem, construct results into Array<string|Array<string>>
            const stemmed = [];
            words
                .filter((word) => !lodash_1.includes(util_1.excludedWords, word))
                .forEach((word) => {
                const ret = hunspell.stem(word);
                if (ret.length > 0) {
                    stemmed.push(ret.length > 1 ? ret : ret[0]);
                }
            });
            //fixture should equal to actual suggestion
            expect(stemmed).toEqual(expectedStems);
            dispose();
        });
    });
    describe('add words or dictionary in runtime', () => {
        const getHunspell = () => mountBufferHunspell(hunspellFactory, baseFixturePath, 'base');
        it.each([MountType.Buffer])('should able to add new dictionary into existing dictionary for %s', async () => {
            const { hunspell, dispose, read } = await getHunspell();
            expect(hunspell.spell('foo')).toBe(false);
            hunspell.addDictionary(await read(path.join(baseFixturePath, 'break.dic')));
            expect(hunspell.spell('foo')).toBe(true);
            dispose();
        });
        it.each([MountType.Buffer])('should able to add new word into existing dictionary for %s', async () => {
            const { hunspell, dispose } = await getHunspell();
            expect(hunspell.spell('nonexistword')).toBe(false);
            hunspell.addWord('nonexistword');
            expect(hunspell.spell('nonexistword')).toBe(true);
            dispose();
        });
        it.each([MountType.Buffer])('should able to add new word with affix into existing dictionary for %s', async () => {
            const { hunspell, dispose } = await getHunspell();
            expect(hunspell.spell('tre')).toBe(false);
            hunspell.addWordWithAffix('tre', 'uncreate');
            expect(hunspell.spell('tre')).toBe(true);
            expect(hunspell.spell('trive')).toBe(true);
            dispose();
        });
        it.each([MountType.Buffer])('should able to remove word from existing dictionary for %s', async () => {
            const { hunspell, dispose } = await getHunspell();
            expect(hunspell.spell('seven')).toBe(true);
            hunspell.removeWord('seven');
            expect(hunspell.spell('seven')).toBe(false);
            dispose();
        });
    });
});
//# sourceMappingURL=hunspell-spec.js.map