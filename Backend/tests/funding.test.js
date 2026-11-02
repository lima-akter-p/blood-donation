import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, it } from 'node:test';
import mongoose from 'mongoose';
import Funding from '../models/funding.model.js';
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

function setGatewayEnvironment() {
  process.env.SSLCOMMERZ_STORE_ID = 'test-store';
  process.env.SSLCOMMERZ_STORE_PASSWORD = 'test-password-not-for-production';
  process.env.SSLCOMMERZ_IS_LIVE = 'false';
  process.env.API_PUBLIC_URL = 'https://api.example.test';
  process.env.CLIENT_URL = 'https://lifedrop.example.test';
}

async function postJson(path, body, token) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function postForm(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
}

it('creates hosted BDT checkout using server amount and verifies payment before recording it', async () => {
  const originalEnvironment = {
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
    live: process.env.SSLCOMMERZ_IS_LIVE,
    apiUrl: process.env.API_PUBLIC_URL,
    clientUrl: process.env.CLIENT_URL,
  };
  const originalUserFindById = User.findById;
  const originalFundingCreate = Funding.create;
  const originalFundingFindOne = Funding.findOne;
  const originalFundingUpdateOne = Funding.updateOne;
  const originalFetch = globalThis.fetch;
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Funding Donor',
    email: 'funding@example.com',
    password: 'not-returned',
    bloodGroup: 'O+',
    district: 'Dhaka',
    upazila: 'Savar',
    role: 'donor',
    status: 'active',
  });
  let funding;
  let submittedForm;
  let verifiedUpdate;
  let gatewayAmount = '250.50';
  setGatewayEnvironment();
  User.findById = () => ({ select: async () => user });
  Funding.create = async (details) => {
    funding = {
      _id: new mongoose.Types.ObjectId(),
      ...details,
    };
    return funding;
  };
  Funding.findOne = async ({ tranId }) => (tranId === funding.tranId ? funding : null);
  Funding.updateOne = async (filter, update) => {
    verifiedUpdate = { filter, update };
    Object.assign(funding, update.$set);
    return { modifiedCount: 1 };
  };
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).startsWith(baseUrl)) {
      return originalFetch(url, options);
    }
    if (String(url).includes('/gwprocess/v4/api.php')) {
      submittedForm = new URLSearchParams(options.body);
      return Response.json({
        status: 'SUCCESS',
        GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=abc',
      });
    }
    if (String(url).includes('/validator/api/validationserverAPI.php')) {
      return Response.json({
        status: 'VALID',
        tran_id: funding.tranId,
        amount: gatewayAmount,
        currency: 'BDT',
        bank_tran_id: 'bank-transaction-1',
        risk_level: '0',
      });
    }
    throw new Error('Unexpected mocked gateway URL.');
  };

  try {
    const token = createAuthToken(user._id);
    const checkout = await postJson('/funding/checkout', { amount: '250.50', phone: '01712345678' }, token);
    const checkoutBody = await checkout.json();
    assert.equal(checkout.status, 201);
    assert.equal(checkoutBody.checkoutUrl, 'https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=abc');
    assert.equal(funding.amountPaisa, 25050);
    assert.equal(funding.currency, 'BDT');
    assert.equal(funding.status, 'pending');
    assert.equal(submittedForm.get('total_amount'), '250.50');
    assert.equal(submittedForm.get('currency'), 'BDT');
    assert.equal(submittedForm.get('cus_phone'), '+8801712345678');
    assert.equal(submittedForm.get('store_passwd'), 'test-password-not-for-production');
    assert.equal(checkoutBody.storePassword, undefined);

    gatewayAmount = '250.49';
    const invalidCallback = await postForm('/funding/ipn', {
      tran_id: funding.tranId,
      val_id: 'invalid-gateway-validation-id',
      amount: '250.50',
      currency: 'BDT',
    });
    assert.equal(invalidCallback.status, 500);
    assert.equal(funding.status, 'pending');
    assert.equal(verifiedUpdate, undefined);

    gatewayAmount = '250.50';
    const callback = await postForm('/funding/ipn', {
      tran_id: funding.tranId,
      val_id: 'gateway-validation-id',
      amount: '0.01',
      currency: 'USD',
    });
    assert.equal(callback.status, 200);
    assert.equal(verifiedUpdate.filter._id, funding._id);
    assert.equal(funding.status, 'paid');
    assert.equal(funding.valId, 'gateway-validation-id');
    assert.equal(funding.bankTranId, 'bank-transaction-1');
    assert.ok(funding.paidAt instanceof Date);
  } finally {
    User.findById = originalUserFindById;
    Funding.create = originalFundingCreate;
    Funding.findOne = originalFundingFindOne;
    Funding.updateOne = originalFundingUpdateOne;
    globalThis.fetch = originalFetch;
    if (originalEnvironment.storeId === undefined) delete process.env.SSLCOMMERZ_STORE_ID;
    else process.env.SSLCOMMERZ_STORE_ID = originalEnvironment.storeId;
    if (originalEnvironment.storePassword === undefined) delete process.env.SSLCOMMERZ_STORE_PASSWORD;
    else process.env.SSLCOMMERZ_STORE_PASSWORD = originalEnvironment.storePassword;
    if (originalEnvironment.live === undefined) delete process.env.SSLCOMMERZ_IS_LIVE;
    else process.env.SSLCOMMERZ_IS_LIVE = originalEnvironment.live;
    if (originalEnvironment.apiUrl === undefined) delete process.env.API_PUBLIC_URL;
    else process.env.API_PUBLIC_URL = originalEnvironment.apiUrl;
    if (originalEnvironment.clientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = originalEnvironment.clientUrl;
  }
});

