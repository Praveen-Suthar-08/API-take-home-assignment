# Submission Notes

## Design decisions

`PATCH /tasks/:id/assign` accepts a non-empty string, trims surrounding whitespace, and stores the normalized name as `assignee`. Reassignment is allowed and replaces the current assignee, which keeps the endpoint useful when ownership changes. Missing tasks return `404`; malformed assignment bodies return `400`.

The tests are split into service unit tests and Supertest route tests. They cover the documented happy paths, validation failures, missing resources, pagination, exact status filtering, completion, deletion, statistics, and reassignment behavior.

## What I would test next

I would add property-based tests for pagination and validation, API contract tests for the JSON schema, and tests that pin down behavior around invalid pagination values, date boundaries, and concurrent writes if the store becomes persistent.

## What surprised me

The starter API was small but had several correctness issues that were easy to miss without tests: pagination was zero-based in practice despite a one-based API example, status filtering used substring matching, and completion changed priority as a side effect.

## Questions before production

I would confirm whether assignee names should be free text or user IDs, whether reassignment needs authorization or an audit trail, and whether the in-memory store is intentionally temporary. I would also confirm the expected timezone and validation rules for due dates.
