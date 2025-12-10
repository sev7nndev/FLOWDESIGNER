const { Resend } = require('resend');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables strictly
const envPath = path.resolve(__dirname, '../../.env');
const envLocalPath = path.resolve(__dirname, '../../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Default to 'onboarding' for testing, user should change this in production
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Send email via Resend SDK
 */
async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY não configurada. Email ignorado (Simulado no Log).');
    console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
    return { success: false, error: 'API key missing' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email enviado via Resend:', data.id);
    return { success: true, id: data.id };
  } catch (e) {
    console.error('❌ Email Exception:', e);
    return { success: false, error: e.message };
  }
}

// ... TEMPLATES (Reusing existing HTML logic) ...

// --- TEMPLATES (COPIED & UPDATED) ---

function getWelcomeEmailHTML(firstName, plan = 'free') {
  const planNames = { free: 'Gratuito', starter: 'Starter', pro: 'Pro' };
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #8b5cf6; margin-top: 0; }
    .content p { line-height: 1.6; color: #d1d5db; }
    .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎨 Bem-vindo ao FLOW!</h1></div>
    <div class="content">
      <h2>Olá, ${firstName}! 👋</h2>
      <p>Sua conta foi criada no plano <strong>${planNames[plan] || 'Gratuito'}</strong>.</p>
      <a href="${frontendUrl}" class="cta">Começar a Criar</a>
    </div>
    <div class="footer"><p>FLOW Designer</p></div>
  </div>
</body>
</html>
    `;
}

function getPaymentConfirmationHTML(firstName, plan, amount) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;">
    <div style="background:#10b981;padding:40px;text-align:center;"><h1>✅ Pagamento Confirmado</h1></div>
    <div style="padding:40px;">
        <h2>Olá ${firstName}!</h2>
        <p>Recebemos seu pagamento de R$ ${amount.toFixed(2)} pelo plano <strong>${plan.toUpperCase()}</strong>.</p>
        <a href="${frontendUrl}" style="background:#10b981;color:white;padding:14px 30px;text-decoration:none;border-radius:8px;display:inline-block;">Acessar Painel</a>
    </div>
  </div>
</body>
</html>`;
}

function getQuotaAlertHTML(firstName, currentUsage, maxImages, plan) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `
<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;color:#fff;font-family:sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;">
    <div style="background:#f59e0b;padding:40px;text-align:center;"><h1>⚠️ Quota Acabando</h1></div>
    <div style="padding:40px;">
        <h2>Opa, ${firstName}!</h2>
        <p>Você usou ${currentUsage}/${maxImages} imagens do plano ${plan}.</p>
        <a href="${frontendUrl}/plans" style="background:#f59e0b;color:white;padding:14px 30px;text-decoration:none;border-radius:8px;display:inline-block;">Fazer Upgrade</a>
    </div>
  </div>
</body>
</html>`;
}

function sendWelcomeEmail(email, firstName, plan = 'free') {
  return sendEmail({ to: email, subject: '🎨 Bem-vindo ao FLOW!', html: getWelcomeEmailHTML(firstName, plan) });
}

function sendPaymentConfirmation(email, firstName, plan, amount) {
  return sendEmail({ to: email, subject: '✅ Pagamento Confirmado', html: getPaymentConfirmationHTML(firstName, plan, amount) });
}

function sendQuotaAlert(email, firstName, currentUsage, maxImages, plan) {
  return sendEmail({ to: email, subject: '⚠️ Alerta de Quota', html: getQuotaAlertHTML(firstName, currentUsage, maxImages, plan) });
}

module.exports = { sendWelcomeEmail, sendPaymentConfirmation, sendQuotaAlert };
