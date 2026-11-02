import User, { BLOOD_GROUPS } from '../models/user.model.js';
import DonationRequest, { DONATION_STATUSES } from '../models/donationRequest.model.js';
import Funding from '../models/funding.model.js';
import mongoose from 'mongoose';
import { sendDonationStatusEmails } from '../utils/email.js';
import Notification from '../models/notification.model.js';

const PAGE_SIZE = 10;
const MAX_PAGE = 100000;

function validateCreateRequest(body = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Submit donation request details as a JSON object.' };
  }

  const fields = {
    recipientName: [2, 80],
    recipientDistrict: [1, 100],
    recipientUpazila: [1, 100],
    hospitalName: [2, 160],
    fullAddress: [2, 240],
    requestMessage: [2, 1000],
  };
  const values = {};

  for (const [field, [minimum, maximum]] of Object.entries(fields)) {
    const value = typeof body[field] === 'string' ? body[field].trim() : '';
    if (value.length < minimum || value.length > maximum) {
      return { error: `${field} must be between ${minimum} and ${maximum} characters.` };
    }
    values[field] = value;
  }

  if (!BLOOD_GROUPS.includes(body.bloodGroup)) {
    return { error: 'Select a valid blood group.' };
  }
  values.bloodGroup = body.bloodGroup;

  if (
    typeof body.donationDate !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(body.donationDate)
    || Number.isNaN(Date.parse(`${body.donationDate}T00:00:00.000Z`))
    || new Date(`${body.donationDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== body.donationDate
  ) {
    return { error: 'Enter a valid donation date.' };
  }
  values.donationDate = body.donationDate;

  if (typeof body.donationTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.donationTime)) {
    return { error: 'Enter a valid donation time.' };
  }
  values.donationTime = body.donationTime;

  return { value: values };
}

function serializeRequest(request) {
  return {
    id: request._id.toString(),
    requesterId: request.requesterId.toString(),
    requesterName: request.requesterName,
    requesterEmail: request.requesterEmail,
    donorId: request.donorId?.toString() || '',
    donorName: request.donorName || '',
    donorEmail: request.donorEmail || '',
    recipientName: request.recipientName,
    recipientDistrict: request.recipientDistrict,
    recipientUpazila: request.recipientUpazila,
    hospitalName: request.hospitalName,
    fullAddress: request.fullAddress,
    bloodGroup: request.bloodGroup,
    donationDate: request.donationDate,
    donationTime: request.donationTime,
    requestMessage: request.requestMessage,
    status: request.status,
    statusHistory: (request.statusHistory || []).map((entry) => ({
      status: entry.status,
      changedById: entry.changedById?.toString() || '',
      changedByName: entry.changedByName || '',
      changedAt: entry.changedAt,
    })),
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

async function notifyRequestStatus(request, actor, previousDonor = {}) {
  const notificationRecipients = [
    request.requesterId,
    request.donorId,
    previousDonor.id,
  ]
    .filter((recipientId) => recipientId && recipientId.toString() !== actor._id.toString());
  const recipientIds = [...new Set(notificationRecipients.map((id) => id.toString()))];
  const statusLabel = request.status === 'inprogress'
    ? 'in progress'
    : request.status;
  const title = `Donation request ${statusLabel}`;
  const message = `The request for ${request.recipientName} is now ${statusLabel}.`;

  if (recipientIds.length > 0) {
    await Notification.insertMany(recipientIds.map((recipientId) => ({
      recipientId,
      requestId: request._id,
      title,
      message,
      status: request.status,
    })));
  }

  const recipients = [
    request.requesterEmail,
    request.donorEmail,
    previousDonor.email,
  ].filter((email) => email && email.toLowerCase() !== actor.email.toLowerCase());
  const uniqueRecipients = [...new Set(recipients)];
  return sendDonationStatusEmails({
    recipients: uniqueRecipients,
    subject: `LifeDrop donation request: ${statusLabel}`,
    text: [
      `Hello,`,
      '',
      `The donation request for ${request.recipientName} has been updated to "${statusLabel}".`,
      `Blood group: ${request.bloodGroup}`,
      `Location: ${request.recipientUpazila}, ${request.recipientDistrict}`,
      '',
      `Updated by: ${actor.name}`,
      '',
      'Sign in to LifeDrop to view the request and its status history.',
    ].join('\n'),
  });
}

function getUserRole(user) {
  return typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';
}

function validatePendingSearch(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    return { error: 'Page must be a positive whole number.' };
  }
  if (query.bloodGroup !== undefined && !BLOOD_GROUPS.includes(query.bloodGroup)) {
    return { error: 'Select a valid blood group filter.' };
  }
  for (const field of ['district', 'upazila']) {
    if (query[field] !== undefined && (
      typeof query[field] !== 'string'
      || query[field].trim().length === 0
      || query[field].trim().length > 100
    )) {
      return { error: `Enter a valid ${field} filter.` };
    }
  }
  return { value: { page } };
}

function findOwnedRequest(id, requesterId) {
  if (!mongoose.isValidObjectId(id)) return null;
  return DonationRequest.findOne({ _id: id, requesterId });
}

function getUpdateValues(body, currentRequest) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Submit donation request details as a JSON object.' };
  }
  const allowedFields = [
    'recipientName',
    'recipientDistrict',
    'recipientUpazila',
    'hospitalName',
    'fullAddress',
    'bloodGroup',
    'donationDate',
    'donationTime',
    'requestMessage',
  ];
  const fields = Object.keys(body);
  if (fields.length === 0 || fields.some((field) => !allowedFields.includes(field))) {
    return { error: 'Update only recipient, location, hospital, date, time, blood group, or message fields.' };
  }

  const candidate = Object.fromEntries(
    allowedFields.map((field) => [field, Object.hasOwn(body, field) ? body[field] : currentRequest[field]]),
  );
  const validation = validateCreateRequest(candidate);
  if (validation.error) return validation;

  return {
    value: Object.fromEntries(
      fields.map((field) => [field, validation.value[field]]),
    ),
  };
}

export async function createDonationRequest(req, res) {
  const validation = validateCreateRequest(req.body);
  if (validation.error) {
    res.status(400).json({ message: validation.error });
    return;
  }

  const request = await DonationRequest.create({
    ...validation.value,
    requesterId: req.user._id,
    requesterName: req.user.name,
    requesterEmail: req.user.email,
    status: 'pending',
    statusHistory: [{
      status: 'pending',
      changedById: req.user._id,
      changedByName: req.user.name,
    }],
  });

  res.status(201).json({ request: serializeRequest(request) });
}

export async function getDonationRequest(req, res) {
  const request = getUserRole(req.user) === 'admin'
    ? mongoose.isValidObjectId(req.params.id)
      ? await DonationRequest.findById(req.params.id)
      : null
    : await findOwnedRequest(req.params.id, req.user._id);
  if (!request) {
    res.status(404).json({ message: 'Donation request not found.' });
    return;
  }
  res.json({ request: serializeRequest(request) });
}

export async function getPendingDonationRequests(req, res) {
  const validation = validatePendingSearch(req.query);
  if (validation.error) {
    res.status(400).json({ message: validation.error });
    return;
  }

  const { page } = validation.value;
  const filter = { status: 'pending' };
  if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
  if (req.query.district) filter.recipientDistrict = req.query.district.trim();
  if (req.query.upazila) filter.recipientUpazila = req.query.upazila.trim();

  const [requests, total] = await Promise.all([
    DonationRequest.find(filter)
      .sort({ donationDate: 1, donationTime: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    DonationRequest.countDocuments(filter),
  ]);

  res.json({
    requests: requests.map((request) => ({
      id: request._id.toString(),
      recipientName: request.recipientName,
      recipientDistrict: request.recipientDistrict,
      recipientUpazila: request.recipientUpazila,
      bloodGroup: request.bloodGroup,
      donationDate: request.donationDate,
      donationTime: request.donationTime,
      status: request.status,
    })),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}

export async function getPendingDonationRequestDetails(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Donation request not found.' });
    return;
  }
  const role = getUserRole(req.user);
  const canViewAllRequests = role === 'admin' || role === 'volunteer';
  const request = canViewAllRequests
    ? await DonationRequest.findById(req.params.id)
    : await DonationRequest.findOne({
      _id: req.params.id,
      $or: [
        { status: 'pending' },
        { donorId: req.user._id },
        { requesterId: req.user._id },
      ],
    });
  if (!request || (
      !canViewAllRequests
    && (
    request.status !== 'pending'
    && request.donorId?.toString() !== req.user._id.toString()
    && request.requesterId.toString() !== req.user._id.toString()
    )
  )) {
    res.status(404).json({ message: 'Donation request not found.' });
    return;
  }
  res.json({ request: serializeRequest(request) });
}

export async function confirmDonation(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: 'Donation request not found.' });
    return;
  }

  const request = await DonationRequest.findOneAndUpdate(
    {
      _id: req.params.id,
      requesterId: { $ne: req.user._id },
      status: 'pending',
    },
    {
      $set: {
        status: 'inprogress',
        donorId: req.user._id,
        donorName: req.user.name,
        donorEmail: req.user.email,
      },
      $push: {
        statusHistory: {
          status: 'inprogress',
          changedById: req.user._id,
          changedByName: req.user.name,
          changedAt: new Date(),
        },
      },
    },
    { new: true, runValidators: true },
  );
  if (request) {
    const notification = await notifyRequestStatus(request, req.user);
    res.json({ request: serializeRequest(request), notification });
    return;
  }

  const existingRequest = await DonationRequest.findById(req.params.id).select('requesterId status');
  if (!existingRequest) {
    res.status(404).json({ message: 'Donation request not found.' });
  } else if (existingRequest.requesterId.toString() === req.user._id.toString()) {
    res.status(403).json({ message: 'You cannot donate to your own request.' });
  } else {
    res.status(409).json({ message: 'This request is no longer available for donation.' });
  }
}

export async function updateDonationRequest(req, res) {
  const role = getUserRole(req.user);
  const request = role === 'admin'
    ? mongoose.isValidObjectId(req.params.id)
      ? await DonationRequest.findById(req.params.id)
      : null
    : await findOwnedRequest(req.params.id, req.user._id);
  if (!request) {
    res.status(404).json({ message: 'Donation request not found.' });
    return;
  }
  if (request.status !== 'pending' && role !== 'volunteer') {
    res.status(409).json({ message: 'Only pending donation requests can be edited.' });
    return;
  }

  const validation = getUpdateValues(req.body, request);
  if (validation.error) {
    res.status(400).json({ message: validation.error });
    return;
  }

  request.set(validation.value);
  await request.save();
  res.json({ request: serializeRequest(request) });
}

export async function deleteDonationRequest(req, res) {
  const request = getUserRole(req.user) === 'admin'
    ? mongoose.isValidObjectId(req.params.id)
      ? await DonationRequest.findById(req.params.id)
      : null
    : await findOwnedRequest(req.params.id, req.user._id);
  if (!request) {
    res.status(404).json({ message: 'Donation request not found.' });
    return;
  }

  await request.deleteOne();
  res.json({ message: 'Donation request deleted.' });
}

export async function updateDonationRequestStatus(req, res) {
  const { status } = req.body ?? {};
  if (!DONATION_STATUSES.includes(status)) {
    res.status(400).json({ message: 'Select a valid donation request status.' });
    return;
  }

  const role = getUserRole(req.user);
  const request = role === 'volunteer' || role === 'admin'
    ? mongoose.isValidObjectId(req.params.id)
      ? await DonationRequest.findById(req.params.id)
      : null
    : await findOwnedRequest(req.params.id, req.user._id);
  if (!request) {
    res.status(404).json({ message: 'Donation request not found.' });
    return;
  }
  if (role !== 'volunteer' && (
    (status !== 'done' && status !== 'canceled')
    || request.status !== 'inprogress'
  )) {
    res.status(409).json({ message: 'Only in-progress donation requests can be completed or canceled.' });
    return;
  }

  const previousDonor = {
    id: request.donorId,
    email: request.donorEmail,
  };
  request.status = status;
  request.statusHistory ??= [];
  request.statusHistory.push({
    status,
    changedById: req.user._id,
    changedByName: req.user.name,
    changedAt: new Date(),
  });
  if (status === 'pending') {
    request.donorId = null;
    request.donorName = '';
    request.donorEmail = '';
  }
  await request.save();
  const notification = await notifyRequestStatus(request, req.user, previousDonor);
  res.json({ request: serializeRequest(request), notification });
}

export async function getMyDonationRequests(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const status = req.query.status;
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    res.status(400).json({ message: 'Page must be a positive whole number.' });
    return;
  }
  if (status !== undefined && !DONATION_STATUSES.includes(status)) {
    res.status(400).json({ message: 'Select a valid donation status filter.' });
    return;
  }

  const filter = { requesterId: req.user._id };
  if (status) filter.status = status;

  const [requests, total] = await Promise.all([
    DonationRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    DonationRequest.countDocuments(filter),
  ]);

  res.json({
    requests: requests.map(serializeRequest),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}

export async function getAllDonationRequests(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const status = req.query.status;
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    res.status(400).json({ message: 'Page must be a positive whole number.' });
    return;
  }
  if (status !== undefined && !DONATION_STATUSES.includes(status)) {
    res.status(400).json({ message: 'Select a valid donation status filter.' });
    return;
  }

  const filter = {};
  if (status) filter.status = status;
  const [requests, total] = await Promise.all([
    DonationRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    DonationRequest.countDocuments(filter),
  ]);

  res.json({
    requests: requests.map(serializeRequest),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}

export async function getAdminDashboardStats(req, res) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  monthStart.setUTCMonth(monthStart.getUTCMonth() - 5);
  const [donorCount, donationRequestCount, pendingCount, inProgressCount, doneCount, canceledCount, fundingSummary, monthlyRows] = await Promise.all([
    User.countDocuments({ role: 'donor' }),
    DonationRequest.countDocuments({}),
    DonationRequest.countDocuments({ status: 'pending' }),
    DonationRequest.countDocuments({ status: 'inprogress' }),
    DonationRequest.countDocuments({ status: 'done' }),
    DonationRequest.countDocuments({ status: 'canceled' }),
    Funding.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalAmountPaisa: { $sum: '$amountPaisa' } } },
    ]),
    DonationRequest.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          requests: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const monthlyCounts = new Map(monthlyRows.map((row) => [row._id, row]));
  const monthlyRequests = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(monthStart);
    date.setUTCMonth(date.getUTCMonth() + index);
    const month = date.toISOString().slice(0, 7);
    const row = monthlyCounts.get(month);
    return {
      month,
      requests: row?.requests || 0,
      completed: row?.completed || 0,
    };
  });
  res.json({
    statistics: {
      donorCount,
      donationRequestCount,
      totalFunding: (fundingSummary[0]?.totalAmountPaisa || 0) / 100,
      fundingCurrency: 'BDT',
      requestStatuses: {
        pending: pendingCount,
        inprogress: inProgressCount,
        done: doneCount,
        canceled: canceledCount,
      },
      monthlyRequests,
    },
  });
}
