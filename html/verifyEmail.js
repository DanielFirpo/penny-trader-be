module.exports = function createReceiptEmail(username, verifyHash) {

    let verifyEmail = `
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans&display=swap" rel="stylesheet">
    <div style="margin: auto; padding: 50px; max-width: 670px;">
      <h1 style="font-family: 'Nunito Sans', sans-serif; color: black;">Hi ${username},</h1>
      <p style="font-size: 16px; color: #51545E; font-family: 'Nunito Sans', sans-serif; margin-bottom: 20px;">Thanks for signing up for an account with Willy's Penny Co. To complete the registration process, please click the Verify Account button below.</p>
      <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 2px solid  #eaeaec; margin-bottom: 30px;">
      </div>
      <div style="display:block; padding:0.7em 1.7em; margin:0 0.3em 0.3em 0; border-radius:0.2em; box-sizing: border-box; text-decoration:none; font-family:'Roboto',sans-serif; font-weight:400; color:#FFFFFF; background-color:#ffb301; box-shadow:inset 0 -0.6em 1em -0.35em rgba(0,0,0,0.17),inset 0 0.6em 2em -0.3em rgba(255,255,255,0.15),inset 0 0 0em 0.05em rgba(255,255,255,0.12); text-align:center; position:relative; margin-left: auto; margin-right: auto; width: fit-content;">
      <a style="text-decoration: none; color: white;" href="${process.env.FRONT_END_VERIFY_URL + "?hash=" + verifyHash}">Verify Account</a>
      </div>
        <div style="display: flex; justify-content: space-between; padding-bottom: 30px; border-bottom: 2px solid  #eaeaec; margin-bottom: 30px">
      </div>
      
        <p style="font-size: 16px; color: #51545E; font-family: 'Nunito Sans', sans-serif; margin-bottom: 20px;">If you did not sign up for a Willy's Penny Co account, please simply delete or ignore this email, and you won't recieve any more emails from us.</p>
    </div>`

    return verifyEmail;

};