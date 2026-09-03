import mongoose from 'mongoose';
import { User } from './src/models/User';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const user = await User.findOne({ role: 'lawyer' }).lean();
  console.log('User address_enc:', user?.address_enc);
  console.log('User bloodGroup_enc:', user?.bloodGroup_enc);
  await mongoose.disconnect();
}
check().catch(console.error);
