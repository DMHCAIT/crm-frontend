const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const context = { exports: {} };
vm.runInNewContext(transpile(read('lib\\leadPagination.ts')), context);
const { fetchAllLeadPages, toggleAllLeadSelection, areAllLeadsSelected } = context.exports;
const leads = count => Array.from({ length: count }, (_, i) => ({ id: `lead-${i}`, status: 'Hot' }));

function client(request) {
  const ast = ts.createSourceFile('backend.ts', read('lib\\backend.ts'), ts.ScriptTarget.Latest, true);
  let method;
  function visit(node) {
    if (!method && ts.isMethodDeclaration(node) && node.name.getText(ast) === 'getLeads') method = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(method);
  const scope = { exports: {}, request, fetchAllLeadPages, URLSearchParams, console: { log() {}, error() {} } };
  vm.runInNewContext(transpile(`class Client { request = request; ${method} } exports.client = new Client();`), scope);
  return scope.exports.client;
}

test('All loads and selects every filtered lead beyond page and database limits', async () => {
  for (const count of [0, 50, 166, 500, 1205, 2501]) {
    const rows = leads(count);
    const calls = [];
    const api = client(async endpoint => {
      const url = new URL(endpoint, 'https://crm.invalid');
      assert.equal(url.pathname, '/api/leads');
      assert.equal(url.searchParams.get('status'), 'Hot');
      assert.equal(url.searchParams.get('assignedTo'), 'member');
      assert.equal(url.searchParams.get('search'), 'test');
      const page = Number(url.searchParams.get('page'));
      const size = Number(url.searchParams.get('pageSize'));
      calls.push({ page, size });
      return { success: true, leads: rows.slice((page - 1) * size, page * size), total: count };
    });
    const result = await api.getLeads(1, 'all', { status: ['Hot'], assignedTo: ['member'], search: 'test' });
    assert.equal(result.leads.length, count);
    assert.equal(result.total, count);
    assert.equal(calls.length, Math.max(1, Math.ceil(count / 500)));
    assert.ok(calls.every(call => call.size === 500));
    const selected = toggleAllLeadSelection(result.leads, []);
    assert.equal(selected.length, count);
    assert.equal(areAllLeadsSelected(result.leads, selected), count > 0);
    assert.equal(toggleAllLeadSelection(result.leads, selected).length, 0);
  }
});

test('50 uses a single page and select-all selects only those 50 leads', async () => {
  const rows = leads(166);
  let requests = 0;
  const api = client(async endpoint => {
    requests++;
    const params = new URL(endpoint, 'https://crm.invalid').searchParams;
    assert.equal(params.get('page'), '2');
    assert.equal(params.get('pageSize'), '50');
    return { success: true, leads: rows.slice(50, 100), total: 166 };
  });
  const response = await api.getLeads(2, 50, { status: ['Hot'] });
  const selected = toggleAllLeadSelection(response.leads, []);
  assert.equal(requests, 1);
  assert.equal(selected.length, 50);
  assert.equal(selected[0], 'lead-50');
  assert.equal(selected[49], 'lead-99');
});

test('select-all compares IDs rather than mistaking equal selection counts for matching rows', () => {
  const rows = leads(50);
  const wrongSelection = leads(50).map((_, i) => `other-${i}`);
  assert.equal(areAllLeadsSelected(rows, wrongSelection), false);
  assert.equal(toggleAllLeadSelection(rows, wrongSelection)[0], 'lead-0');
});

test('failed all/filtered requests do not fall back to unrelated unfiltered leads', async () => {
  for (const size of ['all', 50]) {
    const endpoints = [];
    const api = client(async endpoint => {
      endpoints.push(endpoint);
      throw new Error('Database unavailable');
    });
    await assert.rejects(() => api.getLeads(1, size, { status: ['Hot'] }), /Database unavailable/);
    assert.equal(endpoints.length, 1);
    assert.ok(endpoints.every(endpoint => !endpoint.includes('leads-simple')));
  }
});

test('incomplete, overlapping, changing and malformed pages fail instead of returning partial All results', async () => {
  for (const pages of [
    [{ success: true, leads: leads(500), total: 1205 }, { success: true, leads: [], total: 1205 }],
    [{ success: true, leads: leads(500), total: 1000 }, { success: true, leads: leads(500), total: 1000 }],
    [{ success: true, leads: leads(500), total: 1000 }, { success: true, leads: [], total: 999 }],
    [{ success: false, leads: [], total: 0 }],
    [{ success: true, leads: [], total: null }],
    [{ success: true, leads: [], total: '0' }],
    [{ success: true, leads: [{ id: '' }], total: 1 }]
  ]) {
    let index = 0;
    await assert.rejects(() => fetchAllLeadPages(async () => pages[index++]));
  }
});

test('lead UI defaults to 50, retains All, resets scoped selections, and blocks selection during loading/errors', () => {
  const source = read('components\\LeadsManagement.tsx');
  assert.match(source, /useState<LeadPageSize>\(50\)/);
  assert.match(source, /<option value="all">All<\/option>/);
  assert.match(source, /\[currentPage, itemsPerPage, filterParams, user\?\.id\]/);
  assert.match(source, /if \(loadingLeads \|\| leadsError\) return/);
  assert.match(source, /toggleAllLeadSelection\(filteredLeads, previous\)/);
  assert.match(source, /itemsPerPage === 'all' \? 1 : Math.max/);
  assert.match(source, /role="alert"/);
});
