import nodemailer from 'nodemailer';
import { env } from './env.js';
import { db } from './db.js';
import { money, publicSettings } from './utils.js';

let transporter = null;
let transporterReady = false;

function getTransporter() {
  if (transporterReady) return transporter;
  transporterReady = true;
  if (env.smtpHost && env.smtpUser) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  } else {
    transporter = null;
  }
  return transporter;
}

function logEmail({ orderId, recipient, subject, body, type, status, error = null }) {
  db.prepare(
    `INSERT INTO email_log (order_id, recipient, subject, body, type, status, error)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(orderId ?? null, recipient ?? '', subject ?? '', body ?? '', type ?? '', status, error);
}

/**
 * يرسل رسالة ويحفظ سجلاً بها.
 * في وضع التطوير (بدون SMTP) تُسجَّل الرسالة في الطرفية وقاعدة البيانات فقط.
 */
export async function sendMail({ to, subject, html, orderId = null, type = 'general' }) {
  const tx = getTransporter();
  if (!tx) {
    console.log(`\n📧 [وضع التطوير] بريد → ${to}\n   الموضوع: ${subject}\n`);
    logEmail({ orderId, recipient: to, subject, body: html, type, status: 'logged' });
    return { status: 'logged' };
  }
  try {
    await tx.sendMail({ from: env.mailFrom, to, subject, html });
    logEmail({ orderId, recipient: to, subject, body: html, type, status: 'sent' });
    return { status: 'sent' };
  } catch (err) {
    logEmail({ orderId, recipient: to, subject, body: html, type, status: 'failed', error: err.message });
    console.error('✖ فشل إرسال البريد:', err.message);
    return { status: 'failed', error: err.message };
  }
}

const wrap = (title, inner, settings) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF5FA;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#3b2b33;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#E75480,#FFB6D9);border-radius:20px 20px 0 0;padding:28px;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:26px;letter-spacing:1px;">${settings.company_name}</h1>
      <p style="margin:6px 0 0;opacity:.9;font-size:14px;">${title}</p>
    </div>
    <div style="background:#ffffff;border:1px solid #FFD7E8;border-top:0;border-radius:0 0 20px 20px;padding:28px;">
      ${inner}
    </div>
    <p style="text-align:center;color:#b993a6;font-size:12px;margin-top:18px;">
      ${settings.company_name} — ${settings.address || ''}<br>
      ${settings.phone ? 'هاتف: ' + settings.phone : ''} ${settings.company_email ? '| ' + settings.company_email : ''}
    </p>
  </div>
</body>
</html>`;

function itemsTable(order, items, currency) {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #FFE3EF;">${it.product_name}${
        it.variant ? ` <span style="color:#b993a6;font-size:12px;">(${it.variant})</span>` : ''
      }</td>
        <td style="padding:10px;border-bottom:1px solid #FFE3EF;text-align:center;">${it.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #FFE3EF;text-align:center;">${money(it.unit_price, currency)}</td>
        <td style="padding:10px;border-bottom:1px solid #FFE3EF;text-align:center;">${money(it.line_total, currency)}</td>
      </tr>`
    )
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <thead>
        <tr style="background:#FFE3EF;color:#E75480;">
          <th style="padding:10px;text-align:right;">المنتج</th>
          <th style="padding:10px;">الكمية</th>
          <th style="padding:10px;">السعر</th>
          <th style="padding:10px;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width:100%;font-size:14px;">
      <tr><td style="padding:4px 0;">المجموع الفرعي</td><td style="text-align:left;">${money(order.subtotal, currency)}</td></tr>
      ${order.discount > 0 ? `<tr><td style="padding:4px 0;color:#E75480;">الخصم</td><td style="text-align:left;color:#E75480;">- ${money(order.discount, currency)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;">التوصيل</td><td style="text-align:left;">${order.shipping > 0 ? money(order.shipping, currency) : 'مجاني'}</td></tr>
      <tr><td style="padding:10px 0;font-weight:bold;font-size:16px;border-top:2px solid #FFD7E8;">الإجمالي</td><td style="text-align:left;font-weight:bold;font-size:16px;border-top:2px solid #FFD7E8;color:#E75480;">${money(order.total, currency)}</td></tr>
    </table>`;
}

export function customerEmail(order, items) {
  const s = publicSettings();
  const inner = `
    <h2 style="color:#E75480;margin-top:0;">شكراً لك ${order.customer_name} 🌸</h2>
    <p>تم استلام طلبك بنجاح، وسنقوم بالتواصل معك قريباً لتأكيد التوصيل.</p>
    <p style="background:#FFF5FA;border-radius:12px;padding:12px;display:inline-block;">
      رقم الطلب: <strong style="color:#E75480;">${order.order_number}</strong>
    </p>
    ${itemsTable(order, items, s.currency)}
    <h3 style="color:#E75480;">بيانات التوصيل</h3>
    <p style="line-height:1.9;font-size:14px;">
      الاسم: ${order.customer_name}<br>
      الهاتف: ${order.phone}<br>
      ${order.email ? 'البريد: ' + order.email + '<br>' : ''}
      العنوان: ${order.address}
      ${order.notes ? '<br>ملاحظات: ' + order.notes : ''}
    </p>`;
  return wrap('تأكيد الطلب', inner, s);
}

export function companyEmail(order, items) {
  const s = publicSettings();
  const inner = `
    <h2 style="color:#E75480;margin-top:0;">طلب جديد 🔔</h2>
    <p>وصل طلب جديد يحتاج المتابعة.</p>
    <p style="background:#FFF5FA;border-radius:12px;padding:12px;display:inline-block;">
      رقم الطلب: <strong style="color:#E75480;">${order.order_number}</strong><br>
      الوقت: ${order.created_at}
    </p>
    ${itemsTable(order, items, s.currency)}
    <h3 style="color:#E75480;">بيانات الزبون</h3>
    <p style="line-height:1.9;font-size:14px;">
      الاسم: ${order.customer_name}<br>
      الهاتف: ${order.phone}<br>
      ${order.email ? 'البريد: ' + order.email + '<br>' : ''}
      العنوان: ${order.address}
      ${order.notes ? '<br>ملاحظات: ' + order.notes : ''}
    </p>`;
  return wrap('طلب جديد', inner, s);
}

export async function sendOrderEmails(order, items) {
  const s = publicSettings();
  const jobs = [];

  if (order.email) {
    jobs.push(
      sendMail({
        to: order.email,
        subject: `تأكيد طلبك ${order.order_number} — ${s.company_name}`,
        html: customerEmail(order, items),
        orderId: order.id,
        type: 'customer',
      })
    );
  }

  if (s.company_email) {
    jobs.push(
      sendMail({
        to: s.company_email,
        subject: `طلب جديد ${order.order_number} — ${order.customer_name}`,
        html: companyEmail(order, items),
        orderId: order.id,
        type: 'company',
      })
    );
  }

  return Promise.allSettled(jobs);
}
