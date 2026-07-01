import { ENV } from "../_core/env";

export const getFoodQuizRebalancerEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>Your Calm Body Reset Results</title>
  </head>
  <body style="margin:0; padding:0; background-color:#fcfaf9;">
    <div role="article" aria-roledescription="email" lang="en" style="background-color:#fcfaf9;">

      <!-- Preheader (hidden) -->
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
        Your Reset Type is here. Take a breath. You’re safe here.
      </div>

      <!-- Outer wrapper -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fcfaf9;">
        <tr>
          <td align="center" style="padding:24px 16px;">

            <!-- Card -->
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:700px; background-color:#ffffff; border:1px solid #eeeeee; border-radius:12px; overflow:hidden;">

              <!-- LOGO -->
              <tr>
                <td align="center" style="padding:26px 24px 10px;">
                  <img src="https://img1.wsimg.com/isteam/ip/a5a9c59b-2adc-48fc-995e-909cdea8df57/blob-0e2bead.png" alt="Mind & Body Reset" width="140" style="display:block; max-width:140px; height:auto;">
                </td>
              </tr>

              <!-- Header -->
              <tr>
                <td style="background-color:#fbeee9; padding:26px 24px; text-align:center;">
                  <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; line-height:1.2; color:#3e5446; font-weight:700;">
                    Your Calm Body Reset Results
                  </div>
                  <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#3e5446; margin-top:8px;">
                    Take a breath. You did the brave thing by starting.
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 24px; font-family:Arial, Helvetica, sans-serif; color:#333333;">
                  <p style="margin:0 0 14px; font-size:16px; line-height:1.7;">
                    Hi ${firstName},
                  </p>

                  <p style="margin:0 0 14px; font-size:16px; line-height:1.7;">
                    I’m really glad you took the quiz.
                  </p>

                  <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                    Your results show that you’re a <strong style="color:#3e5446;">Thoughtful Rebalancer</strong>.
                  </p>

                  <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                    This usually means you’re reflective and self-aware, but your mind gets busy around food.
                    You try to “think it through” and end up second-guessing yourself.
                  </p>

                  <!-- Mini plan box -->
                  <div style="border-left:4px solid #3e5446; background-color:#f9f9f9; padding:14px 16px; margin:18px 0;">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#3e5446; font-weight:700; margin-bottom:10px;">
                      Your Mini Reset Plan
                    </div>
                    <ol style="margin:0; padding-left:18px; color:#555555; font-size:16px; line-height:1.7;">
                      <li style="margin:0 0 8px;">Replace “I blew it” with “I’m learning.”</li>
                      <li style="margin:0 0 0;">Eat one meal slowly and without distractions.</li>
                    </ol>
                  </div>

                  <!-- Keyline -->
                  <div style="background-color:#eaf0eb; border-radius:9999px; padding:16px; margin:18px 0;">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:16px; line-height:1.6; color:#3e5446; font-weight:700; text-align:center;">
                      You don’t need more rules. You need more trust.
                    </div>
                  </div>

                  <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">
                    If you’re thinking, “I feel seen, but I’m not sure what to do next,” a clarity call is a calm next step.
                    We’ll talk through what’s really going on and map a simple plan forward.
                  </p>

                  <!-- Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
                    <tr>
                      <td align="center" bgcolor="#c9a96e" style="border-radius:9999px;">
                        <a href="https://mindandbodyresetcoach.com/ola/services/consultation" style="display:inline-block; padding:14px 36px; font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#ffffff; text-decoration:none; font-weight:700;">
                          Book Your Free Clarity Call
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:14px 0 0; font-size:14px; line-height:1.7; color:#555555; text-align:center;">
                    You don’t have to do this perfectly. You don’t have to do it alone. You’re safe here.
                  </p>

                  <p style="margin:18px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.1; color:#333333; text-align:center;">
                    LeeAnne Chapman
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 24px; background-color:#fcfaf9; border-top:1px solid #eeeeee; font-family:Arial, Helvetica, sans-serif; color:#777777; font-size:12px; line-height:1.6; text-align:center;">
                  <div style="margin-bottom:8px;">
                    <a href="${ENV.appPublicUrl}" style="color:#777777; text-decoration:underline;">Update preferences</a>
                    &nbsp;|&nbsp;
                    <a href="${ENV.appPublicUrl}" style="color:#777777; text-decoration:underline;">Unsubscribe</a>
                  </div>
                  <div>
                    
                  </div>
                </td>
              </tr>

            </table>
            <!-- /Card -->

          </td>
        </tr>
      </table>
      <!-- /Outer wrapper -->
    </div>
  </body>
