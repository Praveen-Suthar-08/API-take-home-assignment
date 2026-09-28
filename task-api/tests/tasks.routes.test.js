const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('task routes', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('creates and lists tasks', async () => {
    const createResponse = await request(app)
      .post('/tasks')
      .send({ title: 'Ship API', priority: 'high' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({ title: 'Ship API', priority: 'high' });

    const listResponse = await request(app).get('/tasks');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(createResponse.body.id);
  });

  test('rejects invalid task input', async () => {
    const missingTitle = await request(app).post('/tasks').send({ priority: 'high' });
    const invalidPriority = await request(app)
      .post('/tasks')
      .send({ title: 'Bad priority', priority: 'urgent' });

    expect(missingTitle.status).toBe(400);
    expect(invalidPriority.status).toBe(400);
  });

  test('filters by exact status and paginates', async () => {
    await request(app).post('/tasks').send({ title: 'Todo', status: 'todo' });
    await request(app).post('/tasks').send({ title: 'In progress', status: 'in_progress' });
    await request(app).post('/tasks').send({ title: 'Second todo', status: 'todo' });

    const filtered = await request(app).get('/tasks?status=todo');
    const paginated = await request(app).get('/tasks?page=1&limit=2');

    expect(filtered.body.map((task) => task.title)).toEqual(['Todo', 'Second todo']);
    expect(paginated.body.map((task) => task.title)).toEqual(['Todo', 'In progress']);
  });

  test('updates and handles missing tasks', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Draft' });
    const updated = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: 'Published', status: 'done' });
    const missing = await request(app).put('/tasks/missing').send({ title: 'Nope' });

    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: 'Published', status: 'done' });
    expect(missing.status).toBe(404);
  });

  test('completes and deletes a task', async () => {
    const created = await request(app)
      .post('/tasks')
      .send({ title: 'Finish', priority: 'high' });
    const completed = await request(app).patch(`/tasks/${created.body.id}/complete`);
    const deleted = await request(app).delete(`/tasks/${created.body.id}`);
    const missing = await request(app).patch('/tasks/missing/complete');

    expect(completed.status).toBe(200);
    expect(completed.body).toMatchObject({ status: 'done', priority: 'high' });
    expect(deleted.status).toBe(204);
    expect(deleted.body).toEqual({});
    expect(missing.status).toBe(404);
  });

  test('assigns a task and allows reassignment', async () => {
    const created = await request(app).post('/tasks').send({ title: 'Review' });

    const firstAssignment = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: '  Priya  ' });
    const reassignment = await request(app)
      .patch(`/tasks/${created.body.id}/assign`)
      .send({ assignee: 'Alex' });

    expect(firstAssignment.status).toBe(200);
    expect(firstAssignment.body.assignee).toBe('Priya');
    expect(reassignment.status).toBe(200);
    expect(reassignment.body.assignee).toBe('Alex');
  });

  test('rejects invalid assignment and missing task ids', async () => {
    const empty = await request(app).patch('/tasks/missing/assign').send({ assignee: ' ' });
    const nonString = await request(app).patch('/tasks/missing/assign').send({ assignee: 42 });

    expect(empty.status).toBe(400);
    expect(nonString.status).toBe(400);

    const created = await request(app).post('/tasks').send({ title: 'Review' });
    const missing = await request(app)
      .patch('/tasks/does-not-exist/assign')
      .send({ assignee: 'Alex' });

    expect(created.status).toBe(201);
    expect(missing.status).toBe(404);
  });

  test('returns task statistics', async () => {
    await request(app).post('/tasks').send({ title: 'Todo' });
    await request(app).post('/tasks').send({ title: 'Done', status: 'done' });

    const response = await request(app).get('/tasks/stats');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ todo: 1, done: 1, in_progress: 0, overdue: 0 });
  });
});
