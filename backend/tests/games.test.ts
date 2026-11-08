import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {GameStore} from '../src/game-store';
import {createGameServer} from '../src/server';
import {GAME_ID_ALPHABET, generateGameId} from '../src/game-id';

async function fixture() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bfv-games-'));
  const dataFile = path.join(directory, 'game-data.json');
  const defaultFile = path.resolve('game-default.json');
  const store = new GameStore(dataFile, defaultFile);
  return {directory, dataFile, defaultFile, store};
}

test('generates six-character IDs with O and I allowed and 0 and 1 excluded', () => {
  assert.ok(GAME_ID_ALPHABET.includes('O'));
  assert.ok(GAME_ID_ALPHABET.includes('I'));
  assert.ok(!GAME_ID_ALPHABET.includes('0'));
  assert.ok(!GAME_ID_ALPHABET.includes('1'));
  for (let i = 0; i < 100; i++) assert.match(generateGameId(), /^[A-Z2-9]{6}$/);
});

test('migrates an existing save and undo history without changing either', async t => {
  const {directory, dataFile, defaultFile, store} = await fixture();
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  const data = JSON.parse(await fs.readFile(defaultFile, 'utf-8'));
  data.regions.fraserview.team = 'RED';
  const saved = {data, undoStack: [{challenges: data.challenges, battles: data.battles}]};
  await fs.writeFile(dataFile, JSON.stringify(saved));
  await store.loadGame('MISSING');
  const migrated = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
  const ids = Object.keys(migrated);
  assert.equal(ids.length, 1);
  assert.match(ids[0]!, /^[A-Z2-9]{6}$/);
  assert.deepEqual(migrated[ids[0]!], saved);
  assert.equal((await store.loadGame(ids[0]!))!.getRegions().find(r => r.id === 'fraserview')!.team, 'RED');
});

test('keeps concurrent saves, undo history, reloads and resets isolated across restarts', async t => {
  const {directory, dataFile, defaultFile, store} = await fixture();
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  await assert.rejects(fs.readFile(dataFile), {code: 'ENOENT'});
  const ids = await Promise.all([store.createGame(), store.createGame()]);
  assert.notEqual(ids[0], ids[1]);
  for (const id of ids) assert.match(id!, /^[A-Z2-9]{6}$/);
  const first = store.getGame(ids[0]!)!;
  const second = store.getGame(ids[1]!)!;
  assert.equal(first.getChallenges().filter(c => c.status === 'ACTIVE').length, 6);
  const before = structuredClone(first.getChallenges());
  const activeId = before.find(c => c.status === 'ACTIVE')!.id;
  await Promise.all([
    first.completeChallenge(activeId, 'RED'),
    first.claimRegion('fraserview', 'RED'),
    second.claimRegion('fraserview', 'BLUE'),
    second.startBattle()
  ]);
  const restarted = new GameStore(dataFile, defaultFile);
  assert.equal(restarted.getGame(ids[0]!), undefined);
  assert.equal(restarted.getGame(ids[1]!), undefined);
  const loaded = (await restarted.loadGame(ids[0]!))!;
  const other = (await restarted.loadGame(ids[1]!))!;
  assert.equal(loaded.getRegions().find(r => r.id === 'fraserview')!.team, 'RED');
  assert.equal(other.getRegions().find(r => r.id === 'fraserview')!.team, 'BLUE');
  assert.equal(loaded.getChallenges().find(c => c.id === activeId)!.team, 'RED');
  assert.equal(await loaded.undo(), true);
  assert.deepEqual(loaded.getChallenges(), before);
  const otherSaved = JSON.parse(await fs.readFile(dataFile, 'utf-8'))[ids[1]!];
  await loaded.initializeNewGame();
  const resetSave = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
  assert.deepEqual(resetSave[ids[1]!], otherSaved);
  assert.equal(resetSave[ids[0]!].undoStack.length, 0);
  assert.equal(loaded.getRegions().find(r => r.id === 'fraserview')!.team, 'NONE');
  await loaded.claimRegion('fraserview', 'RED');
  await loaded.loadFromFile();
  assert.equal(loaded.getRegions().find(r => r.id === 'fraserview')!.team, 'RED');
});

test('does not replace unreadable or malformed saves with a default game', async t => {
  const {directory, dataFile, store} = await fixture();
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  await fs.writeFile(dataFile, 'broken json');
  await assert.rejects(store.loadGame('OI7K4X'), SyntaxError);
  assert.equal(await fs.readFile(dataFile, 'utf-8'), 'broken json');
});