</html>
`
});

export const getFoodQuizDoerEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Your Calm Body Reset Results</title>
</head>
<body style="margin:0; padding:0; background-color:#fcfaf9;">
  <div role="article" aria-roledescription="email" lang="en">

    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Your Reset Type is here. Take a breath. You’re safe here.
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fcfaf9;">
      <tr>
        <td align="center" style="padding:24px 16px;">

          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px; background:#ffffff; border:1px solid #eee; border-radius:12px;">

            <!-- LOGO -->
            <tr>
              <td align="center" style="padding:26px 24px 10px;">
                <img src="https://img1.wsimg.com/isteam/ip/a5a9c59b-2adc-48fc-995e-909cdea8df57/blob-0e2bead.png" alt="Mind & Body Reset" width="140" style="display:block;">
              </td>
            </tr>

            <!-- HEADER -->
            <tr>
              <td style="background:#fbeee9; padding:20px; text-align:center;">
                <div style="font-family:Georgia, serif; font-size:22px; color:#3e5446; font-weight:700;">
                  Your Calm Body Reset Results
                </div>
                <div style="font-size:14px; color:#3e5446; margin-top:8px;">
                  You’re exactly where you need to be.
                </div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:28px 24px; font-family:Arial, sans-serif; color:#333;">
                <p style="font-size:16px; line-height:1.7;">Hi ${firstName},</p>

                <p style="font-size:16px; line-height:1.7;">
                  Your results show that you’re a <strong style="color:#3e5446;">Disconnected Doer</strong>.
                </p>

                <p style="font-size:16px; line-height:1.7;">
                  You’re capable and committed, but you’ve been doing instead of listening.
                  Plans are followed, but your body feels out of sync.
                </p>

                <!-- MINI PLAN -->
                <div style="border-left:4px solid #3e5446; background:#f9f9f9; padding:14px 16px; margin:18px 0;">
                  <strong style="color:#3e5446;">Your Mini Reset Plan</strong>
                  <ol style="margin-top:10px; padding-left:18px;">
                    <li>Finish dinner by 7pm for one night.</li>
                    <li>Notice one body signal each day.</li>
                  </ol>
                </div>

                <div style="background:#eaf0eb; padding:16px; border-radius:9999px; text-align:center; font-weight:700; color:#3e5446;">
                  Your body doesn’t need pressure. It needs connection.
                </div>

                <p style="font-size:16px; line-height:1.7; margin-top:18px;">
                  A clarity call can help you reconnect without forcing anything.
                </p>

                <!-- CTA -->
                <table align="center" cellpadding="0" cellspacing="0" style="margin:20px auto;">
                  <tr>
                    <td bgcolor="#c9a96e" style="border-radius:9999px;">
                      <a href="https://mindandbodyresetcoach.com/ola/services/consultation" style="display:block; padding:14px 36px; color:#fff; text-decoration:none; font-weight:700;">
                        Book Your Free Clarity Call
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="text-align:center; font-size:14px; color:#555;">
                  Calm comes first. Everything else follows.
                </p>

                <p style="text-align:center; font-family:Georgia, serif; font-size:26px;">
                  LeeAnne Chapman
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="text-align:center; font-size:12px; color:#777; padding:18px;">
                <a href="${ENV.appPublicUrl}">Update preferences</a> |
                <a href="${ENV.appPublicUrl}">Unsubscribe</a><br>
                
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`
});

