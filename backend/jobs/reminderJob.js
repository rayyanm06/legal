/**
 * Reminder Job
 * Runs every day at 8:00 AM IST.
 * Finds hearings 3 days away and sends in-app + email reminders.
 */

import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Lawyer from '../models/Lawyer.js';

function createEmailTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

async function runReminderCycle() {
  console.log(`[ReminderJob] 🔔 Running at ${new Date().toISOString()}`);
  const transporter = createEmailTransporter();

  const now = new Date();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  try {
    const users = await User.find({ 'trackedCases.status': 'active' });

    for (const user of users) {
      let modified = false;

      for (const trackedCase of user.trackedCases) {
        if (trackedCase.status !== 'active') continue;

        for (const hearing of trackedCase.hearings) {
          if (hearing.reminderSent) continue;

          const hearingDate = new Date(hearing.date);
          const diff = hearingDate - now;

          // Trigger if hearing is between 2 and 4 days away (covers the 3-day window)
          if (diff >= threeDaysMs - 86400000 && diff <= threeDaysMs + 86400000) {
            const formattedDate = formatDate(hearingDate);

            // 1. Push in-app notification
            user.notifications.push({
              message: `Hearing reminder: ${trackedCase.caseTitle} (${trackedCase.caseId}) at ${trackedCase.court} on ${formattedDate}. Notes: ${hearing.notes || 'None'}`,
              category: 'HEARING',
              daysUntil: 3,
              read: false
            });
            user.totalAlerts += 1;

            // 2. Send email if transporter available
            if (transporter) {
              const mailBody = `Dear ${user.name},

You have a court hearing coming up in 3 days.

Case: ${trackedCase.caseTitle} (${trackedCase.caseId})
Court: ${trackedCase.court}, ${trackedCase.state || 'India'}
Date: ${formattedDate}
Your notes: ${hearing.notes || 'None'}

Make sure you have these ready:
- Original case documents
- Previous hearing orders
- Any evidence you have collected

Login to nyAI to view your full case details and evidence checklist.

Regards,
nyAI Legal Platform
"Justice, Understood. Rights, Unlocked."`;

              try {
                await transporter.sendMail({
                  from: `"nyAI Legal Platform" <${process.env.EMAIL_USER}>`,
                  to: user.email,
                  subject: `nyAI — Hearing in 3 days: ${trackedCase.caseTitle}`,
                  text: mailBody,
                });
                console.log(`[ReminderJob] ✅ Email sent to ${user.email} for case ${trackedCase.caseId}`);
              } catch (mailErr) {
                console.warn(`[ReminderJob] ⚠️ Email failed for ${user.email}:`, mailErr.message);
              }
            }

            // 3. Mark reminder as sent
            hearing.reminderSent = true;
            modified = true;
          }
        }
      }

      if (modified) {
        await user.save();
      }
    }

    console.log(`[ReminderJob] ✅ Citizen reminders complete`);

    // ── Lawyer reminder loop ──────────────────────────────────────────────────
    const lawyers = await Lawyer.find({ 'cases.status': 'active' });

    for (const lawyer of lawyers) {
      let modified = false;

      for (const lawyerCase of lawyer.cases) {
        if (lawyerCase.status !== 'active') continue;

        for (const hearing of lawyerCase.hearings) {
          if (hearing.reminderSent) continue;

          const hearingDate = new Date(hearing.date);
          const diff = hearingDate - now;

          if (diff >= threeDaysMs - 86400000 && diff <= threeDaysMs + 86400000) {
            const formattedDate = formatDate(hearingDate);

            lawyer.notifications.push({
              message: `Hearing reminder: ${lawyerCase.title} (${lawyerCase.caseId}) at ${lawyerCase.court} on ${formattedDate}. Client: ${lawyerCase.clientName}`,
              type: 'hearing',
              read: false
            });

            if (transporter) {
              const mailBody = `Dear Adv. ${lawyer.name},

Reminder: You have a court hearing in 3 days.

Case: ${lawyerCase.title} (${lawyerCase.caseId})
Client: ${lawyerCase.clientName}
Court: ${lawyerCase.court}
Date: ${formattedDate}
Your notes: ${hearing.notes || 'None'}

Log in to your nyAI Lawyer Portal to review case documents and AI case strategy.

Regards,
nyAI Legal Platform`;

              try {
                await transporter.sendMail({
                  from: `"nyAI Legal Platform" <${process.env.EMAIL_USER}>`,
                  to: lawyer.email,
                  subject: `nyAI — Hearing in 3 days: ${lawyerCase.title}`,
                  text: mailBody,
                });
                console.log(`[ReminderJob] ✅ Lawyer email sent to ${lawyer.email}`);
              } catch (mailErr) {
                console.warn(`[ReminderJob] ⚠️ Lawyer email failed for ${lawyer.email}:`, mailErr.message);
              }
            }

            hearing.reminderSent = true;
            modified = true;
          }
        }
      }

      if (modified) await lawyer.save();
    }

    console.log(`[ReminderJob] ✅ Lawyer reminders complete`);
  } catch (err) {
    console.error('[ReminderJob] ❌ Error:', err.message);
  }
}

// Run every day at 8:00 AM IST
const reminderJob = cron.schedule('0 8 * * *', runReminderCycle, {
  scheduled: false,
  timezone: 'Asia/Kolkata',
});

export default reminderJob;
