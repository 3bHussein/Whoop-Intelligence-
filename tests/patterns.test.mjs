import {test} from 'node:test';import assert from 'node:assert/strict';import {groupFinding,patternCopy} from '../assets/patterns.js';
const r={pairs:Array.from({length:9},(_,i)=>({x:i+4,y:40+i*5,day:'2026-10-'+(10+i)}))};
test('group comparison reports actual medians and excludes median ties',()=>{const f=groupFinding(r);assert.equal(f.eligible,true);assert.equal(f.high.count,4);assert.equal(f.low.count,4);assert.equal(f.tied,1);assert.equal(f.high.y,72.5);assert.equal(f.low.y,47.5);assert.equal(f.difference,25)});
test('seven matched days do not imply enough separated observations',()=>{assert.equal(groupFinding({pairs:[1,1,1,1,2,3,4].map(x=>({x,y:x}))}).eligible,false)});
test('constant, missing and sparse values cannot create a finding',()=>{for(const pairs of [[],[{x:1,y:3}],Array(10).fill({x:1,y:2}),[{x:null,y:5},...r.pairs.slice(0,5)]])assert.equal(groupFinding({pairs}).eligible,false)});
test('negative and flat observed differences stay descriptive',()=>{assert.equal(groupFinding({pairs:r.pairs.map(p=>({...p,y:-p.y}))}).difference,-25);assert.equal(groupFinding({pairs:r.pairs.map(p=>({...p,y:50}))}).difference,0)});
test('sensitivity flag retained and all explanatory labels bilingual',()=>{assert.equal(groupFinding({...r,sensitive:true}).sensitive,true);assert.deepEqual(Object.keys(patternCopy.ar).sort(),Object.keys(patternCopy.en).sort())});
