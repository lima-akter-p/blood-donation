import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import DonationRequest from '../models/donationRequest.model.js';
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { authorizeRoles } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../controllers/auth.controller.js';
import { createAuthToken, verifyAuthToken } from '../utils/auth.js';
import { getGoogleProfilePictureUrl } from '../utils/firebaseAuth.js';

process.env.JWT_SECRET = 'test-secret-that-is-never-used-outside-tests';

const { app } = await import('../index.js');
Notification.insertMany = async (documents) => documents;
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

async function postJson(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

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

async function postJsonWithToken(path, body, token) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
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

describe('admin user management API', () => {
  it('lists filtered users without password fields and with pagination', async () => {
    const originalFindById = User.findById;
    const originalFind = User.find;
    const originalCountDocuments = User.countDocuments;
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
    const listedUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Regular Donor',
      email: 'donor@example.com',
      avatar: '',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhamrai',
      role: 'donor',
      status: 'blocked',
      createdAt: new Date(),
      password: 'not returned',
    };
    const observed = {};
    User.findById = () => ({ select: async () => admin });
    User.find = (filter) => {
      observed.filter = filter;
      return {
        select(fields) { observed.select = fields; return this; },
        sort(sort) { observed.sort = sort; return this; },
        skip(skip) { observed.skip = skip; return this; },
        limit(limit) { observed.limit = limit; return this; },
        then(resolve, reject) { return Promise.resolve([listedUser]).then(resolve, reject); },
      };
    };
    User.countDocuments = async (filter) => {
      observed.countFilter = filter;
      return 11;
    };

    try {
      const response = await fetch(`${baseUrl}/admin/users?status=blocked&page=2`, {
        headers: { authorization: `Bearer ${createAuthToken(admin._id)}` },
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(observed.filter, { status: 'blocked' });
      assert.deepEqual(observed.countFilter, { status: 'blocked' });
      assert.equal(observed.select.includes('password'), false);
      assert.deepEqual(observed.sort, { createdAt: -1 });
      assert.equal(observed.skip, 10);
      assert.equal(observed.limit, 10);
      assert.equal(body.users[0].email, listedUser.email);
      assert.equal(Object.hasOwn(body.users[0], 'password'), false);
      assert.deepEqual(body.pagination, { page: 2, pageSize: 10, total: 11, totalPages: 2 });
    } finally {
      User.findById = originalFindById;
      User.find = originalFind;
      User.countDocuments = originalCountDocuments;
    }
  });

  it('allows admins to block and unblock accounts and promote eligible roles', async () => {
    const originalFindById = User.findById;
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
    const target = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Managed Donor',
      email: 'managed@example.com',
      avatar: '',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
      createdAt: new Date(),
      async save() { return this; },
    };
    User.findById = (id) => (
      id.toString() === admin._id.toString()
        ? { select: async () => admin }
        : target
    );

    try {
      const token = createAuthToken(admin._id);
      const blocked = await patchJson(`/admin/users/${target._id}/status`, { status: 'blocked' }, token);
      assert.equal(blocked.status, 200);
      assert.equal(target.status, 'blocked');

      const unblocked = await patchJson(`/admin/users/${target._id}/status`, { status: 'active' }, token);
      assert.equal(unblocked.status, 200);
      assert.equal(target.status, 'active');

      const promoted = await patchJson(`/admin/users/${target._id}/role`, { role: 'volunteer' }, token);
      assert.equal(promoted.status, 200);
      assert.equal(target.role, 'volunteer');

      const elevated = await patchJson(`/admin/users/${target._id}/role`, { role: 'admin' }, token);
      assert.equal(elevated.status, 200);
      assert.equal(target.role, 'admin');
    } finally {
      User.findById = originalFindById;
    }
  });

  it('restricts admin mutations and protects the current and last active administrator', async () => {
    const originalFindById = User.findById;
    const originalCountDocuments = User.countDocuments;
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
    const target = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Another Admin',
      email: 'another-admin@example.com',
      role: 'admin',
      status: 'active',
      async save() { return this; },
    };
    User.findById = (id) => (
      id.toString() === admin._id.toString()
        ? { select: async () => admin }
        : target
    );
    User.countDocuments = async () => 1;

    try {
      const token = createAuthToken(admin._id);
      const selfBlocked = await patchJson(
        `/admin/users/${admin._id.toString().toUpperCase()}/status`,
        { status: 'blocked' },
        token,
      );
      const selfRoleChange = await patchJson(
        `/admin/users/${admin._id}/role`,
        { role: 'admin' },
        token,
      );
      const lastAdminBlocked = await patchJson(
        `/admin/users/${target._id}/status`,
        { status: 'blocked' },
        token,
      );
      const invalidRole = await patchJson(
        `/admin/users/${target._id}/role`,
        { role: 'donor' },
        token,
      );
      const invalidStatus = await patchJson(
        `/admin/users/${target._id}/status`,
        { status: 'suspended' },
        token,
      );

      assert.equal(selfBlocked.status, 409);
      assert.equal(selfRoleChange.status, 409);
      assert.equal(lastAdminBlocked.status, 409);
      assert.equal(invalidRole.status, 400);
      assert.equal(invalidStatus.status, 400);
      assert.equal(target.status, 'active');
      assert.equal(target.role, 'admin');

      const unauthenticated = await fetch(`${baseUrl}/admin/users`);
      assert.equal(unauthenticated.status, 401);

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
      User.findById = () => ({ select: async () => donor });
      const forbidden = await fetch(`${baseUrl}/admin/users`, {
        headers: { authorization: `Bearer ${createAuthToken(donor._id)}` },
      });
      assert.equal(forbidden.status, 403);
    } finally {
      User.findById = originalFindById;
      User.countDocuments = originalCountDocuments;
    }
  });
});

