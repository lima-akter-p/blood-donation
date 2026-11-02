import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, it } from 'node:test';
import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { createAuthToken } from '../utils/auth.js';

process.env.JWT_SECRET = 'test-secret-that-is-never-used-outside-tests';

const { app } = await import('../index.js');
for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM']) {
  delete process.env[key];
}
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await once(server, 'close');
});

it('lists only the signed-in user notifications and supports read actions', async () => {
  const originalUserFindById = User.findById;
  const originalNotificationFind = Notification.find;
  const originalNotificationCountDocuments = Notification.countDocuments;
  const originalNotificationFindOneAndUpdate = Notification.findOneAndUpdate;
  const originalNotificationUpdateMany = Notification.updateMany;
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Request Owner',
    email: 'owner@example.test',
    password: 'not-returned',
    bloodGroup: 'O+',
    district: 'Dhaka',
    upazila: 'Savar',
    role: 'donor',
    status: 'active',
  });
  const notification = {
    _id: new mongoose.Types.ObjectId(),
    recipientId: user._id,
    requestId: new mongoose.Types.ObjectId(),
    title: 'Donation request done',
    message: 'The request for Patient is now done.',
    status: 'done',
    isRead: false,
    createdAt: new Date(),
  };
  const observed = {};
  User.findById = () => ({ select: async () => user });
  Notification.find = (filter) => {
    observed.listFilter = filter;
    return {
      sort(sort) { observed.sort = sort; return this; },
      skip(skip) { observed.skip = skip; return this; },
      limit(limit) { observed.limit = limit; return this; },
      then(resolve, reject) { return Promise.resolve([notification]).then(resolve, reject); },
    };
  };
  Notification.countDocuments = async (filter) => (
    filter.isRead === false ? 2 : 20
  );
  Notification.findOneAndUpdate = async (filter, update) => {
    observed.readFilter = filter;
    observed.readUpdate = update;
    if (
      filter.recipientId.toString() !== user._id.toString()
      || filter._id.toString() !== notification._id.toString()
    ) return null;
    notification.isRead = true;
    return notification;
  };
  Notification.updateMany = async (filter, update) => {
    observed.readAllFilter = filter;
    observed.readAllUpdate = update;
    return { modifiedCount: 2 };
  };

  try {
    const token = createAuthToken(user._id);
    const headers = { authorization: `Bearer ${token}` };
    const noToken = await fetch(`${baseUrl}/notifications`);
    const invalidPage = await fetch(`${baseUrl}/notifications?page=0`, { headers });
    const listResponse = await fetch(`${baseUrl}/notifications?page=2`, { headers });
    const list = await listResponse.json();
    assert.equal(noToken.status, 401);
    assert.equal(invalidPage.status, 400);
    assert.equal(listResponse.status, 200);
    assert.deepEqual(observed.listFilter, { recipientId: user._id });
    assert.deepEqual(observed.sort, { createdAt: -1 });
    assert.equal(observed.skip, 15);
    assert.equal(observed.limit, 15);
    assert.equal(list.unreadCount, 2);
    assert.equal(list.notifications[0].requestId, notification.requestId.toString());
    assert.deepEqual(list.pagination, { page: 2, pageSize: 15, total: 20, totalPages: 2 });

    const unreadCountResponse = await fetch(`${baseUrl}/notifications/unread-count`, { headers });
    assert.deepEqual(await unreadCountResponse.json(), { unreadCount: 2 });

    const readResponse = await fetch(
      `${baseUrl}/notifications/${notification._id}/read`,
      { method: 'PATCH', headers },
    );
    const readBody = await readResponse.json();
    assert.equal(readResponse.status, 200);
    assert.equal(observed.readFilter.recipientId.toString(), user._id.toString());
    assert.equal(observed.readUpdate.$set.isRead, true);
    assert.equal(readBody.notification.isRead, true);

    const missing = await fetch(
      `${baseUrl}/notifications/${new mongoose.Types.ObjectId()}/read`,
      { method: 'PATCH', headers },
    );
    assert.equal(missing.status, 404);

    const readAllResponse = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers,
    });
    assert.equal(readAllResponse.status, 200);
    assert.deepEqual(observed.readAllFilter, { recipientId: user._id, isRead: false });
    assert.deepEqual(observed.readAllUpdate, { $set: { isRead: true } });
    assert.equal((await readAllResponse.json()).markedRead, 2);
  } finally {
    User.findById = originalUserFindById;
    Notification.find = originalNotificationFind;
    Notification.countDocuments = originalNotificationCountDocuments;
    Notification.findOneAndUpdate = originalNotificationFindOneAndUpdate;
    Notification.updateMany = originalNotificationUpdateMany;
  }
});
