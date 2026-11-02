import { randomUUID } from 'node:crypto';
import Funding from '../models/funding.model.js';

const PAGE_SIZE = 10;
const MAX_PAGE = 100000;
const MIN_AMOUNT_PAISA = 1000;
const MAX_AMOUNT_PAISA = 50000000;
const SANDBOX_URL = 'https://sandbox.sslcommerz.com';
const LIVE_URL = 'https://securepay.sslcommerz.com';

function getGatewayConfiguration() {
  const { SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, SSLCOMMERZ_IS_LIVE, API_PUBLIC_URL } = process.env;
  if (!SSLCOMMERZ_STORE_ID || !SSLCOMMERZ_STORE_PASSWORD || !API_PUBLIC_URL) {
    return null;
  }

  let apiUrl;
  let clientUrl;
  try {
    apiUrl = new URL(API_PUBLIC_URL);
    const configuredClientUrl = process.env.CLIENT_URL?.split(',')[0]?.trim();
    clientUrl = new URL(configuredClientUrl);
  } catch {
    return null;
  }
  if (
    !['http:', 'https:'].includes(apiUrl.protocol)
    || !['http:', 'https:'].includes(clientUrl.protocol)
    || (SSLCOMMERZ_IS_LIVE === 'true' && (apiUrl.protocol !== 'https:' || clientUrl.protocol !== 'https:'))
  ) {
    return null;
  }

  return {
    storeId: SSLCOMMERZ_STORE_ID,
    storePassword: SSLCOMMERZ_STORE_PASSWORD,
    baseUrl: SSLCOMMERZ_IS_LIVE === 'true' ? LIVE_URL : SANDBOX_URL,
    apiUrl: apiUrl.origin,
    clientUrl: clientUrl.origin,
  };
}

function parseAmountPaisa(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const amount = String(value).trim();
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(amount)) return null;
  const [whole, fraction = ''] = amount.split('.');
  const paisa = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(paisa) ? paisa : null;
}

function serializeFunding(funding) {
  return {
    id: funding._id.toString(),
    donorName: funding.donorName,
    amount: funding.amountPaisa / 100,
    currency: funding.currency,
    paidAt: funding.paidAt,
  };
}

function paymentReturnUrl(apiUrl, endpoint) {
  return new URL(`/funding/${endpoint}`, apiUrl).toString();
}

async function postGatewayForm(url, form) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error('SSLCOMMERZ could not process the payment request.');
  }
  return response.json();
}

export async function createFundingCheckout(req, res) {
  const configuration = getGatewayConfiguration();
  if (!configuration) {
    res.status(503).json({ message: 'BDT funding is not configured. Please contact the site administrator.' });
    return;
  }

  const amountPaisa = parseAmountPaisa(req.body?.amount);
  if (amountPaisa === null || amountPaisa < MIN_AMOUNT_PAISA || amountPaisa > MAX_AMOUNT_PAISA) {
    res.status(400).json({ message: 'Funding amount must be between BDT 10.00 and BDT 500,000.00, with up to two decimals.' });
    return;
  }
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.replace(/[\s()-]/g, '') : '';
  const phoneMatch = phone.match(/^(?:\+?88)?(01[3-9]\d{8})$/);
  if (!phoneMatch) {
    res.status(400).json({ message: 'Enter a valid Bangladesh mobile number.' });
    return;
  }

  const tranId = `LD${randomUUID().replaceAll('-', '').slice(0, 28)}`;
  const funding = await Funding.create({
    userId: req.user._id,
    donorName: req.user.name,
    donorEmail: req.user.email,
    amountPaisa,
    currency: 'BDT',
    tranId,
    status: 'pending',
  });
  const form = new URLSearchParams({
    store_id: configuration.storeId,
    store_passwd: configuration.storePassword,
    total_amount: (amountPaisa / 100).toFixed(2),
    currency: 'BDT',
    tran_id: tranId,
    success_url: paymentReturnUrl(configuration.apiUrl, 'success'),
    fail_url: paymentReturnUrl(configuration.apiUrl, 'failure'),
    cancel_url: paymentReturnUrl(configuration.apiUrl, 'cancel'),
    ipn_url: paymentReturnUrl(configuration.apiUrl, 'ipn'),
    cus_name: req.user.name,
    cus_email: req.user.email,
    cus_add1: req.user.upazila || req.user.district,
    cus_city: req.user.district,
    cus_country: 'Bangladesh',
    cus_phone: `+88${phoneMatch[1]}`,
    product_name: 'LifeDrop community funding',
    product_category: 'donation',
    product_profile: 'non-physical-goods',
    shipping_method: 'NO',
    num_of_item: '1',
  });

  try {
    const gatewayResponse = await postGatewayForm(
      `${configuration.baseUrl}/gwprocess/v4/api.php`,
      form,
    );
    const checkoutUrl = typeof gatewayResponse.GatewayPageURL === 'string'
      ? new URL(gatewayResponse.GatewayPageURL)
      : null;
    if (
      gatewayResponse.status !== 'SUCCESS'
      || !checkoutUrl
      || checkoutUrl.protocol !== 'https:'
      || checkoutUrl.hostname !== new URL(configuration.baseUrl).hostname
    ) {
      throw new Error('SSLCOMMERZ did not return a valid hosted checkout URL.');
    }

    res.status(201).json({ checkoutUrl: checkoutUrl.toString() });
  } catch (error) {
    await Funding.updateOne({ _id: funding._id, status: 'pending' }, { $set: { status: 'failed' } });
    throw error;
  }
}

