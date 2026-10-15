const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
function load(file, mocks = {}, globals = {}) {
  const context = { exports: {}, Error, ...globals, require: name => name in mocks ? mocks[name] : require(name) };
  const source = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  vm.runInNewContext(source, context);
  return context.exports;
}
const helpers = load('lib\\leadDuplicates.ts');
const autosave = load('lib\\leadAutosave.ts', { './leadDuplicates': helpers });
const { LeadAutosave } = autosave;
const lead = {
  id: 'one', fullName: 'Original', email: '', phone: '9876543210', status: 'Fresh',
  company: 'DMHCA', notes: [{ content: 'Existing note' }], followUp: '', scheduledCallAt: null
};
const tick = () => new Promise(resolve => setImmediate(resolve));

test('opening a legacy lead does not write; changes only save on commit with a minimal patch', async () => {
  const calls = [];
  const form = new LeadAutosave('one', lead, async (id, patch) => calls.push({ id, patch }), () => {});
  assert.equal(await form.commit(), true);
  assert.equal(calls.length, 0);
  form.update(previous => ({ ...previous, fullName: 'Updated' }));
  assert.equal(form.dirty, true);
  assert.equal(calls.length, 0, 'typing alone does not write');
  assert.equal(await form.commit(), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].id, 'one');
  assert.deepEqual(Object.keys(calls[0].patch), ['fullName']);
  assert.equal(calls[0].patch.fullName, 'Updated');
  assert.equal(form.dirty, false);
  assert.equal(form.savedOnce, true);
});

test('queued saves are ordered, preserve typing during requests, and never resend stale notes or fields', async () => {
  const calls = [];
  const releases = [];
  const form = new LeadAutosave('one', lead, (id, patch) => {
    calls.push({ id, patch });
    return new Promise(resolve => releases.push(resolve));
  }, () => {});
  form.update(previous => ({ ...previous, fullName: 'First' }));
  const first = form.commit();
  await tick();
  form.update(previous => ({ ...previous, fullName: 'Latest', status: 'Hot' }));
  const second = form.commit();
  await tick();
  assert.equal(calls.length, 1);
  releases.shift()();
  await first;
  await tick();
  assert.equal(calls.length, 2);
  assert.equal(calls[1].patch.fullName, 'Latest');
  assert.equal(calls[1].patch.status, 'Hot');
  assert.equal(calls[1].patch.notes, undefined);
  assert.equal(calls[1].patch.phone, undefined);
  assert.equal(form.draft.fullName, 'Latest');
  releases.shift()();
  assert.equal(await second, true);
  assert.equal(form.pending, 0);
  assert.equal(form.dirty, false);
});

test('failed saves retain edits, expose an error and retry the same lead, without success-shaped fallback', async () => {
  let failing = true;
  const calls = [];
  const form = new LeadAutosave('one', lead, async (id, patch) => {
    calls.push({ id, patch });
    if (failing) throw new Error('Duplicate phone already in CRM');
  }, () => {});
  form.update(previous => ({ ...previous, phone: '+91 9876543210' }));
  assert.equal(await form.commit(), false);
  assert.match(form.error, /Duplicate phone/);
  assert.equal(form.draft.phone, '+91 9876543210');
  assert.equal(form.dirty, true);
  assert.equal(form.pending, 0);
  failing = false;
  assert.equal(await form.commit(), true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].id, 'one');
  assert.equal(form.error, null);
});

test('invalid changed contacts and revenue never write; legacy unchanged contacts do not block other edits', async () => {
  for (const patch of [{ fullName: '' }, { email: 'bad' }, { email: '' }, { phone: '1234567890' },
    { estimatedValue: -1 }, { salePrice: NaN }]) {
    let writes = 0;
    const baseline = { ...lead, email: 'original@example.invalid' };
    const form = new LeadAutosave('one', baseline, async () => { writes++; }, () => {});
    form.update(previous => ({ ...previous, ...patch }));
    assert.equal(await form.commit(), false, JSON.stringify(patch));
    assert.ok(form.error);
    assert.equal(writes, 0);
  }
});

test('zero values, clearing optional fields and schedule changes persist, but no-op blurs do not write', async () => {
  const calls = [];
  const form = new LeadAutosave('one', { ...lead, branch: 'Hyderabad', estimatedValue: 100 },
    async (id, patch) => calls.push({ id, patch }), () => {});
  form.update(previous => ({ ...previous, branch: '', estimatedValue: 0, scheduledCallAt: '2099-01-01T00:00:00.000Z' }));
  assert.equal(await form.commit(), true);
  assert.equal(calls[0].patch.branch, '');
  assert.equal(calls[0].patch.estimatedValue, 0);
  assert.equal(calls[0].patch.scheduledCallAt, '2099-01-01T00:00:00.000Z');
  await form.commit();
  assert.equal(calls.length, 1);
  form.update(previous => ({ ...previous, scheduledCallAt: null }));
  await form.commit();
  assert.equal(calls[1].patch.scheduledCallAt, null);
});

