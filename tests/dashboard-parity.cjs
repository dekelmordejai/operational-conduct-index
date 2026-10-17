'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const A = require('../dashboard/analytics.js');
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

function close(actual, expected, label) {
  if (typeof expected === 'number') assert.ok(Math.abs(actual-expected) < 1e-10, `${label}: ${actual} != ${expected}`);
  else if (expected && !Array.isArray(expected) && typeof expected === 'object') {
    for (const [key,value] of Object.entries(expected)) close(actual[key],value,label+'.'+key);
  } else assert.deepEqual(actual,expected,label);
}
cases.forEach(({payload,filters,expected},index)=>{
  const {summary,events,exposure} = A.summarize(payload,filters);
  for (const key of ['points','km','rates_per_100k_km','scaled','ico_risk','quality_issues','reference_exceeded']) close(summary[key],expected[key],`case ${index} ${key}`);
  for (const mode of ['month','week']) {
    const buckets=A.timeBuckets(payload,{events,exposure},filters.start,filters.end,mode);
    close(buckets.reduce((sum,b)=>sum+b.km,0),summary.km,'bucket exposure conservation');
    assert.equal(buckets.reduce((sum,b)=>sum+b.observed,0),summary.observed,'bucket event conservation');
    assert.equal(buckets[0].start,filters.start);
    assert.equal(buckets.at(-1).end,filters.end);
    for(let i=1;i<buckets.length;i++) {
      const next=new Date(buckets[i-1].end+'T00:00:00Z');next.setUTCDate(next.getUTCDate()+1);
      assert.equal(buckets[i].start,next.toISOString().slice(0,10),'buckets must be contiguous');
    }
  }
});
const {payload}=cases[0];
assert.equal(A.previousPeriod(payload,{start:'2025-01-01',end:'2025-12-31'}),null);
assert.equal(A.previousPeriod(payload,{start:'2025-04-01',end:'2025-06-30'}),null); // 91 days would start before coverage.
assert.notEqual(A.previousPeriod(payload,{start:'2025-07-01',end:'2025-09-30'}),null);
assert.throws(()=>A.summarize(payload,{start:'2025-06-30',end:'2025-04-01'}));
const regular=A.summarize(payload,{start:'2025-01-01',end:'2025-12-31'});
assert.equal(regular.summary.consolidated,regular.summary.retries+regular.summary.linked);
assert.equal(A.groups(payload,regular,'company','2025-01-01','2025-12-31').reduce((sum,g)=>sum+g.eligible,0),regular.summary.eligible);
console.log(`${cases.length} Python/JavaScript parity scenarios passed; temporal conservation and prior-period checks passed.`);
