# Bug Report

## 1. Page-one pagination skipped the first page (fixed)

- **Location:** `task-api/src/services/taskService.js`, `getPaginated`
- **Expected:** `page=1&limit=2` returns the first two tasks.
- **Actual:** The offset was calculated as `page * limit`, so page 1 started at index 2.
- **How found:** The service and route pagination tests failed when they asserted the documented one-based page contract.
- **Fix:** Calculate the zero-based offset as `(page - 1) * limit`.

## 2. Status filtering matched partial values (fixed)

- **Location:** `task-api/src/services/taskService.js`, `getByStatus`
- **Expected:** A status filter returns tasks whose status exactly equals the requested status.
- **Actual:** `String.prototype.includes` meant a filter such as `status=do` could return both `todo` and `done` tasks.
- **How found:** The unit and integration tests include an exact-match assertion.
- **Fix:** Use strict equality for the status comparison.

## 3. Completing a task changed its priority (fixed)

- **Location:** `task-api/src/services/taskService.js`, `completeTask`
- **Expected:** Completing a task changes its lifecycle fields while preserving its priority.
- **Actual:** Every completed task was silently changed to `medium` priority.
- **How found:** A completion test created a high-priority task and checked that completion did not overwrite unrelated data.
- **Fix:** Remove the unrelated priority mutation.

## 4. Assignment validation was missing (fixed with the feature)

- **Location:** `task-api/src/routes/tasks.js` and `task-api/src/utils/validators.js`
- **Expected:** An assignment must contain a non-empty string name.
- **Actual:** There was no assignment endpoint or validation path.
- **Fix:** Add `PATCH /tasks/:id/assign`, trim the accepted name, return `400` for invalid input, and return `404` for an unknown task. Reassignment is allowed because the endpoint represents the current owner of a task.
