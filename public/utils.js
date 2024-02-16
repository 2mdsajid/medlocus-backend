const crypto = require('crypto');

const generateVerificationKey = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    key += characters[randomIndex];
  }
  return key;
};

const groupQuestionsBySubject = async (questions) => {
  const questionArray = {};
  for (const question of questions) {
    const subject = question.subject || 'combined';
    if (!questionArray[subject]) {
      questionArray[subject] = [];
    }
    questionArray[subject].push(question);
  }
  return questionArray;
};

const generateRandomKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const encryptData = (data) => {
  const key32 = generateRandomKey();
  const algorithm = 'aes-256-ctr';
  const key = 'c79a75361bd85ab7a2c3611fb4fa1564153911ed836f78b0b25b58924cb4a972';
  const iv = crypto.randomBytes(16); // Initialization vector, a random value for each encryption
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(data, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
  };
};



module.exports = {
  generateVerificationKey,
  groupQuestionsBySubject,
  encryptData
}