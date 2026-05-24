const DEMO_TRAINEES = [
  {
    id: 't1',
    name: 'Ram',
    phone: '9874563210',
    status: 'active',
  },
  {
    id: 'MDS1002',
    name: 'Rohit Shetty',
    phone: '9988776655',
    status: 'active',
  },
];

const TRAINEE_STORAGE_KEY = 'vanloka_verified_trainee';

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function normalizeTrainee(trainee) {
  if (!trainee) return null;

  const attempts = Number.parseInt(trainee.attempts ?? trainee.total_attempts ?? 0, 10);
  const bestScore = Number.parseInt(trainee.best_score ?? trainee.bestScore ?? 0, 10);

  return {
    id: trainee.id || trainee.trainee_id || trainee.mds_id || trainee.user_id || '',
    name: trainee.name || [trainee.first_name, trainee.last_name].filter(Boolean).join(' ').trim() || trainee.trainee_name || trainee.full_name || 'Verified trainee',
    phone: normalizePhone(trainee.phone || trainee.mobile || trainee.mobile_number || trainee.phone_number || trainee.contact_number),
    status: trainee.status || (trainee.is_active === false ? 'inactive' : 'active'),
    attempts: Number.isNaN(attempts) ? 0 : attempts,
    bestScore: Number.isNaN(bestScore) ? 0 : bestScore,
  };
}

export function saveVerifiedTrainee(trainee) {
  localStorage.setItem(TRAINEE_STORAGE_KEY, JSON.stringify(trainee));
}

export function clearVerifiedTrainee() {
  localStorage.removeItem(TRAINEE_STORAGE_KEY);
}

export function getVerifiedTrainee() {
  try {
    return JSON.parse(localStorage.getItem(TRAINEE_STORAGE_KEY) || 'null');
  } catch (error) {
    console.log('Unable to read verified trainee:', error);
    return null;
  }
}

export async function verifyTrainee({ traineeId, phone, token }) {
  const verifyUrl = process.env.REACT_APP_TRAINEE_VERIFY_URL;
  const payload = {
    traineeId: traineeId?.trim() || (token ? 't1' : ''),
    phone: normalizePhone(phone),
    token: token?.trim(),
    source: 'trainee-mobile-app',
    table: 'postgres.mds.mds_trainees',
  };

  if (verifyUrl) {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Trainee verification failed');
    }

    const data = await response.json();
    const trainee = normalizeTrainee(data.trainee || data);
    if (!trainee) throw new Error('Trainee not found');
    saveVerifiedTrainee(trainee);
    return trainee;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Trainee verification service is not configured');
  }

  if (!payload.traineeId && !payload.phone) {
    throw new Error('Enter a trainee ID or mobile number to verify');
  }

  const trainee = DEMO_TRAINEES.find((item) => {
    const idMatches = payload.traineeId && item.id.toLowerCase() === payload.traineeId.toLowerCase();
    const phoneMatches = payload.phone && normalizePhone(item.phone) === payload.phone;
    return idMatches || phoneMatches;
  });

  if (!trainee) {
    throw new Error('Trainee not found');
  }

  saveVerifiedTrainee(trainee);
  return trainee;
}