describe('public donor search API', () => {
  it('returns only active donor profile fields for a valid blood group and location', async () => {
    const originalFind = User.find;
    const originalCountDocuments = User.countDocuments;
    const donor = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Available Donor',
      avatar: '',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Savar',
      phone: '+8801712345678',
      email: 'private@example.com',
      role: 'donor',
      status: 'active',
    };
    const observed = {};
    User.find = (filter) => {
      observed.filter = filter;
      return {
        select(fields) { observed.select = fields; return this; },
        sort(sort) { observed.sort = sort; return this; },
        skip(skip) { observed.skip = skip; return this; },
        limit(limit) { observed.limit = limit; return this; },
        then(resolve, reject) { return Promise.resolve([donor]).then(resolve, reject); },
      };
    };
    User.countDocuments = async (filter) => {
      observed.countFilter = filter;
      return 13;
    };

    try {
      const response = await fetch(
        `${baseUrl}/donors?bloodGroup=O%2B&district=Dhaka&upazila=Savar&page=2`,
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(observed.filter, {
        role: 'donor',
        status: 'active',
        bloodGroup: 'O+',
        district: 'Dhaka',
        upazila: 'Savar',
        isAvailable: { $ne: false },
        $or: [
          { nextAvailableDate: '' },
          { nextAvailableDate: { $lte: new Date().toISOString().slice(0, 10) } },
          { nextAvailableDate: { $exists: false } },
        ],
      });
      assert.equal(observed.select, 'name avatar bloodGroup district upazila phone isAvailable nextAvailableDate');
      assert.deepEqual(observed.sort, { name: 1 });
      assert.equal(observed.skip, 12);
      assert.equal(observed.limit, 12);
      assert.deepEqual(observed.countFilter, observed.filter);
      assert.deepEqual(body.donors[0], {
        id: donor._id.toString(),
        name: donor.name,
        avatar: '',
        bloodGroup: donor.bloodGroup,
        district: donor.district,
        upazila: donor.upazila,
        phone: donor.phone,
        isAvailable: true,
      });
      assert.equal(Object.hasOwn(body.donors[0], 'email'), false);
      assert.deepEqual(body.pagination, { page: 2, pageSize: 12, total: 13, totalPages: 2 });
    } finally {
      User.find = originalFind;
      User.countDocuments = originalCountDocuments;
    }
  });

  it('rejects missing or invalid donor search filters without querying users', async () => {
    const originalFind = User.find;
    let findCalled = false;
    User.find = () => {
      findCalled = true;
      throw new Error('Invalid search should not query donor records.');
    };

    try {
      const missing = await fetch(`${baseUrl}/donors`);
      const invalid = await fetch(
        `${baseUrl}/donors?bloodGroup=unknown&district=Dhaka&upazila=Savar`,
      );
      const invalidPage = await fetch(
        `${baseUrl}/donors?bloodGroup=O%2B&district=Dhaka&upazila=Savar&page=0`,
      );

      assert.equal(missing.status, 400);
      assert.equal(invalid.status, 400);
      assert.equal(invalidPage.status, 400);
      assert.equal(findCalled, false);
    } finally {
      User.find = originalFind;
    }
  });
});

