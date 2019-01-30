//tslint:disable:no-console
import { loadModule } from '../../src/index';
import { enableLogger } from '../../src/util/logger';
import { runHunspell } from '../runHunspell';

enableLogger(console.log.bind(console));

const runBrowserHunspell = async () => {
  const hunspellFactory = await loadModule();

  const aff = await fetch('https://unpkg.com/hunspell-dict-ko@0.0.3/ko.aff');
  const affBuffer = new Uint8Array(await aff.arrayBuffer());
  const affFile = hunspellFactory.mountBuffer(affBuffer, 'korean.aff');

  const dic = await fetch('https://unpkg.com/hunspell-dict-ko@0.0.3/ko.dic');
  const dicBuffer = new Uint8Array(await dic.arrayBuffer());
  const dictFile = hunspellFactory.mountBuffer(dicBuffer, 'korean.dic');

  runHunspell(hunspellFactory, affFile, dictFile);

  hunspellFactory.unmount(affFile);
  hunspellFactory.unmount(dictFile);
};

runBrowserHunspell();
