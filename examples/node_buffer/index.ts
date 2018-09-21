//tslint:disable:no-console
import * as fs from 'fs';
import * as path from 'path';
import { bindNodeCallback } from 'rxjs';
import { loadModule } from '../../src';
import { enableLogger } from '../../src/util/logger';
import { runHunspell } from '../runHunspell';

enableLogger(console.log.bind(console));

const readFile = bindNodeCallback(fs.readFile);
const dictPath = path.resolve('../../spec/__fixtures__');

const runBufferFileHunspell = async () => {
  const hunspellFactory = await loadModule();

  const affBuffer = await readFile(path.join(dictPath, 'korean.aff')).toPromise();
  const dicBuffer = await readFile(path.join(dictPath, 'korean.dic')).toPromise();

  const affFile = hunspellFactory.mountBuffer(affBuffer, 'korean.aff');
  const dictFile = hunspellFactory.mountBuffer(dicBuffer, 'korean.dic');

  console.log(`mounted aff to '${affFile}'`);
  console.log(`mounted dic to '${dictFile}'`);

  runHunspell(hunspellFactory, affFile, dictFile);

  hunspellFactory.unmount(affFile);
  hunspellFactory.unmount(dictFile);
};

runBufferFileHunspell();
