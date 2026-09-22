# Model family scope

The default family remains CS5800i/CS6800i/WLW176i/WLW186i MB. Four additional families can be selected independently. The public selector remains visible in embedded mode; there is no all-family scope.

`ModelFamilyProvider` resolves `family` from the router's query string (after `#` with HashRouter). Missing or unsupported values resolve to `cs5800_6800`. Internal navigation retains the selection. The five supported IDs are an explicit UI contract in `modelFamilies.ts`; the database catalog supplies labels and valid device combinations.

All public queries include a family predicate and include the family in their TanStack Query key. Sampling uses the RPC's dedicated `model_family` argument, independently of editable OR/AND filters. Family changes remount route content and the consumption provider to clear local filters, selection state and the 25-W toggle. Queries never use previous-family data as a placeholder. System mutations evict public result caches to avoid retaining an edited system in its former family.

The personal system form uses its record's family, independently of the public selection. A family change clears both devices and both firmware versions. Only valid type classes for the chosen indoor unit are offered. Firmware controls and the optional 25-W consumption correction apply only to the standard family. Missing catalog data blocks form submission. Historical incomplete device selections can be kept unchanged but newly selected configurations must be complete.

## Deployment

Deploy the database enum/catalog migrations before this UI. Do not register other-family systems until the family-aware UI is live. See `heatpump-metrics-db/MODEL_FAMILIES.md` in the workspace for the complete rollout and SQL checks. Uploads must still supply the existing energy/temperature quantities; this change does not provide new EMS-ESP mappings or assert identical measurement boundaries within a family.

## Tests

- `SystemForm.families.test.tsx`: clearing dependent fields, hidden firmware and brand-specific type classes.
- `ModelFamilies.integration.test.tsx`: all public queries/cache keys, family navigation, filter/correction reset, embedded mode, invalid links and late responses from another family.
- SQL tests in `heatpump-metrics-db/tests/model_families.sql`: authoritative combination/firmware validation and sampling isolation.