export const getFoodQuizAchieverEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>Your Calm Body Reset Results</title>
  </head>
  <body style="margin:0; padding:0; background-color:#fcfaf9;">
    <div role="article" aria-roledescription="email" lang="en" style="background-color:#fcfaf9;">

      <!-- Preheader -->
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
        You don’t need more discipline. You need a rhythm that works.
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fcfaf9;">
        <tr>
          <td align="center" style="padding:24px 16px;">

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:700px; background-color:#ffffff; border:1px solid #eeeeee; border-radius:12px; overflow:hidden;">

              <!-- LOGO -->
              <tr>
                <td align="center" style="padding:26px 24px 10px;">
                  <img src="https://img1.wsimg.com/isteam/ip/a5a9c59b-2adc-48fc-995e-909cdea8df57/blob-0e2bead.png" alt="Mind & Body Reset" width="140" style="display:block; max-width:140px; height:auto;">
                </td>
              </tr>

              <!-- Header -->
              <tr>
                <td style="background-color:#fbeee9; padding:26px 24px; text-align:center;">
                  <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; line-height:1.2; color:#3e5446; font-weight:700;">
                    Your Calm Body Reset Results
                  </div>
                  <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#3e5446; margin-top:8px;">
                    You’re exactly where you need to be.
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 24px; font-family:Arial, Helvetica, sans-serif; color:#333333;">

                  <p style="margin:0 0 14px; font-size:16px; line-height:1.7;">Hi ${firstName},</p>

                  <p style="margin:0 0 14px; font-size:16px; line-height:1.7;">
                    I’m really glad you took the quiz.
                  </p>

                  <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                    Your results show that you’re an <strong style="color:#3e5446;">All-In Achiever</strong>.
                  </p>

                  <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                    This means you’re motivated, capable, and serious when you commit.
                    You go all in, see progress, and then hit burnout.
                  </p>

                  <!-- Mini plan -->
                  <div style="border-left:4px solid #3e5446; background-color:#f9f9f9; padding:14px 16px; margin:18px 0;">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#3e5446; font-weight:700; margin-bottom:10px;">
                      Your Mini Reset Plan
                    </div>
                    <ol style="margin:0; padding-left:18px; color:#555555; font-size:16px; line-height:1.7;">
                      <li style="margin:0 0 8px;">Aim for 80 percent instead of 100.</li>
                      <li style="margin:0 0 0;">Celebrate consistency, not intensity.</li>
                    </ol>
                  </div>

                  <div style="background-color:#eaf0eb; border-radius:9999px; padding:16px; margin:18px 0;">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:16px; line-height:1.6; color:#3e5446; font-weight:700; text-align:center;">
                      You don’t need to push harder. You need balance that lasts.
                    </div>
                  </div>

                  <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">
                    If you’re tired of the all-in, burn-out cycle, a clarity call is a calm next step.
                    We’ll build a rhythm that actually works for your life.
                  </p>

                  <!-- Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
                    <tr>
                      <td align="center" bgcolor="#c9a96e" style="border-radius:9999px;">
                        <a href="https://mindandbodyresetcoach.com/ola/services/consultation" style="display:inline-block; padding:14px 36px; font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#ffffff; text-decoration:none; font-weight:700;">
                          Book Your Free Clarity Call
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:14px 0 0; font-size:14px; line-height:1.7; color:#555555; text-align:center;">
                    Sustainable progress starts with calm.
                  </p>

                  <p style="margin:18px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.1; color:#333333; text-align:center;">
                    LeeAnne Chapman
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 24px; background-color:#fcfaf9; border-top:1px solid #eeeeee; font-family:Arial, Helvetica, sans-serif; color:#777777; font-size:12px; line-height:1.6; text-align:center;">
                  <a href="${ENV.appPublicUrl}" style="color:#777777; text-decoration:underline;">Update preferences</a>
                  &nbsp;|&nbsp;
                  <a href="${ENV.appPublicUrl}" style="color:#777777; text-decoration:underline;">Unsubscribe</a><br>
                  
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`
});

export const getFoodQuizFeelerEmail = (firstName: string) => ({
  subject: "Your Calm Body Reset Results",
  html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>Your Calm Body Reset Results</title>
  </head>
  <body style="margin:0; padding:0; background-color:#fcfaf9;">
    <div role="article" aria-roledescription="email" lang="en" style="background-color:#fcfaf9;">

      <!-- Preheader -->
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
        Your sensitivity is a strength. Let’s work with it.
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fcfaf9;">
        <tr>
          <td align="center" style="padding:24px 16px;">

            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:700px; background-color:#ffffff; border:1px solid #eeeeee; border-radius:12px; overflow:hidden;">

              <!-- LOGO -->
              <tr>
                <td align="center" style="padding:26px 24px 10px;">
                  <img src="https://img1.wsimg.com/isteam/ip/a5a9c59b-2adc-48fc-995e-909cdea8df57/blob-0e2bead.png" alt="Mind & Body Reset" width="140" style="display:block; max-width:140px; height:auto;">
                </td>
              </tr>

              <!-- Header -->
              <tr>
                <td style="background-color:#fbeee9; padding:26px 24px; text-align:center;">
                  <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; line-height:1.2; color:#3e5446; font-weight:700;">
                    Your Calm Body Reset Results
                  </div>
                  <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#3e5446; margin-top:8px;">
                    You don’t have to carry this alone.
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 24px; font-family:Arial, Helvetica, sans-serif; color:#333333;">

                  <p style="margin:0 0 14px; font-size:16px; line-height:1.7;">Hi ${firstName},</p>

                  <p style="margin:0 0 14px; font-size:16px; line-height:1.7;">
                    I’m really glad you took the quiz.
                  </p>

                  <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                    Your results show that you’re a <strong style="color:#3e5446;">Compassionate Feeler</strong>.
                  </p>

                  <p style="margin:0 0 16px; font-size:16px; line-height:1.7;">
                    This means you feel deeply and often turn to food for comfort when emotions run high.
                    Guilt usually follows — not because you failed, but because you care.
                  </p>

                  <!-- Mini plan -->
                  <div style="border-left:4px solid #3e5446; background-color:#f9f9f9; padding:14px 16px; margin:18px 0;">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:18px; color:#3e5446; font-weight:700; margin-bottom:10px;">
                      Your Mini Reset Plan
                    </div>
                    <ol style="margin:0; padding-left:18px; color:#555555; font-size:16px; line-height:1.7;">
                      <li style="margin:0 0 8px;">Pause for one minute before emotional eating.</li>
                      <li style="margin:0 0 0;">Name the emotion without judging it.</li>
                    </ol>
                  </div>

                  <div style="background-color:#eaf0eb; border-radius:9999px; padding:16px; margin:18px 0;">
                    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:16px; line-height:1.6; color:#3e5446; font-weight:700; text-align:center;">
                      You don’t need willpower. You need compassion.
                    </div>
                  </div>

                  <p style="margin:0 0 18px; font-size:16px; line-height:1.7;">
                    A clarity call can help you learn how to care for yourself without guilt
                    and build tools that actually support you.
                  </p>

                  <!-- Button -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
                    <tr>
                      <td align="center" bgcolor="#c9a96e" style="border-radius:9999px;">
                        <a href="https://mindandbodyresetcoach.com/ola/services/consultation" style="display:inline-block; padding:14px 36px; font-family:Arial, Helvetica, sans-serif; font-size:16px; color:#ffffff; text-decoration:none; font-weight:700;">
                          Book Your Free Clarity Call
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:14px 0 0; font-size:14px; line-height:1.7; color:#555555; text-align:center;">
                    You’re allowed to need support.
                  </p>

                  <p style="margin:18px 0 0; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.1; color:#333333; text-align:center;">
                    LeeAnne Chapman
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:18px 24px; background-color:#fcfaf9; border-top:1px solid #eeeeee; font-family:Arial, Helvetica, sans-serif; color:#777777; font-size:12px; line-height:1.6; text-align:center;">
                  <a href="${ENV.appPublicUrl}" style="color:#777777; text-decoration:underline;">Update preferences</a>
                  &nbsp;|&nbsp;
                  <a href="${ENV.appPublicUrl}" style="color:#777777; text-decoration:underline;">Unsubscribe</a><br>
                  
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    </div>
  </body>
</html>

Nurture Email 1`
});