test('retries IDs already saved or reserved by another creation request', async t => {
  const {directory, dataFile, defaultFile} = await fixture();
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  const saved = {data: JSON.parse(await fs.readFile(defaultFile, 'utf-8')), undoStack: []};
  await fs.writeFile(dataFile, JSON.stringify({'OI7K4X': saved}));
  const candidates = ['OI7K4X', 'BR8K2Q', 'BR8K2Q', 'CA9L3P'];
  const store = new GameStore(dataFile, defaultFile, () => {
    const id = candidates.shift();
    assert.ok(id, 'Unexpected additional ID allocation');
    return id;
  });
  assert.deepEqual(await Promise.all([store.createGame(), store.createGame()]), ['BR8K2Q', 'CA9L3P']);
  assert.equal(store.getGame('OI7K4X'), undefined);
  await store.loadGame('OI7K4X');
  assert.equal(store.getGame('  oi7k4x  '), store.getGame('OI7K4X'));
  const games = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
  assert.equal(Object.keys(games).length, 3);
  assert.deepEqual(games['OI7K4X'], saved);
});

test('server leaves saves unread until requested and loads only the supplied game ID', async t => {
  const {directory, dataFile, defaultFile, store} = await fixture();
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  // Starting the server must succeed without trying to parse the save file.
  await fs.writeFile(dataFile, 'not valid JSON');
  const {server, io} = createGameServer(store);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => io.close(() => resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api`;
  assert.equal((await fetch(`${base}/data`)).status, 404);
  assert.equal(store.getGame('OI7K4X'), undefined);

  const saved = {data: JSON.parse(await fs.readFile(defaultFile, 'utf-8')), undoStack: []};
  saved.data.regions.fraserview.team = 'RED';
  const saves = {'OI7K4X': saved, 'BR8K2Q': structuredClone(saved)};
  const raw = JSON.stringify(saves);
  await fs.writeFile(dataFile, raw);
  const response = await fetch(`${base}/games/oi7k4x/data`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).regions.find((r: {id: string}) => r.id === 'fraserview').team, 'RED');
  assert.ok(store.getGame('OI7K4X'));
  assert.equal(store.getGame('BR8K2Q'), undefined);
  assert.equal((await fetch(`${base}/games/ABSENT/data`)).status, 404);
  assert.equal(await fs.readFile(dataFile, 'utf-8'), raw);
  const [first, second] = await Promise.all([store.loadGame('OI7K4X'), store.loadGame('oi7k4x')]);
  assert.equal(first, second);

  const create = await fetch(`${base}/games`, {method: 'POST'});
  assert.equal(create.status, 201);
  assert.equal(store.getGame('BR8K2Q'), undefined);
  const afterCreate = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
  assert.equal(Object.keys(afterCreate).length, 3);
  assert.deepEqual(afterCreate['BR8K2Q'], saves['BR8K2Q']);
});

test('API creates games and scopes data, edits and resets to the requested game', async t => {
  const {directory, store} = await fixture();
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  const {server, io} = createGameServer(store);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => io.close(() => resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/games`;
  const create = async () => {
    const response = await fetch(base, {method: 'POST'});
    assert.equal(response.status, 201);
    return (await response.json()).id as string;
  };
  const first = await create();
  const second = await create();
  assert.match(first, /^[A-Z2-9]{6}$/);
  const friendlyInput = encodeURIComponent(`  ${first.toLowerCase()}  `);
  assert.equal((await fetch(`${base}/${friendlyInput}/data`)).status, 200);
  assert.equal((await fetch(`${base}/unknown/data`)).status, 404);
  assert.equal((await fetch(`${base}/unknown/reset`, {method: 'POST', headers: {'Reset-Key': 'bloodorange'}})).status, 404);
  assert.equal((await fetch(`${base}/${friendlyInput}/regions/fraserview/claim?team=RED`, {method: 'POST'})).status, 200);
  const read = async (id: string) => (await fetch(`${base}/${id}/data`)).json();
  assert.equal((await read(first)).regions.find((r: {id: string}) => r.id === 'fraserview').team, 'RED');
  assert.equal((await read(second)).regions.find((r: {id: string}) => r.id === 'fraserview').team, 'NONE');
  assert.equal((await fetch(`${base}/${first}/reset`, {method: 'POST', headers: {'Reset-Key': 'wrong'}})).status, 403);
  const otherBefore = await read(second);
  assert.equal((await fetch(`${base}/${first}/reset`, {method: 'POST', headers: {'Reset-Key': 'bloodorange'}})).status, 200);
  assert.deepEqual(await read(second), otherBefore);
  assert.equal((await read(first)).regions.find((r: {id: string}) => r.id === 'fraserview').team, 'NONE');
});
