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
const stats = {
  total: 59874, totalLeads: 59874, hot: 1501, warm: 2402, fresh: 3003,
  followup: 4504, converted: 505, thisMonth: 6006, updatedToday: 707,
  updatedYesterday: 808, updatedThisWeek: 9009, updatedThisMonth: 10010,
  recentlyImported: 1111, createdToday: 1212, createdYesterday: 1313,
  createdThisWeek: 1414, createdLastMonth: 1515, overdueFollowUps: 1616
};
const getters = {
  getHotLeadsCount: 'hot',
  getWarmLeadsCount: 'warm',
  getFollowUpLeadsCount: 'followup',
  getFreshLeadsCount: 'fresh',
  getAllLeadsCount: 'total',
  getLeadsUpdatedTodayCount: 'updatedToday',
  getUpdatedYesterdayCount: 'updatedYesterday',
  getUpdatedThisWeekCount: 'updatedThisWeek',
  getUpdatedThisMonthCount: 'updatedThisMonth',
  getRecentlyImportedCount: 'recentlyImported',
  getCreatedTodayCount: 'createdToday',
  getCreatedYesterdayCount: 'createdYesterday',
  getCreatedThisWeekCount: 'createdThisWeek',
  getCreatedThisMonthCount: 'thisMonth',
  getCreatedLastMonthCount: 'createdLastMonth'
};

function counterFunctions(bucketStats, pageLeads) {
  const source = read('components\\LeadsManagement.tsx');
  const ast = ts.createSourceFile('LeadsManagement.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && [...Object.keys(getters), 'calculateStats'].includes(node.name.getText(ast))) {
      declarations.push(`const ${node.getText(ast)};`);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(declarations.length, Object.keys(getters).length + 1);
  const context = { bucketStats, leads: pageLeads, exports: {} };
  vm.runInNewContext(transpile(`${declarations.join('\n')}\nexports.counters = { ${Object.keys(getters).join(',')}, calculateStats };`), context);
  return context.exports.counters;
}

test('every card and status/date badge reads overall totals, regardless of page contents', () => {
  for (const page of [[], [{ status: 'Hot' }], Array.from({ length: 50 }, () => ({ status: 'Fresh' }))]) {
    const counters = counterFunctions(stats, page);
    for (const [getter, key] of Object.entries(getters)) assert.equal(counters[getter](), stats[key], getter);
    for (const key of ['total', 'hot', 'warm', 'followup', 'converted', 'thisMonth']) {
      assert.equal(counters.calculateStats()[key], stats[key]);
    }
  }
});

test('real zeros stay zero and missing totals are not disguised as page counts', () => {
  const zeros = Object.fromEntries(Object.keys(stats).map(key => [key, 0]));
  const counters = counterFunctions(zeros, [{ status: 'Hot' }]);
  const missing = counterFunctions(undefined, [{ status: 'Hot' }]);
  for (const getter of Object.keys(getters)) {
    assert.equal(counters[getter](), 0);
    assert.equal(missing[getter](), '-');
  }
  assert.equal(missing.calculateStats().total, '-');
});

function hooks() {
  const mutations = [];
  const invalidations = [];
  const context = {
    exports: {},
    window: { dispatchEvent() {} },
    Event: class {},
    require(name) {
      if (name === '@tanstack/react-query') return {
        useQuery: options => options,
        useMutation: options => { mutations.push(options); return options; },
        useQueryClient: () => ({
          invalidateQueries: options => invalidations.push(options),
          getQueryCache: () => ({ findAll: () => [] }),
          setQueryData() {},
          setQueriesData() {}
        })
      };
      if (name === '../lib/backend') return { getApiClient: () => ({ getLeadBucketStats: async () => stats }) };
      if (name === '../lib/leadEvents') return { LEADS_CHANGED_EVENT: 'leads-changed' };
      throw new Error(`Unexpected dependency ${name}`);
    }
  };
  vm.runInNewContext(transpile(read('hooks\\useQueries.ts').replaceAll('import.meta.env', '{}')), context);
  return { api: context.exports, mutations, invalidations };
}

test('stats queries are user-scoped, page-independent and periodically refreshed', async () => {
  const { api } = hooks();
  const query = api.useLeadBucketStats('counselor-1', 'counselor');
  assert.deepEqual(Array.from(query.queryKey), ['dashboard', 'leadBuckets', 'counselor-1', 'counselor']);
  assert.equal(query.enabled, true);
  assert.equal(api.useLeadBucketStats().enabled, false);
  assert.equal(query.refetchInterval, 60000);
  assert.equal(await query.queryFn(), stats);
  assert.notDeepEqual(Array.from(api.useLeadBucketStats('counselor-2', 'counselor').queryKey), Array.from(query.queryKey));
});

test('create, edit, bulk update/transfer, delete and notes invalidate bucket statistics', () => {
  for (const hook of ['useCreateLead', 'useUpdateLead', 'useBulkUpdateLeads', 'useBulkDeleteLeads', 'useAddNote']) {
    const { api, invalidations } = hooks();
    api[hook]().onSuccess({}, { id: 'lead-1', data: {}, leadId: 'lead-1' });
    assert.ok(invalidations.some(options => options.queryKey[0] === 'dashboard'), hook);
  }
});

function statsClient(response) {
  const source = read('lib\\backend.ts');
  const ast = ts.createSourceFile('backend.ts', source, ts.ScriptTarget.Latest, true);
  let method;
  function visit(node) {
    if (ts.isMethodDeclaration(node) && node.name.getText(ast) === 'getLeadBucketStats') method = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(method);
  const context = {
    exports: {},
    request: async endpoint => {
      assert.equal(endpoint, '/api/leads/stats');
      return response;
    }
  };
  vm.runInNewContext(transpile(`class Client {
    request = request;
    ${method}
  }
  exports.client = new Client();`), context);
  return context.exports.client;
}

test('API client accepts exact totals and rejects incomplete/error responses rather than returning zero', async () => {
  assert.equal(await statsClient({ success: true, stats }).getLeadBucketStats(), stats);
  for (const response of [
    { success: false, error: 'Database unavailable' },
    { success: true },
    { success: true, stats: { total: 50 } },
    { success: true, stats: { ...stats, hot: null } },
    { success: true, stats: { ...stats, hot: -1 } },
    { success: true, stats: { ...stats, hot: '50' } }
  ]) {
    await assert.rejects(() => statsClient(response).getLeadBucketStats());
  }
});