test('an in-flight save retains its own lead ID when another lead has a separate draft', async () => {
  const writes = [];
  let finish;
  const first = new LeadAutosave('one', lead, (id, patch) => new Promise(resolve => {
    finish = () => { writes.push({ id, patch }); resolve(); };
  }), () => {});
  first.update(previous => ({ ...previous, fullName: 'First lead edited' }));
  const pending = first.commit();
  await tick();
  const second = new LeadAutosave('two', { ...lead, id: 'two' }, async (id, patch) => writes.push({ id, patch }), () => {});
  second.update(previous => ({ ...previous, status: 'Warm' }));
  await second.commit();
  finish();
  await pending;
  assert.equal(writes[0].id, 'two');
  assert.equal(writes[1].id, 'one');
});

test('detail form renders immediately editable fields and save guidance without a Save button', () => {
  const Form = load('components\\AutoSaveLeadForm.tsx', { '../lib/leadAutosave': autosave }).default;
  const html = renderToStaticMarkup(React.createElement(Form, {
    lead, save: async () => {}, register() {},
    children: ({ editedLead, editingLead }) => React.createElement('input', {
      value: editedLead.fullName, 'data-editing': editingLead, onChange() {}
    })
  }));
  assert.match(html, /value="Original"/);
  assert.match(html, /data-editing="one"/);
  assert.match(html, /Changes save when you leave a field/);
  assert.doesNotMatch(html, /Save Changes/);
});

test('detail form blur/change wiring autosaves, and close/switch paths flush before leaving', () => {
  const form = read('components\\AutoSaveLeadForm.tsx');
  assert.match(form, /onBlur=/);
  assert.match(form, /HTMLSelectElement/);
  assert.match(form, /'datetime-local'/);
  assert.match(form, /beforeunload/);
  assert.match(form, /Not saved:/);
  assert.match(form, />Retry<\/button>/);
  const source = read('components\\LeadsManagement.tsx');
  assert.match(source, /await detailAutosaveRef.current\(\)/);
  assert.match(source, /key=\{selectedLead.id\}[\s\S]*register=\{registerDetailAutosave\}/);
  const details = source.slice(source.indexOf('<AutoSaveLeadForm'), source.indexOf('</AutoSaveLeadForm>'));
  assert.doesNotMatch(details, /Save Changes|phone: phoneCode/);
  assert.match(details, /<ScheduledCallField\s+autoSave/);
});

test('actual form event handlers save text on blur, selects/dates immediately, and register a guarded flush', async () => {
  let controller;
  const effects = [];
  let flush;
  const writes = [];
  class Input { constructor(type = 'text') { this.type = type; } }
  class Select { constructor(value) { this.value = value; } }
  const listeners = new Map();
  const Form = load('components\\AutoSaveLeadForm.tsx', {
    '../lib/leadAutosave': autosave,
    react: {
      useState(initial) {
        const value = typeof initial === 'function' ? initial() : initial;
        if (value instanceof LeadAutosave) controller = value;
        return [value, () => {}];
      },
      useRef(value) { return { current: value }; },
      useEffect(effect) { effects.push(effect); }
    }
  }, {
    HTMLInputElement: Input, HTMLSelectElement: Select,
    window: {
      addEventListener(name, fn) { listeners.set(name, fn); },
      removeEventListener(name) { listeners.delete(name); }
    }
  }).default;
  const tree = Form({
    lead, save: async (id, patch) => writes.push({ id, patch }),
    register(fn) { flush = fn; }, children: () => null
  });
  const cleanup = effects[0]();
  const handlers = tree.props.children[1].props;
  controller.update(previous => ({ ...previous, fullName: 'Typing' }));
  handlers.onChange({ target: new Input() });
  await tick();
  assert.equal(writes.length, 0);
  handlers.onBlur({ target: new Input() });
  await tick();
  assert.equal(writes[0].patch.fullName, 'Typing');
  controller.update(previous => ({ ...previous, status: 'Hot' }));
  handlers.onChange({ target: new Select('Hot') });
  await tick();
  assert.equal(writes[1].patch.status, 'Hot');
  controller.update(previous => ({ ...previous, followUp: '2099-01-01T12:00' }));
  handlers.onChange({ target: new Input('datetime-local') });
  await tick();
  assert.equal(writes[2].patch.followUp, '2099-01-01T12:00');
  controller.update(previous => ({ ...previous, source: '' }));
  handlers.onChange({ target: new Select('__custom__') });
  await tick();
  assert.equal(writes.length, 3, 'opening custom-source input must not clear stored source');
  controller.update(previous => ({ ...previous, source: 'Custom Source' }));
  assert.equal(await flush(), true);
  assert.equal(writes[3].patch.source, 'Custom Source');
  controller.update(previous => ({ ...previous, email: 'bad' }));
  assert.equal(await flush(), false, 'invalid edit must prevent panel close or lead switch');
  let prevented = false;
  listeners.get('beforeunload')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  cleanup();
  assert.equal(flush, null);
  assert.equal(listeners.size, 0);
});
