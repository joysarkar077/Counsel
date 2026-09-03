const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ role: 'lawyer' });
  console.log("Avatar URL:", user.avatarUrl);
  console.log("Avatar Key Enc:", user.avatarKey_enc);
  process.exit(0);
});
