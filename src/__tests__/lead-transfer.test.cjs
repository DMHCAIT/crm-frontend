const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(
  fs.readFileSync(path.join(__dirname, '..', 'lib', 'leadTransfer.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
).outputText, context);
const { buildTransferUpdate } = context.exports;

test('keep current stage omits status so mixed lead stages are preserved', () => {
  const update = buildTransferUpdate('Akash', '');
  assert.equal(update.assignedTo, 'Akash');
  assert.equal(Object.hasOwn(update, 'status'), false);
});

test('chosen stage is included with the assignment in a single update', () => {
  for (const status of ['Fresh', 'Follow Up', 'Warm', 'Hot', 'Enrolled',
    'Will Enroll Later', 'Not Answering', 'Not Interested', 'Junk']) {
    const update = buildTransferUpdate('Akash', status);
    assert.equal(update.assignedTo, 'Akash');
    assert.equal(update.status, status);
  }
});
