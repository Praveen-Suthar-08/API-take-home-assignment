const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  test('creates tasks with defaults and returns copies from getAll', () => {
    const task = taskService.create({ title: 'Write tests' });

    expect(task).toMatchObject({
      title: 'Write tests',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      completedAt: null,
    });
    expect(task.id).toEqual(expect.any(String));
    expect(task.createdAt).toEqual(expect.any(String));
    expect(taskService.getAll()).toEqual([task]);
    expect(taskService.getAll()).not.toBe(task);
  });

  test('finds tasks by exact status', () => {
    const todo = taskService.create({ title: 'Todo', status: 'todo' });
    taskService.create({ title: 'In progress', status: 'in_progress' });

    expect(taskService.getByStatus('todo')).toEqual([todo]);
    expect(taskService.getByStatus('do')).toEqual([]);
  });

  test('paginates from one-based page numbers', () => {
    const tasks = ['One', 'Two', 'Three'].map((title) => taskService.create({ title }));

    expect(taskService.getPaginated(1, 2)).toEqual(tasks.slice(0, 2));
    expect(taskService.getPaginated(2, 2)).toEqual([tasks[2]]);
  });

  test('updates and removes tasks, returning null or false for missing ids', () => {
    const task = taskService.create({ title: 'Original' });

    expect(taskService.update(task.id, { title: 'Updated' })).toMatchObject({
      id: task.id,
      title: 'Updated',
    });
    expect(taskService.update('missing', { title: 'Nope' })).toBeNull();
    expect(taskService.remove(task.id)).toBe(true);
    expect(taskService.remove(task.id)).toBe(false);
  });

  test('completes a task without changing its priority', () => {
    const task = taskService.create({ title: 'Urgent', priority: 'high' });

    const completed = taskService.completeTask(task.id);

    expect(completed).toMatchObject({ status: 'done', priority: 'high' });
    expect(completed.completedAt).toEqual(expect.any(String));
    expect(taskService.completeTask('missing')).toBeNull();
  });

  test('assigns and reassigns an existing task', () => {
    const task = taskService.create({ title: 'Review PR' });

    expect(taskService.assignTask(task.id, ' Priya ')).toMatchObject({
      id: task.id,
      assignee: ' Priya ',
    });
    expect(taskService.assignTask(task.id, 'Alex')).toMatchObject({
      id: task.id,
      assignee: 'Alex',
    });
    expect(taskService.assignTask('missing', 'Alex')).toBeNull();
  });

  test('calculates counts and excludes completed overdue tasks', () => {
    taskService.create({ title: 'Todo', status: 'todo' });
    taskService.create({ title: 'In progress', status: 'in_progress' });
    taskService.create({ title: 'Done', status: 'done', dueDate: '2000-01-01T00:00:00.000Z' });

    const stats = taskService.getStats();

    expect(stats).toEqual({ todo: 1, in_progress: 1, done: 1, overdue: 0 });
  });
});
