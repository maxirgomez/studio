import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  try {
    // Verificar que las credenciales SMTP estén configuradas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error("Credenciales SMTP no configuradas. Verifica SMTP_USER y SMTP_PASSWORD en tu archivo .env");
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        // Ignorar certificados autofirmados en desarrollo
        rejectUnauthorized: process.env.NODE_ENV !== 'development'
      }
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
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw error;
  }
} 