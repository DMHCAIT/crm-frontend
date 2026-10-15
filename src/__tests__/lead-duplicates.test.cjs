const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
}).outputText;
function load(file, mocks = {}) {
  const context = { exports: {}, require: name => name in mocks ? mocks[name] : require(name) };
  vm.runInNewContext(transpile(read(file)), context);
  return context.exports;
}
const helpers = load('lib\\leadDuplicates.ts');

function hookHarness(api) {
  const state = [];
  const effects = [];
  const timers = new Map();
  let index = 0;
  let effectIndex = 0;
  let timerId = 0;
  const context = {
    exports: {},
    Error,
    setTimeout(fn, delay) { assert.equal(delay, 350); timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    require(name) {
      if (name === 'react') return {
        useState(initial) {
          const current = index++;
          if (!(current in state)) state[current] = initial;
          return [state[current], value => { state[current] = typeof value === 'function' ? value(state[current]) : value; }];
        },
        useEffect(fn, deps) {
          const current = effectIndex++;
          const old = effects[current];
          if (!old || deps.some((dep, i) => dep !== old.deps[i])) {
            old?.cleanup?.();
            effects[current] = { deps, cleanup: fn() };
          }
        }
      };
      if (name === '../lib/backend') return { getApiClient: () => api };
      if (name === '../lib/leadDuplicates') return helpers;
      throw new Error(`Unexpected dependency ${name}`);
    }
  };
  vm.runInNewContext(transpile(read('hooks\\useLeadDuplicateCheck.ts')), context);
  return {
    render(email, phone, enabled = true, userId = 'member') {
      index = 0; effectIndex = 0;
      return context.exports.useLeadDuplicateCheck(email, phone, enabled, userId);
    },
    fire() {
      const entry = timers.entries().next().value;
      assert.ok(entry, 'debounced check is scheduled');
      timers.delete(entry[0]);
      return entry[1]();
    },
    timers
  };
}

test('live checks debounce valid email OR phone and never search empty/partial input', async () => {
  const calls = [];
  const hook = hookHarness({ checkLeadDuplicates: async (...contacts) => { calls.push(contacts); return []; } });
  assert.equal(hook.render('', '').checking, false);
  assert.equal(hook.render('partial', '+91').checking, false);
  assert.equal(hook.timers.size, 0);
  assert.equal(hook.render('person@example.invalid', '').checking, true);
  assert.equal(calls.length, 0);
  assert.equal(hook.timers.size, 1);
  await hook.fire();
  assert.equal(hook.render('person@example.invalid', '').checking, false);
  assert.equal(calls.length, 1);
  hook.render('', '1234567890');
  await hook.fire();
  assert.deepEqual(calls[1], ['', '1234567890']);
});

test('stale responses cannot replace current contacts or a different login', async () => {
  const pending = [];
  const hook = hookHarness({ checkLeadDuplicates: () => new Promise(resolve => pending.push(resolve)) });
  hook.render('old@example.invalid', '');
  const oldRequest = hook.fire();
  hook.render('new@example.invalid', '');
  const newRequest = hook.fire();
  pending[0]([{ canView: false, assignedTo: 'old-owner', matchedBy: ['email'] }]);
  await oldRequest;
  assert.equal(hook.render('new@example.invalid', '').checking, true);
  pending[1]([]);
  await newRequest;
  assert.equal(hook.render('new@example.invalid', '').checking, false);
  assert.equal(hook.render('new@example.invalid', '', true, 'other-user').checking, true);
});

test('failed checks expose an error and retry rather than silently permitting unchecked creation', async () => {
  let failed = true;
  const hook = hookHarness({ checkLeadDuplicates: async () => {
    if (failed) throw new Error('Database unavailable');
    return [];
  } });
  hook.render('person@example.invalid', '');
  await hook.fire();
  const error = hook.render('person@example.invalid', '');
  assert.match(error.error, /Database unavailable/);
  error.retry();
  failed = false;
  assert.equal(hook.render('person@example.invalid', '').checking, true);
  await hook.fire();
  assert.equal(hook.render('person@example.invalid', '').error, null);
});

test('duplicate UI provides View lead only for accessible records and ownership only outside the bucket', () => {
  const Notice = load('components\\DuplicateLeadNotice.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Notice, {
    duplicates: [
      { canView: true, assignedTo: 'member', matchedBy: ['phone'], lead: { id: 'own' } },
      { canView: false, assignedTo: 'outside', matchedBy: ['email'] }
    ],
    onView() {}
  }));
  assert.equal((html.match(/View lead/g) || []).length, 1);
  assert.match(html, /Assigned to: .*outside/);
  assert.match(html, /Outside your bucket/);
  assert.match(html, /cannot be added again/);
  const failure = renderToStaticMarkup(React.createElement(Notice, {
    duplicates: [], error: 'Network unavailable', onRetry() {}, onView() {}
  }));
  assert.match(failure, /Saving is blocked/);
  assert.match(failure, /Retry check/);
});

function declaration(file, name) {
  const source = read(file);
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let result;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) result = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(result, name);
  return result;
}

