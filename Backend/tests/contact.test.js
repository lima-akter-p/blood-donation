import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, it } from 'node:test';
import mongoose from 'mongoose';
import ContactMessage from '../models/contactMessage.model.js';
import User from '../models/user.model.js';
import { createAuthToken } from '../utils/auth.js';

process.env.JWT_SECRET = 'test-secret-that-is-never-used-outside-tests';

const { app } = await import('../index.js');
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

async function postJson(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

it('validates and stores public contact form submissions', async () => {
  const originalCreate = ContactMessage.create;
  const submitted = {
    name: 'Community Member',
    email: 'Member@Example.com',
    phone: '+8801712345678',
    subject: 'Help with donation',
    message: 'I need help finding a donor in my area.',
  };
  let observed;
  ContactMessage.create = async (value) => {
    observed = value;
    return { _id: new mongoose.Types.ObjectId() };
  };

  try {
    const invalid = await postJson('/contact', { ...submitted, message: 'short' });
    const invalidBody = await invalid.json();
    assert.equal(invalid.status, 400);
    assert.match(invalidBody.message, /message must be between/i);
    assert.equal(observed, undefined);

    const response = await postJson('/contact', submitted);
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(observed.name, 'Community Member');
    assert.equal(observed.email, 'member@example.com');
    assert.equal(observed.phone, '+8801712345678');
    assert.equal(body.contactMessage.id.length, 24);
    assert.match(body.message, /received/i);
  } finally {
    ContactMessage.create = originalCreate;
  }
});

it('restricts contact inbox access to admins and allows marking a message read', async () => {
  const originalUserFindById = User.findById;
  const originalContactFind = ContactMessage.find;
  const originalContactCountDocuments = ContactMessage.countDocuments;
  const originalContactFindByIdAndUpdate = ContactMessage.findByIdAndUpdate;
  const admin = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Site Admin',
    email: 'admin@example.com',
    password: 'not-returned',
    bloodGroup: 'A+',
    district: 'Dhaka',
    upazila: 'Savar',
    role: 'admin',
    status: 'active',
  });
  const donor = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Regular Donor',
    email: 'donor@example.com',
    password: 'not-returned',
    bloodGroup: 'O+',
    district: 'Dhaka',
    upazila: 'Savar',
    role: 'donor',
    status: 'active',
  });
  const message = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Community Member',
    email: 'member@example.com',
    phone: '',
    subject: 'Contact request',
    message: 'Please help me with my donation request.',
    isRead: false,
    createdAt: new Date(),
  };
  const observed = {};
  User.findById = (id) => ({
    select: async () => (id.toString() === admin._id.toString() ? admin : donor),
  });
  ContactMessage.find = (filter) => {
    observed.filter = filter;
    return {
      sort(sort) { observed.sort = sort; return this; },
      skip(skip) { observed.skip = skip; return this; },
      limit(limit) { observed.limit = limit; return this; },
      then(resolve, reject) { return Promise.resolve([message]).then(resolve, reject); },
    };
  };
  ContactMessage.countDocuments = async (filter) => (
    filter.isRead === false ? 1 : 5
  );
  ContactMessage.findByIdAndUpdate = async (id, update) => {
    observed.update = { id, update };
    message.isRead = true;
    return message;
  };

  try {
    const adminToken = createAuthToken(admin._id);
    const donorToken = createAuthToken(donor._id);
    const unauthorized = await fetch(`${baseUrl}/contact/messages`, {
      headers: { authorization: `Bearer ${donorToken}` },
    });
    const noToken = await fetch(`${baseUrl}/contact/messages`);
    const listResponse = await fetch(`${baseUrl}/contact/messages?page=1`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const list = await listResponse.json();
    assert.equal(unauthorized.status, 403);
    assert.equal(noToken.status, 401);
    assert.equal(listResponse.status, 200);
    assert.deepEqual(observed.filter, {});
    assert.deepEqual(observed.sort, { createdAt: -1 });
    assert.equal(list.unreadCount, 1);
    assert.equal(list.messages[0].email, 'member@example.com');
    assert.equal(list.pagination.total, 5);

    const markResponse = await fetch(
      `${baseUrl}/contact/messages/${message._id}/read`,
      {
        method: 'PATCH',
        headers: { authorization: `Bearer ${adminToken}` },
      },
    );
    assert.equal(markResponse.status, 200);
    assert.equal(observed.update.update.$set.isRead, true);
    assert.equal(message.isRead, true);
  } finally {
    User.findById = originalUserFindById;
    ContactMessage.find = originalContactFind;
    ContactMessage.countDocuments = originalContactCountDocuments;
    ContactMessage.findByIdAndUpdate = originalContactFindByIdAndUpdate;
  }
});
