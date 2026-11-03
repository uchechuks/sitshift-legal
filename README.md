# sitshift-legal

The SitShift legal and privacy pages, published with GitHub Pages at https://uchechuks.github.io/sitshift-legal/. **Merging to `main` publishes.** The app links here (`lib/legal.js` in the app repo), and the store listings point here.

| Page | What it is |
|---|---|
| `index.html` | The list of pages |
| `privacy.html` | Privacy Policy |
| `consumer-health-data.html` | Consumer Health Data Privacy Policy (US state health-data laws) |
| `terms.html` | Terms of Service, including subscriptions |
| `delete-account.html` | How to delete an account (the stores require this URL) |
| `join.html` | The pod invite page. Pods are off in the current app, so it's not linked from the index. |

## Before publishing a change

1. **A lawyer reviews it.** These pages are written from what the app does, but they're legal documents.
2. **Check it matches the app.** `data/required-disclosures.json` lists what each policy must name, taken from the app's in-app data map (`data/dataMap.js`) at a given app commit. When the app's data map changes, update the list in the same release.
3. **Run the check:** `node scripts/check.mjs` (no dependencies). CI runs it on every pull request.
4. **To publish:**
   - remove the "Draft, not yet in effect" banner from each page;
   - set the effective date;
   - fill any `[to be decided]` placeholder;
   - add a line under "Changes to this policy";
   - run `node scripts/check.mjs --published`, which must pass;
   - switch the CI step to `--published`, then merge.
