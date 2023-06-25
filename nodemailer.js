const nodemailer = require("nodemailer")
const googleApis = require("googleapis");
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const CLIENT_ID = `821329738164-lfnjprok0b0dl9q0shj7e92f0942ot54.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REFRESH_TOKEN = `1//044PlL3_xsOzACgYIARAAGAQSNwF-L9IrRF1eCPDksIMYyj2AEGIX2vqQd_mTnI3drivMR30pNMjuxRiBgc9Igknurm3vX2SF-OM`;
const authClient = new googleApis.google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
authClient.setCredentials({
  refresh_token: REFRESH_TOKEN,
});
async function mailer(email, userid, token) {
  try {
    const ACCESS_TOKEN = await authClient.getAccessToken();
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "ritiksbs@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: ACCESS_TOKEN,
      },
    });

    const details = {
      from: "ritiksbs@gmail.com",
      to: email,
      subject: "Reset Password",
      text: "Click On The Link To Reset Password",
      html: `<a href="http://localhost:3000/reset/${userid}/${token}"> Reset Link </a>`,
    };
    const result = await transport.sendMail(details);
    return result;
  } catch (err) {
    return err;
  }
}
mailer();

module.exports = mailer;