describe('donation request API', () => {
  const requestDetails = {
    recipientName: 'Patient Name',
    recipientDistrict: 'Dhaka',
    recipientUpazila: 'Savar',
    hospitalName: 'Savar General Hospital',
    fullAddress: 'Main Road, Savar',
    bloodGroup: 'O+',
    donationDate: '2027-01-15',
    donationTime: '10:30',
    requestMessage: 'Blood needed for a scheduled procedure.',
  };

  it('creates a pending request owned by the authenticated user', async () => {
    const originalFindById = User.findById;
    const originalCreate = DonationRequest.create;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const created = {};
    User.findById = () => ({ select: async () => user });
    DonationRequest.create = async (data) => {
      Object.assign(created, data);
      return {
        ...data,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    };

    try {
      const response = await postJsonWithToken(
        '/donation-requests',
        {
          ...requestDetails,
          requesterName: 'Spoofed Name',
          requesterEmail: 'spoofed@example.com',
          status: 'done',
        },
        createAuthToken(user._id),
      );
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.request.requesterId, user._id.toString());
      assert.equal(body.request.requesterName, 'Requesting Donor');
      assert.equal(body.request.requesterEmail, 'requester@example.com');
      assert.equal(body.request.status, 'pending');
      assert.equal(body.request.statusHistory[0].status, 'pending');
      assert.equal(body.request.statusHistory[0].changedByName, user.name);
      assert.equal(created.status, 'pending');
      assert.equal(body.request.recipientName, requestDetails.recipientName);
    } finally {
      User.findById = originalFindById;
      DonationRequest.create = originalCreate;
    }
  });

  it('prevents a blocked user from creating a donation request', async () => {
    const originalFindById = User.findById;
    const originalCreate = DonationRequest.create;
    const blockedUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Blocked Donor',
      email: 'blocked@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'blocked',
    });
    let createCalled = false;
    User.findById = () => ({ select: async () => blockedUser });
    DonationRequest.create = async () => {
      createCalled = true;
      throw new Error('Blocked users must not create requests.');
    };

    try {
      const response = await postJsonWithToken(
        '/donation-requests',
        requestDetails,
        createAuthToken(blockedUser._id),
      );
      const body = await response.json();

      assert.equal(response.status, 403);
      assert.match(body.message, /blocked/i);
      assert.equal(createCalled, false);
    } finally {
      User.findById = originalFindById;
      DonationRequest.create = originalCreate;
    }
  });

  it('rejects invalid request details before creating a document', async () => {
    const originalFindById = User.findById;
    const originalCreate = DonationRequest.create;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    let createCalled = false;
    User.findById = () => ({ select: async () => user });
    DonationRequest.create = async () => {
      createCalled = true;
      throw new Error('Invalid request must not be persisted.');
    };

    try {
      const response = await postJsonWithToken(
        '/donation-requests',
        { ...requestDetails, bloodGroup: 'invalid', donationDate: '2027-02-31' },
        createAuthToken(user._id),
      );

      assert.equal(response.status, 400);
      assert.equal(createCalled, false);

      const nullBody = await postJsonWithToken(
        '/donation-requests',
        null,
        createAuthToken(user._id),
      );
      assert.equal(nullBody.status, 400);
    } finally {
      User.findById = originalFindById;
      DonationRequest.create = originalCreate;
    }
  });

  it('lists only the signed-in user requests with validated status and pagination', async () => {
    const originalFindById = User.findById;
    const originalFind = DonationRequest.find;
    const originalCountDocuments = DonationRequest.countDocuments;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const observed = {};
    User.findById = () => ({ select: async () => user });
    DonationRequest.find = (filter) => {
      observed.filter = filter;
      return {
        sort(sort) {
          observed.sort = sort;
          return this;
        },
        skip(skip) {
          observed.skip = skip;
          return this;
        },
        limit(limit) {
          observed.limit = limit;
          return this;
        },
        then(resolve, reject) {
          return Promise.resolve([request]).then(resolve, reject);
        },
      };
    };
    DonationRequest.countDocuments = async (filter) => {
      observed.countFilter = filter;
      return 21;
    };

    try {
      const response = await fetch(
        `${baseUrl}/donation-requests/mine?page=2&status=pending`,
        { headers: { authorization: `Bearer ${createAuthToken(user._id)}` } },
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(observed.filter.requesterId.toString(), user._id.toString());
      assert.equal(observed.filter.status, 'pending');
      assert.equal(observed.sort.createdAt, -1);
      assert.equal(observed.skip, 10);
      assert.equal(observed.limit, 10);
      assert.equal(observed.countFilter.requesterId.toString(), user._id.toString());
      assert.equal(body.requests.length, 1);
      assert.deepEqual(body.pagination, { page: 2, pageSize: 10, total: 21, totalPages: 3 });
    } finally {
      User.findById = originalFindById;
      DonationRequest.find = originalFind;
      DonationRequest.countDocuments = originalCountDocuments;
    }
  });

  it('lets volunteers list all requests and manage only requests they own', async () => {
    const originalFindById = User.findById;
    const originalFind = DonationRequest.find;
    const originalCountDocuments = DonationRequest.countDocuments;
    const originalRequestFindById = DonationRequest.findById;
    const originalRequestFindOne = DonationRequest.findOne;
    const volunteer = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Volunteer',
      email: 'volunteer@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'volunteer',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: new mongoose.Types.ObjectId(),
      requesterName: 'Requesting Donor',
      requesterEmail: 'requester@example.com',
      ...requestDetails,
      donorId: null,
      donorName: '',
      donorEmail: '',
      status: 'inprogress',
      createdAt: new Date(),
      updatedAt: new Date(),
      async save() { return this; },
    };
    const observed = {};
    User.findById = () => ({ select: async () => volunteer });
    DonationRequest.find = (filter) => {
      observed.filter = filter;
      return {
        sort(sort) { observed.sort = sort; return this; },
        skip(skip) { observed.skip = skip; return this; },
        limit(limit) { observed.limit = limit; return this; },
        then(resolve, reject) { return Promise.resolve([request]).then(resolve, reject); },
      };
    };
    DonationRequest.countDocuments = async () => 1;
    DonationRequest.findById = async () => request;
    DonationRequest.findOne = async (filter) => {
      observed.ownedRequestFilter = filter;
      return null;
    };

    try {
      const token = createAuthToken(volunteer._id);
      const allRequests = await fetch(
        `${baseUrl}/donation-requests/all?page=1&status=inprogress`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      const listBody = await allRequests.json();
      assert.equal(allRequests.status, 200);
      assert.deepEqual(observed.filter, { status: 'inprogress' });
      assert.equal(listBody.requests[0].requesterEmail, 'requester@example.com');
      assert.deepEqual(listBody.pagination, { page: 1, pageSize: 10, total: 1, totalPages: 1 });

      const statusResponse = await patchJson(
        `/donation-requests/${request._id}/status`,
        { status: 'done' },
        token,
      );
      assert.equal(statusResponse.status, 200);
      assert.equal(request.status, 'done');

      const editResponse = await patchJson(
        `/donation-requests/${request._id}`,
        { recipientName: 'Unauthorized Edit' },
        token,
      );
      const deleteResponse = await deleteWithToken(
        `/donation-requests/${request._id}`,
        token,
      );
      const createResponse = await postJsonWithToken(
        '/donation-requests',
        requestDetails,
        token,
      );
      const donationConfirmation = await postJsonWithToken(
        `/donation-requests/${request._id}/donate`,
        {},
        token,
      );
      assert.equal(editResponse.status, 404);
      assert.equal(deleteResponse.status, 404);
      assert.equal(observed.ownedRequestFilter.requesterId.toString(), volunteer._id.toString());
      assert.equal(createResponse.status, 403);
      assert.equal(donationConfirmation.status, 403);

      const unauthenticated = await fetch(`${baseUrl}/donation-requests/all`);
      assert.equal(unauthenticated.status, 401);

      volunteer.role = 'donor';
      const donorAccess = await fetch(`${baseUrl}/donation-requests/all`, {
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(donorAccess.status, 403);
    } finally {
      User.findById = originalFindById;
      DonationRequest.find = originalFind;
      DonationRequest.countDocuments = originalCountDocuments;
      DonationRequest.findById = originalRequestFindById;
      DonationRequest.findOne = originalRequestFindOne;
    }
  });

  it('denies volunteers from donor-owned request listing and validates donor filters', async () => {
    const originalFindById = User.findById;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Volunteer',
      email: 'volunteer@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'volunteer',
      status: 'active',
    });
    User.findById = () => ({ select: async () => user });

    try {
      const token = createAuthToken(user._id);
      const createResponse = await postJsonWithToken(
        '/donation-requests',
        requestDetails,
        token,
      );
      const filterResponse = await fetch(
        `${baseUrl}/donation-requests/mine?status=unknown`,
        { headers: { authorization: `Bearer ${token}` } },
      );

      assert.equal(createResponse.status, 403);
      assert.equal(filterResponse.status, 403);

      user.role = 'donor';
      const invalidStatus = await fetch(
        `${baseUrl}/donation-requests/mine?status=unknown`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      const invalidPage = await fetch(
        `${baseUrl}/donation-requests/mine?page=0`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(invalidStatus.status, 400);
      assert.equal(invalidPage.status, 400);
    } finally {
      User.findById = originalFindById;
    }
  });

  it('requires authentication for request creation and listing', async () => {
    const createResponse = await fetch(`${baseUrl}/donation-requests`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestDetails),
    });
    const listResponse = await fetch(`${baseUrl}/donation-requests/mine`);

    assert.equal(createResponse.status, 401);
    assert.equal(listResponse.status, 401);
  });

  it('updates only validated request fields belonging to the signed-in requester', async () => {
    const originalFindById = User.findById;
    const originalFindOne = DonationRequest.findOne;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      set(values) { Object.assign(this, values); },
      async save() { return this; },
    };
    let observedFilter;
    User.findById = () => ({ select: async () => user });
    DonationRequest.findOne = async (filter) => {
      observedFilter = filter;
      return request;
    };

    try {
      const response = await patchJson(
        `/donation-requests/${request._id}`,
        { recipientName: 'Updated Patient' },
        createAuthToken(user._id),
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(observedFilter.requesterId.toString(), user._id.toString());
      assert.equal(request.recipientName, 'Updated Patient');
      assert.equal(request.status, 'pending');
      assert.equal(request.requesterId.toString(), user._id.toString());
      assert.equal(body.request.recipientName, 'Updated Patient');

      const protectedFields = await patchJson(
        `/donation-requests/${request._id}`,
        { status: 'done', requesterId: new mongoose.Types.ObjectId() },
        createAuthToken(user._id),
      );
      assert.equal(protectedFields.status, 400);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOne = originalFindOne;
    }
  });

  it('allows volunteers to edit and delete only requests they created', async () => {
    const originalFindById = User.findById;
    const originalFindOne = DonationRequest.findOne;
    const volunteer = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Volunteer',
      email: 'volunteer@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'volunteer',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: volunteer._id,
      requesterName: volunteer.name,
      requesterEmail: volunteer.email,
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      set(values) { Object.assign(this, values); },
      async save() { return this; },
      async deleteOne() { this.deleted = true; },
    };
    let ownsRequest = true;
    let observedFilter;
    User.findById = () => ({ select: async () => volunteer });
    DonationRequest.findOne = async (filter) => {
      observedFilter = filter;
      return ownsRequest ? request : null;
    };

    try {
      const token = createAuthToken(volunteer._id);
      const details = await fetch(`${baseUrl}/donation-requests/mine/${request._id}`, {
        headers: { authorization: ['Bearer', token].join(' ') },
      });
      assert.equal(details.status, 200);
      assert.equal((await details.json()).request.requesterId, volunteer._id.toString());

      request.status = 'done';
      const update = await patchJson(
        `/donation-requests/${request._id}`,
        { recipientName: 'Updated Patient' },
        token,
      );
      assert.equal(update.status, 200);
      assert.equal(request.recipientName, 'Updated Patient');
      assert.equal(request.status, 'done');
      assert.equal(observedFilter.requesterId.toString(), volunteer._id.toString());

      ownsRequest = false;
      const unauthorizedUpdate = await patchJson(
        `/donation-requests/${request._id}`,
        { recipientName: 'Unauthorized Update' },
        token,
      );
      const unauthorizedDelete = await deleteWithToken(
        `/donation-requests/${request._id}`,
        token,
      );
      assert.equal(unauthorizedUpdate.status, 404);
      assert.equal(unauthorizedDelete.status, 404);
      assert.equal(request.recipientName, 'Updated Patient');
      assert.equal(request.deleted, undefined);

      ownsRequest = true;
      const deletion = await deleteWithToken(`/donation-requests/${request._id}`, token);
      assert.equal(deletion.status, 200);
      assert.equal(request.deleted, true);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOne = originalFindOne;
    }
  });

  it('lists only public pending requests and validates search filters', async () => {
    const originalFind = DonationRequest.find;
    const originalCountDocuments = DonationRequest.countDocuments;
    const request = {
      _id: new mongoose.Types.ObjectId(),
      recipientName: 'Patient Name',
      recipientDistrict: 'Dhaka',
      recipientUpazila: 'Savar',
      bloodGroup: 'O+',
      donationDate: '2027-01-15',
      donationTime: '10:30',
      status: 'pending',
      requesterEmail: 'private@example.com',
    };
    const observed = {};
    DonationRequest.find = (filter) => {
      observed.filter = filter;
      return {
        sort(sort) { observed.sort = sort; return this; },
        skip(skip) { observed.skip = skip; return this; },
        limit(limit) { observed.limit = limit; return this; },
        then(resolve, reject) { return Promise.resolve([request]).then(resolve, reject); },
      };
    };
    DonationRequest.countDocuments = async (filter) => {
      observed.countFilter = filter;
      return 1;
    };

    try {
      const response = await fetch(
        `${baseUrl}/donation-requests?bloodGroup=O%2B&district=Dhaka&upazila=Savar&page=2`,
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.deepEqual(observed.filter, {
        status: 'pending',
        bloodGroup: 'O+',
        recipientDistrict: 'Dhaka',
        recipientUpazila: 'Savar',
      });
      assert.deepEqual(observed.sort, { donationDate: 1, donationTime: 1 });
      assert.equal(observed.skip, 10);
      assert.equal(observed.limit, 10);
      assert.deepEqual(observed.countFilter, observed.filter);
      assert.deepEqual(body.requests[0], {
        id: request._id.toString(),
        recipientName: 'Patient Name',
        recipientDistrict: 'Dhaka',
        recipientUpazila: 'Savar',
        bloodGroup: 'O+',
        donationDate: '2027-01-15',
        donationTime: '10:30',
        status: 'pending',
      });
      assert.equal(Object.hasOwn(body.requests[0], 'requesterEmail'), false);

      const invalid = await fetch(`${baseUrl}/donation-requests?bloodGroup=unknown`);
      assert.equal(invalid.status, 400);
    } finally {
      DonationRequest.find = originalFind;
      DonationRequest.countDocuments = originalCountDocuments;
    }
  });

  it('requires authentication to see private request details', async () => {
    const originalFindById = User.findById;
    const originalFindOne = DonationRequest.findOne;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Viewing Donor',
      email: 'viewer@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: new mongoose.Types.ObjectId(),
      requesterName: 'Requesting Donor',
      requesterEmail: 'requester@example.com',
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let observedFilter;
    User.findById = () => ({ select: async () => user });
    DonationRequest.findOne = async (filter) => {
      observedFilter = filter;
      return request;
    };

    try {
      const unauthenticated = await fetch(`${baseUrl}/donation-requests/${request._id}`);
      assert.equal(unauthenticated.status, 401);

      const response = await fetch(`${baseUrl}/donation-requests/${request._id}`, {
        headers: { authorization: `Bearer ${createAuthToken(user._id)}` },
      });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.request.requesterName, request.requesterName);
      assert.deepEqual(observedFilter.$or[0], { status: 'pending' });
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOne = originalFindOne;
    }
  });

  it('allows volunteers to view any donation request from request management', async () => {
    const originalFindById = User.findById;
    const originalRequestFindById = DonationRequest.findById;
    const originalRequestFindOne = DonationRequest.findOne;
    const volunteer = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Request Volunteer',
      email: 'volunteer@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'volunteer',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: new mongoose.Types.ObjectId(),
      requesterName: 'Requesting Donor',
      requesterEmail: 'requester@example.com',
      donorId: new mongoose.Types.ObjectId(),
      donorName: 'Accepted Donor',
      donorEmail: 'accepted@example.com',
      ...requestDetails,
      status: 'inprogress',
      statusHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let lookedUpById;
    User.findById = () => ({ select: async () => volunteer });
    DonationRequest.findById = async (id) => {
      lookedUpById = id;
      return id.toString() === request._id.toString() ? request : null;
    };
    DonationRequest.findOne = async () => {
      throw new Error('Volunteer details must not use donor-only visibility filters.');
    };

    try {
      const response = await fetch(`${baseUrl}/donation-requests/${request._id}`, {
        headers: { authorization: `Bearer ${createAuthToken(volunteer._id)}` },
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(lookedUpById.toString(), request._id.toString());
      assert.equal(body.request.id, request._id.toString());
      assert.equal(body.request.status, 'inprogress');
      assert.equal(body.request.requesterEmail, request.requesterEmail);
      assert.equal(body.request.donorEmail, request.donorEmail);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findById = originalRequestFindById;
      DonationRequest.findOne = originalRequestFindOne;
    }
  });

  it('atomically confirms a pending request using authenticated donor identity', async () => {
    const originalFindById = User.findById;
    const originalFindOneAndUpdate = DonationRequest.findOneAndUpdate;
    const donor = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Verified Donor',
      email: 'verified@example.com',
      password: 'not-returned',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: new mongoose.Types.ObjectId(),
      requesterName: 'Requesting Donor',
      requesterEmail: 'requester@example.com',
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let observed;
    User.findById = () => ({ select: async () => donor });
    DonationRequest.findOneAndUpdate = async (filter, update, options) => {
      observed = { filter, update, options };
      Object.assign(request, update.$set, { donorId: donor._id });
      request.statusHistory = [update.$push.statusHistory];
      return request;
    };

    try {
      const response = await postJsonWithToken(
        `/donation-requests/${request._id}/donate`,
        { donorName: 'Spoofed Name', donorEmail: 'spoofed@example.com' },
        createAuthToken(donor._id),
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(observed.filter.status, 'pending');
      assert.deepEqual(observed.filter.requesterId, { $ne: donor._id });
      assert.deepEqual(observed.update.$set, {
        status: 'inprogress',
        donorId: donor._id,
        donorName: 'Verified Donor',
        donorEmail: 'verified@example.com',
      });
      assert.equal(observed.update.$push.statusHistory.status, 'inprogress');
      assert.deepEqual(observed.options, { new: true, runValidators: true });
      assert.equal(body.request.status, 'inprogress');
      assert.equal(body.request.statusHistory[0].status, 'inprogress');
      assert.equal(body.request.donorName, donor.name);
      assert.equal(body.request.donorEmail, donor.email);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOneAndUpdate = originalFindOneAndUpdate;
    }
  });

  it('rejects self-donation and concurrent attempts after a request is claimed', async () => {
    const originalFindById = User.findById;
    const originalFindOneAndUpdate = DonationRequest.findOneAndUpdate;
    const originalRequestFindById = DonationRequest.findById;
    const donor = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    let existingRequest = {
      requesterId: donor._id,
      status: 'pending',
      select() { return Promise.resolve(this); },
    };
    User.findById = () => ({ select: async () => donor });
    DonationRequest.findOneAndUpdate = async () => null;
    DonationRequest.findById = (id) => ({ select: async () => existingRequest });

    try {
      const token = createAuthToken(donor._id);
      const selfDonation = await postJsonWithToken(
        `/donation-requests/${new mongoose.Types.ObjectId()}/donate`,
        {},
        token,
      );
      assert.equal(selfDonation.status, 403);

      existingRequest = {
        requesterId: new mongoose.Types.ObjectId(),
        status: 'inprogress',
        select() { return Promise.resolve(this); },
      };
      const conflict = await postJsonWithToken(
        `/donation-requests/${new mongoose.Types.ObjectId()}/donate`,
        {},
        token,
      );
      assert.equal(conflict.status, 409);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOneAndUpdate = originalFindOneAndUpdate;
      DonationRequest.findById = originalRequestFindById;
    }
  });

  it('returns owner request details only to the requesting user', async () => {
    const originalFindById = User.findById;
    const originalFindOne = DonationRequest.findOne;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let observedFilter;
    User.findById = () => ({ select: async () => user });
    DonationRequest.findOne = async (filter) => {
      observedFilter = filter;
      return request;
    };

    try {
      const token = createAuthToken(user._id);
      const response = await fetch(
        `${baseUrl}/donation-requests/mine/${request._id}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.request.id, request._id.toString());
      assert.equal(observedFilter.requesterId.toString(), user._id.toString());

      DonationRequest.findOne = async () => null;
      const notOwned = await fetch(
        `${baseUrl}/donation-requests/mine/${request._id}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(notOwned.status, 404);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOne = originalFindOne;
    }
  });

  it('rejects invalid edits and prevents editing non-pending or another user request', async () => {
    const originalFindById = User.findById;
    const originalFindOne = DonationRequest.findOne;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      ...requestDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      set(values) { Object.assign(this, values); },
      async save() { return this; },
    };
    User.findById = () => ({ select: async () => user });
    DonationRequest.findOne = async () => request;

    try {
      const token = createAuthToken(user._id);
      const invalid = await patchJson(
        `/donation-requests/${request._id}`,
        { bloodGroup: 'invalid' },
        token,
      );
      assert.equal(invalid.status, 400);
      request.status = 'inprogress';
      const nonPending = await patchJson(
        `/donation-requests/${request._id}`,
        { recipientName: 'Updated Patient' },
        token,
      );
      assert.equal(nonPending.status, 409);

      DonationRequest.findOne = async () => null;
      const notOwned = await patchJson(
        `/donation-requests/${request._id}`,
        { recipientName: 'Updated Patient' },
        token,
      );
      const invalidId = await patchJson(
        '/donation-requests/not-an-id',
        { recipientName: 'Updated Patient' },
        token,
      );

      assert.equal(notOwned.status, 404);
      assert.equal(invalidId.status, 404);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOne = originalFindOne;
    }
  });

  it('deletes only an owned request after the caller confirms', async () => {
    const originalFindById = User.findById;
    const originalFindOne = DonationRequest.findOne;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    let deleted = false;
    let observedFilter;
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: user._id,
      async deleteOne() { deleted = true; },
    };
    User.findById = () => ({ select: async () => user });
    DonationRequest.findOne = async (filter) => {
      observedFilter = filter;
      return request;
    };

    try {
      const response = await deleteWithToken(
        `/donation-requests/${request._id}`,
        createAuthToken(user._id),
      );

      assert.equal(response.status, 200);
      assert.equal(deleted, true);
      assert.equal(observedFilter.requesterId.toString(), user._id.toString());
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOne = originalFindOne;
    }
  });

  it('allows only in-progress requests to transition to done or canceled', async () => {
    const originalFindById = User.findById;
    const originalFindOne = DonationRequest.findOne;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Requesting Donor',
      email: 'requester@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'donor',
      status: 'active',
    });
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: user._id,
      requesterName: user.name,
      requesterEmail: user.email,
      ...requestDetails,
      status: 'inprogress',
      createdAt: new Date(),
      updatedAt: new Date(),
      async save() { return this; },
    };
    User.findById = () => ({ select: async () => user });
    DonationRequest.findOne = async () => request;

    try {
      const token = createAuthToken(user._id);
      const complete = await patchJson(
        `/donation-requests/${request._id}/status`,
        { status: 'done' },
        token,
      );
      assert.equal(complete.status, 200);
      assert.equal(request.status, 'done');

      request.status = 'inprogress';
      const cancel = await patchJson(
        `/donation-requests/${request._id}/status`,
        { status: 'canceled' },
        token,
      );
      assert.equal(cancel.status, 200);
      assert.equal(request.status, 'canceled');

      const pendingRequest = { ...request, status: 'pending' };
      DonationRequest.findOne = async () => pendingRequest;
      const invalidTransition = await patchJson(
        `/donation-requests/${request._id}/status`,
        { status: 'canceled' },
        token,
      );
      const validButDisallowedTransition = await patchJson(
        `/donation-requests/${request._id}/status`,
        { status: 'pending' },
        token,
      );
      assert.equal(invalidTransition.status, 409);
      assert.equal(validButDisallowedTransition.status, 409);
      const invalidStatus = await patchJson(
        `/donation-requests/${request._id}/status`,
        { status: 'unknown' },
        token,
      );
      assert.equal(invalidStatus.status, 400);
      assert.equal(pendingRequest.status, 'pending');
    } finally {
      User.findById = originalFindById;
      DonationRequest.findOne = originalFindOne;
    }
  });

  it('allows volunteers to set any valid request status', async () => {
    const originalFindById = User.findById;
    const originalRequestFindById = DonationRequest.findById;
    const volunteer = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Volunteer',
      email: 'volunteer@example.com',
      password: 'not-returned',
      bloodGroup: 'A+',
      district: 'Dhaka',
      upazila: 'Savar',
      role: 'volunteer',
      status: 'active',
    });
    volunteer.role = ' Volunteer ';
    const request = {
      _id: new mongoose.Types.ObjectId(),
      requesterId: new mongoose.Types.ObjectId(),
      requesterName: 'Requesting Donor',
      requesterEmail: 'requester@example.com',
      ...requestDetails,
      donorId: new mongoose.Types.ObjectId(),
      donorName: 'Volunteer Donor',
      donorEmail: 'donor@example.com',
      status: 'inprogress',
      createdAt: new Date(),
      updatedAt: new Date(),
      async save() { return this; },
    };
    User.findById = () => ({ select: async () => volunteer });
    DonationRequest.findById = async () => request;

    try {
      const token = createAuthToken(volunteer._id);
      for (const status of ['pending', 'inprogress', 'done', 'canceled']) {
        const response = await patchJson(
          `/donation-requests/${request._id}/status`,
          { status },
          token,
        );
        assert.equal(response.status, 200);
        assert.equal(request.status, status);
        if (status === 'pending') {
          assert.equal(request.donorId, null);
          assert.equal(request.donorName, '');
          assert.equal(request.donorEmail, '');
        }
      }

      const invalid = await patchJson(
        `/donation-requests/${request._id}/status`,
        { status: 'unknown' },
        token,
      );
      assert.equal(invalid.status, 400);
    } finally {
      User.findById = originalFindById;
      DonationRequest.findById = originalRequestFindById;
    }
  });

  it('allows admins to set any valid request status', async () => {
    const originalFindById = User.findById;
    const originalRequestFindById = DonationRequest.findById;
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
      ...requestDetails,
      donorId: new mongoose.Types.ObjectId(),
      donorName: 'Confirmed Donor',
      donorEmail: 'donor@example.com',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      async save() { return this; },
    };
    User.findById = () => ({ select: async () => admin });
    DonationRequest.findById = async () => request;

    try {
      const token = createAuthToken(admin._id);
      for (const status of ['inprogress', 'done', 'canceled', 'pending']) {
        const response = await patchJson(
          `/donation-requests/${request._id}/status`,
          { status },
          token,
        );
        assert.equal(response.status, 200);
        assert.equal(request.status, status);
        if (status === 'pending') {
          assert.equal(request.donorId, null);
          assert.equal(request.donorName, '');
          assert.equal(request.donorEmail, '');
        }
      }
    } finally {
      User.findById = originalFindById;
      DonationRequest.findById = originalRequestFindById;
    }
  });
});