test('single creation requires email and checks server-wide duplicates before writing', async () => {
  const handler = declaration('components\\LeadsManagement.tsx', 'handleSaveNewLead');
  for (const email of ['', 'new@example.invalid']) {
    let checked = 0;
    let created = 0;
    const matches = [{ canView: false, assignedTo: 'outside', matchedBy: ['phone'] }];
    const context = {
      exports: {}, console: { log() {}, error() {} }, alert() {},
      newLead: { fullName: 'New', email, phone: '+911234567890', company: 'DMHCA' },
      isInternationalPhone: helpers.isInternationalPhone,
      user: { username: 'member' }, savingNewLead: false,
      setSavingNewLead() {}, setSaveDuplicates(value) { assert.equal(value, matches); },
      getApiClient: () => ({
        checkLeadDuplicates: async () => { checked++; return matches; },
        createLead: async () => { created++; }
      }),
      notify: { error() {} }
    };
    vm.runInNewContext(transpile(`const ${handler}; exports.save = handleSaveNewLead;`), context);
    await context.exports.save();
    assert.equal(created, 0);
    assert.equal(checked, email ? 1 : 0);
  }
});

test('international phone helper requires +country code and 7 to 15 digits', () => {
  for (const phone of ['+91 9876543210', '+1 (202) 555-0123', ' +44 20 7946 0958 ', '+1234567', '+123456789012345']) {
    assert.equal(helpers.isInternationalPhone(phone), true, phone);
  }
  for (const phone of ['', '9876543210', '00919876543210', '+0919876543210', '++919876543210',
    '+91', '+123456', '+1234567890123456', '+91 abcdefghij', '91+9876543210']) {
    assert.equal(helpers.isInternationalPhone(phone), false, phone);
  }
});

test('single form blocks missing country code before API calls and explains the required format', async () => {
  const handler = declaration('components\\LeadsManagement.tsx', 'handleSaveNewLead');
  for (const phone of ['9876543210', '00919876543210', '+91']) {
    const alerts = [];
    const context = {
      exports: {}, console: { log() {}, error() {} }, alert(message) { alerts.push(message); },
      newLead: { fullName: 'New', email: 'new@example.invalid', phone, company: 'DMHCA' },
      user: { username: 'member' }, isInternationalPhone: helpers.isInternationalPhone,
      setSavingNewLead() {},
      getApiClient() { assert.fail('Invalid phone must not reach the API'); },
      notify: { error() { assert.fail('Validation should show a specific message'); } }
    };
    vm.runInNewContext(transpile(`const ${handler}; exports.save = handleSaveNewLead;`), context);
    await context.exports.save();
    assert.equal(alerts.length, 1);
    assert.match(alerts[0], /\+country code/);
  }
  const source = read('components\\LeadsManagement.tsx');
  assert.match(source, /Phone with country code/);
  assert.match(source, /placeholder="\+91 9876543210"/);
});

test('import confirmation sends only reviewed new leads with explicit assignee and status', async () => {
  const handler = declaration('components\\LeadsManagement.tsx', 'confirmLeadImport');
  const accepted = [{ fullName: 'New', email: 'new@example.invalid', phone: '1234567890' }];
  for (const selected of [false, true]) {
    const calls = [];
    const context = {
      exports: {}, importReview: { accepted, duplicates: [{ rowNumber: 3 }], invalid: [] },
      importLoading: false, importAssignee: selected ? 'member' : '', importStatus: selected ? 'Hot' : '',
      notify: { error() {}, success() {} }, setImportLoading() {}, setImportReview() {},
      loadLeads: async () => {}, refetchBucketStats: async () => {}, setDateFilter() {}, setStatusFilter() {},
      getApiClient: () => ({ importLeads: async (...args) => {
        calls.push(args);
        return { success: true, results: { success: 1, duplicates: 0, failed: 0, errors: [] } };
      } })
    };
    vm.runInNewContext(transpile(`const ${handler}; exports.confirm = confirmLeadImport;`), context);
    await context.exports.confirm();
    assert.equal(calls.length, selected ? 1 : 0);
    if (selected) {
      assert.equal(calls[0][0], accepted);
      assert.equal(calls[0][1], 'member');
      assert.equal(calls[0][2], 'Hot');
    }
  }
});

test('CSV imports preserve mobile strings, escaped quotes and multiline fields; Excel uses the same parser', () => {
  const { readLeadImportRows } = load('lib\\leadImport.ts');
  const csv = 'Full Name,Email,Phone,Notes\r\n"Name, One",one@example.invalid,001234567890,"Said ""hello""\nNext line"\r\n';
  const rows = readLeadImportRows(new TextEncoder().encode(csv).buffer);
  assert.equal(rows.length, 2);
  assert.equal(rows[1][0], 'Name, One');
  assert.equal(rows[1][2], '001234567890');
  assert.equal(rows[1][3], 'Said "hello"\nNext line');
  const xlsx = require('xlsx');
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet([
    ['Full Name', 'Email', 'Phone'], ['Excel Lead', 'excel@example.invalid', '+91 98765 43210']
  ]), 'Leads');
  const excelRows = readLeadImportRows(xlsx.write(workbook, { type: 'array', bookType: 'xlsx' }));
  assert.equal(excelRows[1][2], '+91 98765 43210');
});
