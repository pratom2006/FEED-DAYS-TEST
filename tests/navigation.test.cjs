'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const files = ['config', 'input', 'town', 'navigation', 'game'].map(n => `scripts/${n}.js`);
const context = vm.createContext({window:{}});
for (const p of [files[0], files[2], files[3]]) new vm.Script(read(p), {filename:p}).runInContext(context);
const q = context.window.FEED_DAYS_QA;
const spawn = {x:1024,y:1800};
test('classic scripts parse and load in original dependency order', () => {
  let last = -1;
  const html = read('game.html');
  for (const p of files) {
    new vm.Script(read(p), {filename:p});
    const position = html.indexOf(`src="${p}"`);
    assert.ok(position > last); last = position;
  }
  assert.ok(html.includes('styles/game.css'));
});
test('original sprites are PNG files', () => {
  for (const name of ['male','female']) {
    const data = fs.readFileSync(path.join(root,'assets','characters',name+'.png'));
    assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  }
});
test('spawn and collision geometry', () => {
  assert.ok(q.walkable(spawn.x,spawn.y));
  for (const [x,y] of [[1024,1024],[100,100],[590,575],[-1,1024]]) assert.equal(q.walkable(x,y),false);
  assert.equal(q.route(spawn,{x:1024,y:1024}),null);
});
for (const [name,goal] of [['north',{x:1024,y:165}],['south',{x:1024,y:1880}],['east',{x:1895,y:1024}],['west',{x:155,y:1024}]]) {
  test('walkable route to '+name+' exit', () => {
    const route=q.route(spawn,goal);
    assert.ok(route && route.length);
    assert.equal(route.at(-1).x,goal.x); assert.equal(route.at(-1).y,goal.y);
    route.forEach((p,i)=>assert.ok(q.visible(i?route[i-1]:spawn,p)));
  });
}
