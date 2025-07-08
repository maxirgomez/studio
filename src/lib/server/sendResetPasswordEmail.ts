import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Restablece tu contraseña",
    html: `<p>Haz click en el siguiente enlace para restablecer tu contraseña:</p>
           <p><a href="${resetLink}">${resetLink}</a></p>
           <p>Si no solicitaste este cambio, ignora este correo.</p>`
  });
  return info;
} 