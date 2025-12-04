const crypto = require('crypto');

/**
 * Email Service using Resend API
 * Free tier: 3000 emails/month
 * Docs: https://resend.com/docs
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // Change to your verified domain

/**
 * Send email via Resend API
 */
async function sendEmail({ to, subject, html }) {
    if (!RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY not configured. Email not sent.');
        return { success: false, error: 'API key missing' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [to],
                subject,
                html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Resend API Error:', data);
            return { success: false, error: data.message };
        }

        console.log('✅ Email sent:', data.id);
        return { success: true, id: data.id };
    } catch (error) {
        console.error('❌ Email send failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Welcome Email Template
 */
function getWelcomeEmailHTML(firstName, plan = 'free') {
    const planNames = {
        free: 'Gratuito',
        starter: 'Starter',
        pro: 'Pro'
    };

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
    <div class="header">
      <h1>🎨 Bem-vindo ao FLOW!</h1>
    </div>
    <div class="content">
      <h2>Olá, ${firstName}! 👋</h2>
      <p>Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.</p>
      <p><strong>Plano Atual:</strong> ${planNames[plan] || 'Gratuito'}</p>
      <p>Você já pode começar a criar flyers profissionais incríveis com inteligência artificial.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta">Começar a Criar</a>
      <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
        Dica: Explore os diferentes estilos disponíveis e deixe a IA criar designs únicos para o seu negócio!
      </p>
    </div>
    <div class="footer">
      <p>FLOW Designer - Criando o futuro do design com IA</p>
      <p>Se você não criou esta conta, ignore este email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Payment Confirmation Email Template
 */
function getPaymentConfirmationHTML(firstName, plan, amount) {
    const planNames = {
        starter: 'Starter - 50 imagens/mês',
        pro: 'Pro - 200 imagens/mês'
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #10b981; margin-top: 0; }
    .content p { line-height: 1.6; color: #d1d5db; }
    .receipt { background: #1f2937; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #374151; }
    .receipt-row:last-child { border-bottom: none; font-weight: 700; font-size: 18px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Pagamento Confirmado!</h1>
    </div>
    <div class="content">
      <h2>Obrigado, ${firstName}!</h2>
      <p>Seu pagamento foi processado com sucesso. Sua conta foi atualizada para o plano <strong>${planNames[plan]}</strong>.</p>
      
      <div class="receipt">
        <div class="receipt-row">
          <span>Plano:</span>
          <span>${planNames[plan]}</span>
        </div>
        <div class="receipt-row">
          <span>Valor:</span>
          <span>R$ ${amount.toFixed(2)}</span>
        </div>
        <div class="receipt-row">
          <span>Status:</span>
          <span style="color: #10b981;">✓ Confirmado</span>
        </div>
      </div>

      <p>Você já pode aproveitar todos os benefícios do seu novo plano!</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta">Acessar Minha Conta</a>
    </div>
    <div class="footer">
      <p>FLOW Designer - Criando o futuro do design com IA</p>
      <p>Dúvidas? Entre em contato conosco.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Quota Alert Email Template
 */
function getQuotaAlertHTML(firstName, currentUsage, maxImages, plan) {
    const percentage = Math.round((currentUsage / maxImages) * 100);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #f59e0b; margin-top: 0; }
    .content p { line-height: 1.6; color: #d1d5db; }
    .progress-bar { background: #1f2937; border-radius: 8px; height: 24px; overflow: hidden; margin: 20px 0; }
    .progress-fill { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; }
    .cta { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { background: #0a0a0a; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Quota Quase Esgotada</h1>
    </div>
    <div class="content">
      <h2>Olá, ${firstName}!</h2>
      <p>Você está usando <strong>${currentUsage} de ${maxImages}</strong> imagens do seu plano ${plan.toUpperCase()}.</p>
      
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%">${percentage}%</div>
      </div>

      <p>Para continuar criando designs incríveis sem interrupções, considere fazer upgrade do seu plano!</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/plans" class="cta">Ver Planos</a>
    </div>
    <div class="footer">
      <p>FLOW Designer - Criando o futuro do design com IA</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Public API
 */
async function sendWelcomeEmail(email, firstName, plan = 'free') {
    return sendEmail({
        to: email,
        subject: '🎨 Bem-vindo ao FLOW Designer!',
        html: getWelcomeEmailHTML(firstName, plan)
    });
}

async function sendPaymentConfirmation(email, firstName, plan, amount) {
    return sendEmail({
        to: email,
        subject: '✅ Pagamento Confirmado - FLOW Designer',
        html: getPaymentConfirmationHTML(firstName, plan, amount)
    });
}

async function sendQuotaAlert(email, firstName, currentUsage, maxImages, plan) {
    return sendEmail({
        to: email,
        subject: '⚠️ Sua quota está quase esgotada - FLOW Designer',
        html: getQuotaAlertHTML(firstName, currentUsage, maxImages, plan)
    });
}

module.exports = {
    sendWelcomeEmail,
    sendPaymentConfirmation,
    sendQuotaAlert
};
