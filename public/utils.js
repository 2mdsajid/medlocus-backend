

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


module.exports = { generateVerificationKey,groupQuestionsBySubject }