async function verifyPaymentCallback(body) {
  const configuration = getGatewayConfiguration();
  if (!configuration) throw new Error('The payment gateway is not configured.');

  const tranId = typeof body?.tran_id === 'string' ? body.tran_id : '';
  const valId = typeof body?.val_id === 'string' ? body.val_id : '';
  if (!tranId || tranId.length > 30 || !valId || valId.length > 100) {
    throw new Error('The payment callback is incomplete.');
  }

  const funding = await Funding.findOne({ tranId });
  if (!funding) throw new Error('The funding transaction was not found.');

  const validationUrl = new URL('/validator/api/validationserverAPI.php', configuration.baseUrl);
  validationUrl.search = new URLSearchParams({
    val_id: valId,
    store_id: configuration.storeId,
    store_passwd: configuration.storePassword,
    format: 'json',
  }).toString();
  const response = await fetch(validationUrl, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('SSLCOMMERZ transaction verification failed.');
  const transaction = await response.json();
  const verifiedAmount = parseAmountPaisa(transaction.amount);
  const verified = (
    ['VALID', 'VALIDATED'].includes(transaction.status)
    && transaction.tran_id === funding.tranId
    && transaction.currency === 'BDT'
    && verifiedAmount === funding.amountPaisa
    && String(transaction.risk_level ?? '0') === '0'
  );
  if (!verified) throw new Error('The payment could not be verified against the funding transaction.');

  await Funding.updateOne(
    { _id: funding._id, status: { $ne: 'paid' } },
    {
      $set: {
        status: 'paid',
        valId,
        bankTranId: typeof transaction.bank_tran_id === 'string' ? transaction.bank_tran_id : '',
        paidAt: new Date(),
      },
    },
  );
  return funding;
}

export async function handleFundingIpn(req, res) {
  await verifyPaymentCallback(req.body);
  res.status(200).json({ message: 'Payment verified.' });
}

export async function handleFundingSuccess(req, res) {
  const configuration = getGatewayConfiguration();
  if (!configuration) {
    res.status(503).send('Funding is not configured.');
    return;
  }
  try {
    await verifyPaymentCallback(req.body);
    res.redirect(303, `${configuration.clientUrl}/funding?payment=success`);
  } catch (error) {
    console.error('Funding return verification failed:', error.name || 'Error');
    res.redirect(303, `${configuration.clientUrl}/funding?payment=verification_failed`);
  }
}

export function handleFundingFailure(req, res) {
  const configuration = getGatewayConfiguration();
  if (!configuration) {
    res.status(503).send('Funding is not configured.');
    return;
  }
  res.redirect(303, `${configuration.clientUrl}/funding?payment=failed`);
}

export function handleFundingCancel(req, res) {
  const configuration = getGatewayConfiguration();
  if (!configuration) {
    res.status(503).send('Funding is not configured.');
    return;
  }
  res.redirect(303, `${configuration.clientUrl}/funding?payment=canceled`);
}

export async function getFundingHistory(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    res.status(400).json({ message: 'Page must be a positive whole number.' });
    return;
  }
  const filter = { status: 'paid' };
  const [fundings, total] = await Promise.all([
    Funding.find(filter)
      .sort({ paidAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    Funding.countDocuments(filter),
  ]);
  res.json({
    fundings: fundings.map(serializeFunding),
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

export async function getFundingSummary(req, res) {
  const [summary] = await Funding.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, totalAmountPaisa: { $sum: '$amountPaisa' } } },
  ]);
  res.json({ totalFunding: (summary?.totalAmountPaisa || 0) / 100, currency: 'BDT' });
}
