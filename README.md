# CRM frontend

Use Node.js 22 LTS and install the locked dependencies with `npm ci`.

## Validation

```sh
npm run typecheck
npm test
npm run build
```

The production build checks both application and Vite configuration types before
generating `dist`. `npm test` runs the Node lead regressions and the Vitest DOM/API
tests. Unit tests use mocked services and do not need production credentials.

## Deployment

Deploy this repository as a Vite frontend (for example, using the included Vercel
configuration). Set these build-time environment variables on the hosting platform:

- `VITE_API_BASE_URL`: public backend origin
- `VITE_API_BACKEND_URL`: public backend origin
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase **anon/public** key, never a service-role key

Keep private credentials out of `VITE_` variables: those values are bundled into
browser JavaScript. Local overrides belong in ignored `.env.local`.

The [backend submodule](./crm-backend-main) pins the matching separately deployed
backend. It does not start an API server inside the frontend hosting platform.
Clone it with `git submodule update --init --recursive`. Follow the backend
[deployment prerequisites](./crm-backend-main/README.md), including the scheduled
calls, duplicate-control and overdue-view migrations, before deploying this pair.

API calls use the configured backend URL, including analytics calls and authenticated
multipart document uploads. Document and scheduled-export adapters translate the
database's snake-case fields into the UI's fields without losing the original
document properties. The charts aggregate the complete accessible lead list for
the selected date range; they do not invent revenue from estimated values.

## Lead workflows

- Leads default to 50 per page; **All** loads the complete current stage/filter.
- Bucket totals count all accessible matching records, not just the current page.
- Single creation and spreadsheet imports require name, email and an international
  phone beginning with `+country code`, such as `+995 555123456`.
- Matching email **or** phone blocks a new duplicate. Existing CRM records are
  preserved, including historical duplicates.
- Bulk imports show accepted, duplicate and invalid rows before choosing an
  assignee and lead status. Duplicate rows are skipped, not used to overwrite
  existing leads. Legacy Google Sheets sync also uses the duplicate-safe creation
  endpoint instead of attempting to update a matched record.
- Lead detail fields are immediately editable. Text saves on blur; dropdowns and
  dates save on change. Saving, saved and retryable error states are visible.
- Import examples are available as [CSV](./public/lead-import-sample.csv) and
  [Excel](./public/lead-import-sample.xlsx), with two synthetic example records.
