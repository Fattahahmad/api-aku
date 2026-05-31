import { Client } from '@upstash/qstash';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  baseUrl: process.env.QSTASH_URL,
  token: process.env.QSTASH_TOKEN
});

export const scheduleWeeklySummary = async (endpointUrl, cron = '0 1 * * 0') => {
  try {
    const scheduled = await client.schedule({
      destination: endpointUrl,
      cron: cron
    });
    return scheduled;
  } catch (error) {
    console.error('QStash schedule error:', error.message);
  }
};