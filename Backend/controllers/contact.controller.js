import ContactMessage from '../models/contactMessage.model.js';

const PAGE_SIZE = 10;
const MAX_PAGE = 100000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,20}$/;

function validateContactMessage(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Submit your contact details as a JSON object.' };
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 80) {
    return { error: 'Name must be between 2 and 80 characters.' };
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }
  if (phone && (phone.length > 24 || !PHONE_PATTERN.test(phone))) {
    return { error: 'Enter a valid phone number or leave the field blank.' };
  }
  if (subject.length < 3 || subject.length > 120) {
    return { error: 'Subject must be between 3 and 120 characters.' };
  }
  if (message.length < 10 || message.length > 2000) {
    return { error: 'Message must be between 10 and 2000 characters.' };
  }
  return { value: { name, email, phone, subject, message } };
}

function serializeMessage(message) {
  return {
    id: message._id.toString(),
    name: message.name,
    email: message.email,
    phone: message.phone || '',
    subject: message.subject,
    message: message.message,
    isRead: message.isRead,
    createdAt: message.createdAt,
  };
}

export async function submitContactMessage(req, res) {
  const validation = validateContactMessage(req.body);
  if (validation.error) {
    res.status(400).json({ message: validation.error });
    return;
  }

  const contactMessage = await ContactMessage.create(validation.value);
  res.status(201).json({
    message: 'Your message has been received. The LifeDrop team will get back to you.',
    contactMessage: { id: contactMessage._id.toString() },
  });
}

export async function getContactMessages(req, res) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    res.status(400).json({ message: 'Page must be a positive whole number.' });
    return;
  }
  const [messages, total, unreadCount] = await Promise.all([
    ContactMessage.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    ContactMessage.countDocuments({}),
    ContactMessage.countDocuments({ isRead: false }),
  ]);
  res.json({
    messages: messages.map(serializeMessage),
    unreadCount,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

export async function markContactMessageRead(req, res) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    res.status(404).json({ message: 'Contact message not found.' });
    return;
  }
  const contactMessage = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { $set: { isRead: true } },
    { new: true, runValidators: true },
  );
  if (!contactMessage) {
    res.status(404).json({ message: 'Contact message not found.' });
    return;
  }
  res.json({ contactMessage: serializeMessage(contactMessage) });
}