describe('authentication API validation', () => {
  it('accepts only HTTPS Google-hosted profile picture URLs', () => {
    assert.equal(
      getGoogleProfilePictureUrl('https://lh3.googleusercontent.com/a/test-photo'),
      'https://lh3.googleusercontent.com/a/test-photo',
    );
    assert.equal(getGoogleProfilePictureUrl('http://lh3.googleusercontent.com/test-photo'), '');
    assert.equal(getGoogleProfilePictureUrl('https://example.com/photo.png'), '');
    assert.equal(getGoogleProfilePictureUrl('https://googleusercontent.com.evil.example/photo.png'), '');
  });

  it('rejects an avatar upload without an image file', async () => {
    const response = await postJson('/auth/avatar', {});

    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /PNG, JPEG, or WebP/i);
  });

  it('rejects invalid registration data before accessing the database', async () => {
    const response = await postJson('/auth/register', {
      email: 'not-an-email',
      password: 'short',
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /name/i);
  });

  it('rejects a registration when password confirmation does not match', async () => {
    const response = await postJson('/auth/register', {
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'Secure-password-123',
      confirmPassword: 'Different-password-123',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /confirmation/i);
  });

  it('rejects a registration when the password lacks complexity', async () => {
    const response = await postJson('/auth/register', {
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /uppercase and lowercase letters/i);
  });

  it('rejects malformed login data', async () => {
    const response = await postJson('/auth/login', {
      email: 'invalid',
      password: '',
    });

    assert.equal(response.status, 400);
  });

  it('requires a Firebase Google credential for Google login', async () => {
    const response = await postJson('/auth/google', {});
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.message, /Google sign-in credential/i);
  });

  it('rejects malformed Firebase credentials for Google login', async () => {
    const response = await postJson('/auth/google', { idToken: 'not-a-valid-firebase-token' });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.match(body.message, /Google sign-in could not be verified/i);
  });

  it('does not allow password login for Google-only accounts', async () => {
    const originalFindOne = User.findOne;
    User.findOne = () => ({
      select: async () => ({ password: undefined }),
    });

    try {
      const response = await postJson('/auth/login', {
        email: 'google@example.com',
        password: 'AnyPassword123!',
      });

      assert.equal(response.status, 401);
    } finally {
      User.findOne = originalFindOne;
    }
  });

  it('creates a donor account, hashes its password, and returns a JWT', async () => {
    const originalExists = User.exists;
    const originalCreate = User.create;
    let createdData;

    User.exists = async () => null;
    User.create = async (data) => {
      createdData = data;
      return new User({
        ...data,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    };

    try {
      const response = await postJson('/auth/register', {
        name: 'Test Donor',
        email: ' DONOR@example.com ',
        password: 'Secure-password-123',
        confirm_password: 'Secure-password-123',
        bloodGroup: 'O+',
        district: 'Dhaka',
        upazila: 'Dhanmondi',
        role: 'admin',
        status: 'blocked',
      });
      const body = await response.json();

      assert.equal(response.status, 201);
      assert.equal(body.user.email, 'donor@example.com');
      assert.equal(body.user.role, 'donor');
      assert.equal(body.user.status, 'active');
      assert.equal(Object.hasOwn(body.user, 'password'), false);
      assert.notEqual(createdData.password, 'Secure-password-123');
      assert.equal(await bcrypt.compare('Secure-password-123', createdData.password), true);
      assert.equal(verifyAuthToken(body.token).sub, body.user.id);
    } finally {
      User.exists = originalExists;
      User.create = originalCreate;
    }
  });

  it('authenticates an active user and returns a signed token', async () => {
    const originalFindOne = User.findOne;
    const password = 'secure-password';
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Donor',
      email: 'donor@example.com',
      password: await bcrypt.hash(password, 4),
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      role: 'donor',
      status: 'active',
    });

    User.findOne = () => ({ select: async () => user });

    try {
      const response = await postJson('/auth/login', {
        email: ' DONOR@example.com ',
        password,
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.user.id, user._id.toString());
      assert.equal(verifyAuthToken(body.token).sub, user._id.toString());
      assert.equal(Object.hasOwn(body.user, 'password'), false);
    } finally {
      User.findOne = originalFindOne;
    }
  });

  it('returns the authenticated profile from the protected current-user endpoint', async () => {
    const originalFindById = User.findById;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'not-returned',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      role: 'donor',
      status: 'active',
    });
    User.findById = () => ({ select: async () => user });

    try {
      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: { authorization: `Bearer ${createAuthToken(user._id)}` },
      });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.user.id, user._id.toString());
      assert.equal(body.user.isAvailable, true);
      assert.equal(body.user.nextAvailableDate, '');
      assert.equal(body.user.phone, '');
      assert.equal(Object.hasOwn(body.user, 'password'), false);
    } finally {
      User.findById = originalFindById;
    }
  });

  it('updates only the authenticated user profile with validated fields', async () => {
    const originalFindById = User.findById;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'not-returned',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      role: 'donor',
      status: 'active',
    });
    user.save = async function save() { return this; };
    User.findById = () => ({ select: async () => user });

    try {
      const response = await patchJson('/auth/me', {
        name: ' Updated Donor ',
        avatar: 'https://i.ibb.co/example/avatar.png',
        bloodGroup: 'B+',
        district: 'Chattogram',
        upazila: 'Pahartali',
        isAvailable: false,
        nextAvailableDate: '2030-04-15',
        phone: '01712345678',
      }, createAuthToken(user._id));
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.user.name, 'Updated Donor');
      assert.equal(body.user.avatar, 'https://i.ibb.co/example/avatar.png');
      assert.equal(body.user.bloodGroup, 'B+');
      assert.equal(body.user.district, 'Chattogram');
      assert.equal(body.user.upazila, 'Pahartali');
      assert.equal(body.user.isAvailable, false);
      assert.equal(body.user.nextAvailableDate, '2030-04-15');
      assert.equal(body.user.phone, '+8801712345678');
      assert.equal(body.user.email, 'donor@example.com');
      assert.equal(body.user.role, 'donor');
      assert.equal(body.user.status, 'active');
      assert.equal(Object.hasOwn(body.user, 'password'), false);
    } finally {
      User.findById = originalFindById;
    }
  });

  it('rejects invalid profile data and attempts to change protected account fields', async () => {
    const originalFindById = User.findById;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Donor',
      email: 'donor@example.com',
      password: 'not-returned',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      role: 'donor',
      status: 'active',
    });
    user.save = async function save() { return this; };
    User.findById = () => ({ select: async () => user });
    const token = createAuthToken(user._id);

    try {
      const invalid = await patchJson('/auth/me', { name: 'A' }, token);
      const invalidDate = await patchJson('/auth/me', { nextAvailableDate: '2030-02-31' }, token);
      const invalidAvailability = await patchJson('/auth/me', { isAvailable: 'true' }, token);
      const invalidPhone = await patchJson('/auth/me', { phone: '12345' }, token);
      assert.equal(invalid.status, 400);
      assert.match((await invalid.json()).message, /name/i);
      assert.equal(invalidDate.status, 400);
      assert.equal(invalidAvailability.status, 400);
      assert.equal(invalidPhone.status, 400);

      user.role = 'volunteer';
      const nonDonorAvailability = await patchJson('/auth/me', { isAvailable: false }, token);
      const nonDonorPhone = await patchJson('/auth/me', { phone: '01712345678' }, token);
      user.role = 'donor';
      assert.equal(nonDonorAvailability.status, 403);
      assert.equal(nonDonorPhone.status, 403);

      const protectedField = await patchJson('/auth/me', { role: 'admin' }, token);
      assert.equal(protectedField.status, 400);
      assert.match((await protectedField.json()).message, /only/i);
      assert.equal(user.role, 'donor');
    } finally {
      User.findById = originalFindById;
    }
  });

  it('rejects blocked accounts on protected endpoints', async () => {
    const originalFindById = User.findById;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      name: 'Blocked Donor',
      email: 'blocked@example.com',
      password: 'not-returned',
      bloodGroup: 'O+',
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      role: 'donor',
      status: 'blocked',
    });
    User.findById = () => ({ select: async () => user });

    try {
      const response = await fetch(`${baseUrl}/auth/me`, {
        headers: { authorization: `Bearer ${createAuthToken(user._id)}` },
      });

      assert.equal(response.status, 403);
    } finally {
      User.findById = originalFindById;
    }
  });

  it('validates uploaded image content and securely forwards PNG images to ImageBB', async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleWarn = console.warn;
    const originalApiKey = process.env.IMGBB_API_KEY;
    const forwardedRequest = {};
    let uploadResult = Response.json({
      success: true,
      data: { url: 'https://i.ibb.co/example/avatar.png' },
    });
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
    process.env.IMGBB_API_KEY = 'test-key-not-for-production';
    globalThis.fetch = async (url, options) => {
      forwardedRequest.url = url;
      forwardedRequest.options = options;
      return uploadResult;
    };

    const responseBody = {};
    const response = {
      status(status) {
        responseBody.status = status;
        return this;
      },
      json(body) {
        responseBody.body = body;
        return this;
      },
    };

    try {
      delete process.env.IMGBB_API_KEY;
      await uploadAvatar({ file: { buffer: png } }, response, (error) => {
        throw error;
      });
      assert.equal(responseBody.status, 503);

      process.env.IMGBB_API_KEY = 'test-key-not-for-production';
      responseBody.status = undefined;
      responseBody.body = undefined;
      await uploadAvatar({ file: { buffer: png } }, response, (error) => {
        throw error;
      });

      assert.equal(responseBody.status, 200);
      assert.equal(responseBody.body.avatar, 'https://i.ibb.co/example/avatar.png');
      assert.match(forwardedRequest.url, /api\.imgbb\.com\/1\/upload/);
      assert.match(forwardedRequest.url, /\?key=test-key-not-for-production$/);
      assert.equal(forwardedRequest.options.method, 'POST');
      assert.equal(forwardedRequest.options.body instanceof FormData, true);

      uploadResult = Response.json({
        success: false,
        error: {
          code: 400,
          message: 'Rejected key test-key-not-for-production',
        },
      }, { status: 400 });
      let diagnostic;
      console.warn = (...args) => { diagnostic = args; };
      responseBody.status = undefined;
      responseBody.body = undefined;
      await uploadAvatar({ file: { buffer: png } }, response, (error) => {
        throw error;
      });
      console.warn = originalConsoleWarn;
      assert.equal(responseBody.status, 502);
      assert.deepEqual(diagnostic, [
        'ImgBB avatar upload rejected',
        {
          status: 400,
          errorCode: 400,
          message: 'Rejected key [redacted]',
        },
      ]);
      assert.equal(JSON.stringify(diagnostic).includes('test-key-not-for-production'), false);

      responseBody.status = undefined;
      responseBody.body = undefined;
      await uploadAvatar({ file: { buffer: Buffer.from('not an image') } }, response, (error) => {
        throw error;
      });
      assert.equal(responseBody.status, 400);
    } finally {
      globalThis.fetch = originalFetch;
      console.warn = originalConsoleWarn;
      if (originalApiKey === undefined) delete process.env.IMGBB_API_KEY;
      else process.env.IMGBB_API_KEY = originalApiKey;
    }
  });

  it('denies access when a user role is not allowed', () => {
    let responseStatus;
    let responseBody;
    const response = {
      status(status) {
        responseStatus = status;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    };

    authorizeRoles('admin')({ user: { role: 'donor' } }, response, () => {
      assert.fail('A donor must not pass the admin role check.');
    });

    assert.equal(responseStatus, 403);
    assert.match(responseBody.message, /permission/i);
  });

  it('matches authorized roles without case or surrounding whitespace differences', () => {
    let nextCalled = false;
    const response = {
      status() {
        assert.fail('A volunteer role should be allowed.');
      },
      json() {
        assert.fail('A volunteer role should be allowed.');
      },
    };

    authorizeRoles('volunteer', 'admin')(
      { user: { role: ' Volunteer ' } },
      response,
      () => {
        nextCalled = true;
      },
    );

    assert.equal(nextCalled, true);
  });

  it('protects the current-user endpoint when no token is provided', async () => {
    const response = await fetch(`${baseUrl}/auth/me`);
    const profileUpdate = await fetch(`${baseUrl}/auth/me`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Untrusted Update' }),
    });

    assert.equal(response.status, 401);
    assert.equal(profileUpdate.status, 401);
  });

  it('rejects an invalid bearer token', async () => {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { authorization: 'Bearer invalid-token' },
    });

    assert.equal(response.status, 401);
  });
});