it('rejects invalid funding amounts and denies unauthenticated checkout', async () => {
  const originalEnvironment = {
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
    live: process.env.SSLCOMMERZ_IS_LIVE,
    apiUrl: process.env.API_PUBLIC_URL,
    clientUrl: process.env.CLIENT_URL,
  };
  const originalUserFindById = User.findById;
  const originalFundingCreate = Funding.create;
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Funding Donor',
    email: 'funding@example.com',
    password: 'not-returned',
    bloodGroup: 'O+',
    district: 'Dhaka',
    upazila: 'Savar',
    role: 'donor',
    status: 'active',
  });
  let createCalls = 0;
  setGatewayEnvironment();
  User.findById = () => ({ select: async () => user });
  Funding.create = async () => { createCalls += 1; };

  try {
    const token = createAuthToken(user._id);
    const underMinimum = await postJson('/funding/checkout', { amount: '9.99', phone: '01712345678' }, token);
    const tooPrecise = await postJson('/funding/checkout', { amount: '10.001', phone: '01712345678' }, token);
    const badPhone = await postJson('/funding/checkout', { amount: '10', phone: '00000000000' }, token);
    const noToken = await postJson('/funding/checkout', { amount: '10', phone: '01712345678' });

    assert.equal(underMinimum.status, 400);
    assert.equal(tooPrecise.status, 400);
    assert.equal(badPhone.status, 400);
    assert.equal(noToken.status, 401);
    assert.equal(createCalls, 0);
  } finally {
    User.findById = originalUserFindById;
    Funding.create = originalFundingCreate;
    if (originalEnvironment.storeId === undefined) delete process.env.SSLCOMMERZ_STORE_ID;
    else process.env.SSLCOMMERZ_STORE_ID = originalEnvironment.storeId;
    if (originalEnvironment.storePassword === undefined) delete process.env.SSLCOMMERZ_STORE_PASSWORD;
    else process.env.SSLCOMMERZ_STORE_PASSWORD = originalEnvironment.storePassword;
    if (originalEnvironment.live === undefined) delete process.env.SSLCOMMERZ_IS_LIVE;
    else process.env.SSLCOMMERZ_IS_LIVE = originalEnvironment.live;
    if (originalEnvironment.apiUrl === undefined) delete process.env.API_PUBLIC_URL;
    else process.env.API_PUBLIC_URL = originalEnvironment.apiUrl;
    if (originalEnvironment.clientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = originalEnvironment.clientUrl;
  }
});

