import User, { BLOOD_GROUPS } from '../models/user.model.js';

const PAGE_SIZE = 12;
const MAX_PAGE = 100000;

function validateDonorSearch(query) {
  const bloodGroup = typeof query.bloodGroup === 'string' ? query.bloodGroup.trim() : '';
  const district = typeof query.district === 'string' ? query.district.trim() : '';
  const upazila = typeof query.upazila === 'string' ? query.upazila.trim() : '';
  const page = query.page === undefined ? 1 : Number(query.page);

  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    return { error: 'Select a valid blood group.' };
  }
  if (!district || district.length > 100) {
    return { error: 'Select a valid district.' };
  }
  if (!upazila || upazila.length > 100) {
    return { error: 'Select a valid upazila.' };
  }
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    return { error: 'Page must be a positive whole number.' };
  }

  return { value: { bloodGroup, district, upazila, page } };
}

export async function searchDonors(req, res) {
  const validation = validateDonorSearch(req.query);
  if (validation.error) {
    res.status(400).json({ message: validation.error });
    return;
  }

  const { bloodGroup, district, upazila, page } = validation.value;
  const filter = {
    role: 'donor',
    status: 'active',
    bloodGroup,
    district,
    upazila,
    isAvailable: { $ne: false },
    $or: [
      { nextAvailableDate: '' },
      { nextAvailableDate: { $lte: new Date().toISOString().slice(0, 10) } },
      { nextAvailableDate: { $exists: false } },
    ],
  };
  const [donors, total] = await Promise.all([
    User.find(filter)
      .select('name avatar bloodGroup district upazila phone isAvailable nextAvailableDate')
      .sort({ name: 1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
    User.countDocuments(filter),
  ]);

  res.json({
    donors: donors.map((donor) => ({
      id: donor._id.toString(),
      name: donor.name,
      avatar: donor.avatar || '',
      bloodGroup: donor.bloodGroup,
      district: donor.district,
      upazila: donor.upazila,
      phone: donor.phone || '',
      isAvailable: donor.isAvailable !== false,
    })),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
