import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, it } from 'node:test';
import mongoose from 'mongoose';
import DonationRequest from '../models/donationRequest.model.js';
import Funding from '../models/funding.model.js';
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

async function patchJson(path, body, token) {
  return fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

async function deleteWithToken(path, token) {
  return fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
}

it('allows admins to manage any request and returns actual dashboard counts', async () => {
  const originalUserFindById = User.findById;
  const originalUserCountDocuments = User.countDocuments;
  const originalRequestFind = DonationRequest.find;
  const originalRequestFindById = DonationRequest.findById;
  const originalRequestCountDocuments = DonationRequest.countDocuments;
  const originalRequestAggregate = DonationRequest.aggregate;
  const originalNotificationInsertMany = Notification.insertMany;
  const originalFundingAggregate = Funding.aggregate;
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
  const request = {
    _id: new mongoose.Types.ObjectId(),
    requesterId: new mongoose.Types.ObjectId(),
    requesterName: 'Requesting Donor',
    requesterEmail: 'requester@example.com',
    recipientName: 'Patient Name',
    recipientDistrict: 'Dhaka',
    recipientUpazila: 'Savar',
    hospitalName: 'Community Hospital',
    fullAddress: 'Savar, Dhaka',
    bloodGroup: 'O+',
    donationDate: '2030-01-02',
    donationTime: '10:30',
    requestMessage: 'Urgent blood donation needed.',
    donorId: null,
    donorName: '',
    donorEmail: '',
    status: 'pending',
    statusHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    set(values) { Object.assign(this, values); },
    async save() { return this; },
    async deleteOne() { this.deleted = true; },
  };
  const observed = {};
  Notification.insertMany = async (documents) => {
    observed.notifications = documents;
    return documents;
  };

  User.findById = () => ({ select: async () => admin });
  User.countDocuments = async (filter) => {
    observed.userCountFilter = filter;
    return 12;
  };
  DonationRequest.find = (filter) => {
    observed.listFilter = filter;
    return {
      sort(sort) { observed.sort = sort; return this; },
      skip(skip) { observed.skip = skip; return this; },
      limit(limit) { observed.limit = limit; return this; },
      then(resolve, reject) { return Promise.resolve([request]).then(resolve, reject); },
    };
  };
  DonationRequest.findById = async (id) => (
    id.toString() === request._id.toString() ? request : null
  );
  DonationRequest.countDocuments = async (filter) => {
    observed.countFilters = [...(observed.countFilters || []), filter];
    return filter.status === 'inprogress' ? 3 : 7;
  };
  DonationRequest.aggregate = async () => [{
    _id: new Date().toISOString().slice(0, 7),
    requests: 4,
    completed: 2,
  }];
  Funding.aggregate = async () => [{ totalAmountPaisa: 459900 }];

  try {
    const token = createAuthToken(admin._id);
    const headers = { authorization: `Bearer ${token}` };
    const listResponse = await fetch(
      `${baseUrl}/donation-requests/all?page=2&status=pending`,
      { headers },
    );
    const listBody = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.deepEqual(observed.listFilter, { status: 'pending' });
    assert.deepEqual(observed.sort, { createdAt: -1 });
    assert.equal(observed.skip, 10);
    assert.equal(observed.limit, 10);
    assert.equal(listBody.requests[0].requesterEmail, 'requester@example.com');

    const detailResponse = await fetch(
      `${baseUrl}/donation-requests/all/${request._id}`,
      { headers },
    );
    assert.equal(detailResponse.status, 200);
    assert.equal((await detailResponse.json()).request.id, request._id.toString());

    const publicDetailResponse = await fetch(
      `${baseUrl}/donation-requests/${request._id}`,
      { headers },
    );
    assert.equal(publicDetailResponse.status, 200);

    const updateResponse = await patchJson(
      `/donation-requests/all/${request._id}`,
      { recipientName: 'Updated Recipient' },
      token,
    );
    assert.equal(updateResponse.status, 200);
    assert.equal(request.recipientName, 'Updated Recipient');

    request.status = 'inprogress';
    const statusResponse = await patchJson(
      `/donation-requests/${request._id}/status`,
      { status: 'done' },
      token,
    );
    assert.equal(statusResponse.status, 200);
    assert.equal(request.status, 'done');
    const statusBody = await statusResponse.json();
    assert.equal(statusBody.notification.sent, false);
    assert.equal(request.statusHistory.at(-1).status, 'done');
    assert.equal(observed.notifications.length, 1);
    assert.equal(observed.notifications[0].recipientId.toString(), request.requesterId.toString());
    assert.equal(observed.notifications[0].requestId.toString(), request._id.toString());

    const statsResponse = await fetch(`${baseUrl}/admin/dashboard`, { headers });
    const statsBody = await statsResponse.json();
    assert.equal(statsResponse.status, 200);
    assert.equal(observed.userCountFilter.role, 'donor');
    assert.equal(statsBody.statistics.donorCount, 12);
    assert.equal(statsBody.statistics.donationRequestCount, 7);
    assert.equal(statsBody.statistics.requestStatuses.inprogress, 3);
    assert.equal(statsBody.statistics.totalFunding, 4599);
    assert.equal(statsBody.statistics.fundingCurrency, 'BDT');
    assert.equal(statsBody.statistics.monthlyRequests.length, 6);
    assert.equal(statsBody.statistics.monthlyRequests.at(-1).requests, 4);
    assert.equal(statsBody.statistics.monthlyRequests.at(-1).completed, 2);

    const deleteResponse = await deleteWithToken(
      `/donation-requests/all/${request._id}`,
      token,
    );
    assert.equal(deleteResponse.status, 200);
    assert.equal(request.deleted, true);
  } finally {
    User.findById = originalUserFindById;
    User.countDocuments = originalUserCountDocuments;
    DonationRequest.find = originalRequestFind;
    DonationRequest.findById = originalRequestFindById;
    DonationRequest.countDocuments = originalRequestCountDocuments;
    DonationRequest.aggregate = originalRequestAggregate;
    Funding.aggregate = originalFundingAggregate;
    Notification.insertMany = originalNotificationInsertMany;
  }
});