it('lists only verified BDT contributions and returns the verified total', async () => {
  const originalEnvironment = {
    storeId: process.env.SSLCOMMERZ_STORE_ID,
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
    live: process.env.SSLCOMMERZ_IS_LIVE,
    apiUrl: process.env.API_PUBLIC_URL,
    clientUrl: process.env.CLIENT_URL,
  };
  const originalUserFindById = User.findById;
  const originalFundingFind = Funding.find;
  const originalFundingCountDocuments = Funding.countDocuments;
  const originalFundingAggregate = Funding.aggregate;
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: 'Funding Viewer',
    email: 'viewer@example.com',
    password: 'not-returned',
    bloodGroup: 'A+',
    district: 'Dhaka',
    upazila: 'Savar',
    role: 'volunteer',
    status: 'active',
  });
  const paid = {
    _id: new mongoose.Types.ObjectId(),
    donorName: 'Verified Contributor',
    amountPaisa: 25050,
    currency: 'BDT',
    paidAt: new Date('2026-10-31T12:00:00.000Z'),
  };
  const observed = {};
  setGatewayEnvironment();
  User.findById = () => ({ select: async () => user });
  Funding.find = (filter) => {
    observed.filter = filter;
    return {
      sort(sort) { observed.sort = sort; return this; },
      skip(skip) { observed.skip = skip; return this; },
      limit(limit) { observed.limit = limit; return this; },
      then(resolve, reject) { return Promise.resolve([paid]).then(resolve, reject); },
    };
  };
  Funding.countDocuments = async (filter) => {
    observed.countFilter = filter;
    return 11;
  };
  Funding.aggregate = async (pipeline) => {
    observed.pipeline = pipeline;
    return [{ totalAmountPaisa: 150050 }];
  };

  try {
    const token = createAuthToken(user._id);
    const headers = { authorization: `Bearer ${token}` };
    const historyResponse = await fetch(`${baseUrl}/funding?page=2`, { headers });
    const history = await historyResponse.json();
    assert.equal(historyResponse.status, 200);
    assert.deepEqual(observed.filter, { status: 'paid' });
    assert.deepEqual(observed.countFilter, { status: 'paid' });
    assert.deepEqual(observed.sort, { paidAt: -1 });
    assert.equal(observed.skip, 10);
    assert.equal(observed.limit, 10);
    assert.equal(history.fundings[0].donorName, 'Verified Contributor');
    assert.equal(history.fundings[0].amount, 250.5);
    assert.deepEqual(history.pagination, { page: 2, pageSize: 10, total: 11, totalPages: 2 });

    const summaryResponse = await fetch(`${baseUrl}/funding/summary`, { headers });
    const summary = await summaryResponse.json();
    assert.equal(summaryResponse.status, 200);
    assert.deepEqual(summary, { totalFunding: 1500.5, currency: 'BDT' });

    const unauthenticated = await fetch(`${baseUrl}/funding`);
    assert.equal(unauthenticated.status, 401);
  } finally {
    User.findById = originalUserFindById;
    Funding.find = originalFundingFind;
    Funding.countDocuments = originalFundingCountDocuments;
    Funding.aggregate = originalFundingAggregate;
    if (originalEnvironment.storeId === undefined) delete process.env.SSLCOMMERZ_STORE_ID;
    else process.env.SSLCOMMERZ_STORE_ID = originalEnvironment.storeId;
    if (originalEnvironment.storePassword === undefined) delete process.env.SSLCOMMERZ_STORE_PASSWORD;
    else process.env.SSLCOMMERZ_STORE_PASSWORD = originalEnvironment.storePassword;
    if (originalEnvironment.live === undefined) delete process.env.SSLCOMMERZ_IS_LIVE;
    else process.env.SSLCOMMERZ_IS_LIVE = originalEnvironment.live;
    if (originalEnvironment.apiUrl === undefined) delete process.env.API_PUBLIC_URL;
    else process.env.API_PUBLIC_URL = originalEnvironment.apiUrl;
    if (originalEnvironment.clientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = originalEnvironment.clientUrl;
  }
});
