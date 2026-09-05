/**
 * ============================================
 * OJABRIDGE AUTHENTICATION UTILITIES
 * ============================================
 * 
 * JWT token generation/verification
 * Password hashing with bcrypt
 * Session management via HTTP-only cookies
 * Role-based access control
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

// ============================================
// PASSWORD UTILITIES
// ============================================

/**
 * Hash a password with bcrypt (12 rounds)
 */
export async function hashPassword(password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, rounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must include an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must include a lowercase letter');
  if (!/\d/.test(password)) errors.push('Password must include a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must include a special character');
  return errors;
}

// ============================================
// JWT TOKEN UTILITIES
// ============================================

/**
 * Generate an access token
 */
export async function generateAccessToken(user) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setIssuer('ojabridge')
    .setAudience('ojabridge-api')
    .sign(JWT_SECRET);
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(user) {
  return new SignJWT({
    sub: user.id,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .setIssuer('ojabridge')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'ojabridge',
    });
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// ============================================
// SESSION UTILITIES
// ============================================

/**
 * Set auth cookies on a NextResponse
 */
export function setAuthCookies(response, accessToken, refreshToken) {
  // Access token — HTTP-only, secure, same-site
  response.cookies.set('ob_access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Refresh token
  response.cookies.set('ob_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}

/**
 * Clear auth cookies
 */
export function clearAuthCookies(response) {
  response.cookies.set('ob_access_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  response.cookies.set('ob_refresh_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  return response;
}

/**
 * Extract user from request cookies (for middleware/server components)
 */
export async function getUserFromRequest(request) {
  const token = request.cookies.get('ob_access_token')?.value;
  if (!token) return null;

  const { valid, payload } = await verifyToken(token);
  if (!valid) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
}

// ============================================
// ACCESS CONTROL
// ============================================

/**
 * Require a specific role — returns error response if unauthorized
 */
export function requireRole(user, ...allowedRoles) {
  if (!user) {
    return { authorized: false, error: 'Authentication required', status: 401 };
  }
  if (!allowedRoles.includes(user.role)) {
    return { authorized: false, error: 'Insufficient permissions', status: 403 };
  }
  return { authorized: true };
}

/**
 * Require authentication
 */
export function requireAuth(user) {
  if (!user) {
    return { authorized: false, error: 'Authentication required', status: 401 };
  }
  return { authorized: true };
}

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Common disposable/temporary email domains — block these from registering
 */
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com','throwaway.email','guerrillamail.com','mailinator.com',
  'yopmail.com','temp-mail.org','fakeinbox.com','sharklasers.com',
  'guerrillamailblock.com','grr.la','dispostable.com','maildrop.cc',
  'tempail.com','temp-mail.io','10minutemail.com','trashmail.com',
  'burnermail.io','harakirimail.com','mohmal.com','emailondeck.com',
  'getnada.com','tmpmail.net','discard.email','discardmail.com',
  'discardmail.fr','mailexpire.com','tempinbox.com','tempinbox.co.uk',
  'mailforspam.com','spamgourmet.com','mytemp.email','tmpmail.org',
  'tempmailo.com','mailnesia.com','mailcatch.com','jetable.org',
  'boun.cr','bouncr.com','chacuo.net','ephemail.net','fakemail.fr',
  'getairmail.com','h8s.org','hulapla.de','ichimail.com',
  'jnxjn.com','jsrsolutions.com','kurzepost.de','mailblocks.com',
  'mailbucket.org','mailcat.biz','maileater.com','mailed.ro',
  'maileimer.de','mailfa.tk','mailfree.ga','mailfree.gq',
  'mailfree.ml','mailfree.tk','mailfs.com','mailguard.me',
  'mailhazard.com','mailhz.me','mailimate.com','mailin8r.com',
  'mailinater.com','mailinator.net','mailinator.org','mailinator.us',
  'mailinator2.com','mailincubator.com','mailismagic.com',
  'mailme.ir','mailme.lv','mailme24.com','mailmetrash.com',
  'mailmoat.com','mailnator.com','mailnull.com','mailorg.org',
  'mailpick.biz','mailproxsy.com','mailquack.com','mailrock.biz',
  'mailscrap.com','mailshell.com','mailsiphon.com','mailslite.com',
  'mailtemp.info','mailtome.de','mailtothis.com','mailtrash.net',
  'mailtv.net','mailtv.tv','mailvelope.com','mailwand.de',
  'mailzilla.com','mailzilla.org','makemetheking.com','manybrain.com',
  'mbx.cc','mega.zik.dj','meinspamschutz.de','meltmail.com',
  'messagebeamer.de','mezimages.net','mfsa.ru','mierdamail.com',
  'migmail.pl','migmail.pw','migumail.com','mindless.com',
  'mintemail.com','misterpinball.de','mmmmail.com','moakt.com',
  'moncourrier.fr','monemail.fr','monmail.fr','monumentmail.com',
  'my10minutemail.com','myalias.pw','mycard.net.ua','mycleaninbox.net',
  'myemailboxy.com','mymail-in.net','mymailoasis.com','mymail.tel',
  'mymailtray.com','mymailx.org','mytemp.email','mytempemail.com',
  'mytempemail.org','mytempmail.com','mytempmailer.com','mytempmail.ru',
  'mymojo.pt','nabala.com','neomailbox.com','nepwk.com','nervmich.net',
  'nervtansen.de','netmails.com','netmails.net','netzidiot.de','neverbox.com',
  'nice-4u.com','nincsmail.hu','nnh.com','no-spam.ws','nobulk.com',
  'noclickemail.com','nogmailspam.info','nomail.xl.cx','nomail2me.com',
  'nomailthanks.com','nomorespamemails.com','nonspam.eu','nonspammer.de',
  'noref.in','nospam.ze.tc','nospam4.us','nospamcafe.com',
  'nospamfor.us','nospammail.net','nospamthanks.info',
  'nothingtoseehere.ca','nowmymail.com','nurfuerspam.de','nwldx.com',
  'objectmail.com','obobbo.com','odnorazovoe.ru','oneoffemail.com',
  'onewaymail.com','oopi.org','ordinaryamerican.net','otherinbox.com',
  'ourklips.com','outlawspam.com','ovpn.to','owlpic.com',
  'pancakemail.com','pimpedupmyspace.com','pjjkp.com','plexolan.de',
  'politikerclub.de','poofy.org','pookmail.com','privacy.net',
  'privatdemail.net','proxymail.eu','prtnx.com','punkass.com',
  'putthisinyouremail.com','quickinbox.com','quickmail.nl','rcpt.at',
  'reallymymail.com','realtyalerts.ca','recode.me','recursor.net',
  'regbypass.com','rejectmail.com','reliable-mail.com','rhyta.com',
  'rklips.com','rmqkr.net','royal.net','rppkn.com','rtrtr.com','s0ny.net',
  'safe-mail.net','safersignup.de','safetymail.info','safetypost.de',
  'sandelf.de','saynotospams.com','scatmail.com','schafmail.de',
  'schrott-email.de','secretemail.de','secure-mail.biz',
  'selfdestructingmail.com','sendspamhere.com','shiftmail.com',
  'shitmail.me','shitmail.org','shitware.nl','shmeriously.com',
  'shortmail.net','sibmail.com','sinnlos-mail.de','skeefmail.com',
  'slaskpost.se','slipry.net','slopsbox.com','slowslow.de',
  'slutty.horse','smap.ubs.fr','smailpro.com','smallnetar.com',
  'smashmail.de','smellfear.com','snakemail.com','sneakemail.com',
  'sneakymail.de','snkmail.com','sofimail.com','sofort-mail.de',
  'softpls.asia','sogetthis.com','soodonims.com','spam.la','spam.su',
  'spam4.me','spamavert.com','spambob.com','spambob.net','spambob.org',
  'spambog.com','spambog.de','spambog.ru','spambox.info','spambox.us',
  'spamcannon.com','spamcannon.net','spamcero.com','spamcorptastic.com',
  'spamcowboy.com','spamcowboy.net','spamcowboy.org','spamday.com',
  'spamex.com','spamfree.eu','spamfree24.com','spamfree24.de',
  'spamfree24.eu','spamfree24.info','spamfree24.net','spamfree24.org',
  'spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'spamherelots.com','spamhereplease.com','spamhole.com','spamify.com',
  'spaminator.de','spamkill.info','spaml.com','spaml.de','spamlots.com',
  'spamlouis.com','spamoff.de','spamslicer.com','spamspot.com',
  'spamstack.net','spamthis.co.uk','spamthisplease.com','spamtrail.com',
  'spamtrap.ro','speed.1s.fr','spoofmail.de','stuffmail.de',
  'supergreatmail.com','supermailer.jp','superrito.com','surfsup.de',
  'suspected.tk','swissmail.com','swissmail.fr','swissmail.net',
  'swissmail.org','tafmail.com','tagyoureit.com','talkinator.com',
  'teewars.org','teleworm.com','teleworm.us','temp-mail.org',
  'temp-mail.ru','temp.bf','tempalias.com','tempester.com',
  'tempemail.biz','tempemail.co.za','tempemail.com','tempemail.net',
  'tempinbox.com','tempinbox.co.uk','tempmail.eu','tempmail.it',
  'tempmail2.com','tempmaildemo.com','tempmailer.com','tempmailer.de',
  'tempomail.fr','temporarily.de','temporario.com','temporario.es',
  'temporaryemail.net','temporaryemail.us','temporaryforwarding.com',
  'temporaryinbox.com','temporarymailaddress.com','tempthe.net',
  'thankyou2010.com','thc.st','thecloudindex.com','thetempmail.com',
  'throwaway.email','tittbit.in','tizi.com','tmailinator.com',
  'toiea.com','toomail.biz','topranklist.de','tradermail.info',
  'trash-amil.com','trash-mail.at','trash-mail.com','trash-mail.de',
  'trash-me.com','trash2009.com','trashdevil.de','trashemail.de',
  'trashmail.at','trashmail.com','trashmail.de','trashmail.me',
  'trashmail.net','trashmail.org','trashmail.ws','trashmailer.com',
  'trashymail.com','trashymail.net','trillianpro.com','turual.com',
  'twinmail.de','tyldd.com','uglyemail.de','umail.net','upliftnow.com',
  'uplipht.com','venompen.com','veryrealliemail.com','vidchart.com',
  'viditag.com','viewcastmedia.com','viewcastmedia.net',
  'viewcastmedia.org','vomoto.com','vpn.st','vsimcard.com','vubby.com',
  'wasteland.rfc822.org','webemail.me','weg-werf-email.de',
  'wegwerfadresse.de','wegwerfemail.com','wegwerfemail.de',
  'wegwerfmail.de','wegwerfmail.net','wegwerfmail.org',
  'wh4f.org','whatiaas.com','whatpaas.com','whyspam.me',
  'wikidocuslice.com','willhackforfood.biz','willselfdestruct.com',
  'winemaven.info','wronghead.com','wuzup.net','wuzupmail.net',
  'wwwnew.eu','xagloo.com','xemaps.com','xents.com','xjoi.com',
  'xmaily.com','xoxy.net','yapped.net','yeah.net','yopmail.com',
  'yopmail.fr','yopmail.gq','yopmail.net','yourdomain.com',
  'yourlivesucks.com','yubc.net','yuurok.com','zaumm.co',
  'zehnminutenmail.de','guerrillamail.de','guerrillamail.info',
  'guerrillamail.biz','guerrillamail.se','guerrillamailblock.com',
  'gustr.com','hacply.com','herp.in','hidemail.de','hidzz.com',
  'hmamail.com','hopemail.biz','hot-mail.cf','hot-mail.co.uk',
  'hot-mail.com','hot-mail.gq','hot-mail.info','hot-mail.ltd',
  'hot-mail.me','hot-mail.net','hot-mail.org','hotpop.com',
  'hushmail.com','imails.info','inbox.si','inbox0.info','inbox13.com',
  'inbox25.com','inboxclean.com','inboxclean.org','inboxproxy.com',
  'incognitomail.com','incognitomail.org','ineec.net','infocom.zp.ua',
  'inoutmail.de','inoutmail.info','inoutmail.net','insorg-mail.info',
  'ipoo.org','irish2me.com','iwi.net','jetable.com','jetable.fr.nf',
  'jetable.net','jetable.org','jourrapide.com','junk1e.com','junkmail.com',
  'junkmail.ga','junkmail.gq','junkmail.me','junkmail.ro','kasmail.com',
  'kaspop.com','keepmymail.com','killmail.com','killmail.net',
  'klassmaster.com','klassmaster.net','klzlk.com','lawlita.com',
  'letthemeatspam.com','lhs.com','lhs.name','ljdaguen.com',
  'llycrypto.com','loginic.cf','loginic.gq','loginic.ml','loginic.tk',
  'lookugly.com','lortemail.dk','lovemeleaveme.com','lr78.com',
  'lroid.com','lukop.dk','m21.cc','maboard.com',
  'mail-temporaire.fr','mail.by','mail114.net','mail1a.de',
  'mail21.cc','mail2rss.org','mail333.com','mail4t.com',
  'mail626.us','maila.gizza','maila.pw','mailally.net','mailb.in',
  'mailba.sg','mailbash.com','mailbc.de','mailbelong.com','mailbin.net',
  'mailblog.biz','maildrop.cc','maildu.de','maildx.com',
  'maileater.com','mailed.ro','maileimer.de','mailexpire.com',
  'mailfa.tk','mailforspam.com','mailfree.ga','mailfree.gq',
  'mailfree.ml','mailfree.online','mailfree.tk','mailfs.com',
  'mailguard.me','mailhazard.com','mailhazard.us','mailhz.me',
  'mailimate.com','mailin8r.com','mailinater.com','mailinator.com',
  'mailinator.net','mailinator.org','mailinator.us','mailinator2.com',
  'mailincubator.com','mailismagic.com','mailmate1.com','mailme.ir',
  'mailme.lv','mailme24.com','mailmetrash.com','mailmoat.com',
  'mailnator.com','mailnull.com','mailorg.org','mailpick.biz',
  'mailproxsy.com','mailquack.com','mailrock.biz','mailscrap.com',
  'mailshell.com','mailsiphon.com','mailslite.com','mailtemp.info',
  'mailtome.de','mailtothis.com','mailtrash.net','mailtv.net',
  'mailtv.tv','mailvelope.com','mailwand.de','mailwoll.com',
  'mailwoll.net','mailzilla.com','mailzilla.org','makemetheking.com',
  'manifestgenerator.com','manybrain.com','mbx.cc','mega.zik.dj',
  'meinspamschutz.de','meltmail.com','messagebeamer.de',
  'mezimages.net','mfsa.ru','mierdamail.com','migmail.pl',
  'migmail.pw','migumail.com','mindless.com','mintemail.com',
  'misterpinball.de','mmmmail.com','moakt.com','mobileninja.co.uk',
  'mobi.web.id','mohmail.com','moncourrier.fr','monemail.fr',
  'monmail.fr','monumentmail.com','msa.minsmail.com','mt2015.com',
  'mx0.wwwnew.eu','my10minutemail.com','myalias.pw','mycard.net.ua',
  'mycleaninbox.net','myemailboxy.com','mymail-in.net','mymailoasis.com',
  'mymail.tel','mymailtray.com','mymailx.org','myphantom.com',
  'myrealmail.com','mysamp.in','mysamp.im','myscene.com',
  'mytemp.email','mytempemail.com','mytempemail.org','mytempmail.com',
  'mytempmailer.com','mytempmail.ru','mymojo.pt','mymopar.com',
  'mynordasto.com','nabala.com','neomailbox.com','nepwk.com',
  'nervmich.net','nervtansen.de','netmails.com','netmails.net',
  'netzidiot.de','neverbox.com','nice-4u.com','nincsmail.hu',
  'nnh.com','no-spam.ws','nobulk.com','noclickemail.com',
  'nogmailspam.info','nomail.xl.cx','nomail2me.com','nomailthanks.com',
  'nomorespamemails.com','nonspam.eu','nonspammer.de','noref.in',
  'nospam.ze.tc','nospam4.us','nospamcafe.com','nospamfor.us',
  'nospammail.net','nospamthanks.info','nothingtoseehere.ca',
  'nowmymail.com','nurfuerspam.de','nwldx.com','objectmail.com',
  'obobbo.com','odnorazovoe.ru','oneoffemail.com','onewaymail.com',
  'oopi.org','ordinaryamerican.net','otherinbox.com','ourklips.com',
  'outlawspam.com','ovpn.to','owlpic.com','pancakemail.com',
  'pimpedupmyspace.com','pjjkp.com','plexolan.de','poczta.onet.pl',
  'politikerclub.de','poofy.org','pookmail.com','privacy.net',
  'privatdemail.net','proxymail.eu','prtnx.com','punkass.com',
  'putthisinyouremail.com','quickinbox.com','quickmail.nl','rcpt.at',
  'reallymymail.com','realtyalerts.ca','recode.me','recursor.net',
  'regbypass.com','rejectmail.com','reliable-mail.com','rhyta.com',
  'rklips.com','rmqkr.net','royal.net','rppkn.com','rtrtr.com',
  's0ny.net','safe-mail.net','safersignup.de','safetymail.info',
  'safetypost.de','sandelf.de','saynotospams.com','scatmail.com',
  'schafmail.de','schrott-email.de','secretemail.de','secure-mail.biz',
  'selfdestructingmail.com','sendspamhere.com','shiftmail.com',
  'shitmail.me','shitmail.org','shitware.nl','shmeriously.com',
  'shortmail.net','sibmail.com','sinnlos-mail.de','skeefmail.com',
  'slaskpost.se','slipry.net','slopsbox.com','slowslow.de',
  'slutty.horse','smap.ubs.fr','smailpro.com','smallnetar.com',
  'smashmail.de','smellfear.com','snakemail.com','sneakemail.com',
  'sneakymail.de','snkmail.com','sofimail.com','sofort-mail.de',
  'softpls.asia','sogetthis.com','soodonims.com','spam.la','spam.su',
  'spam4.me','spamavert.com','spambob.com','spambob.net','spambob.org',
  'spambog.com','spambog.de','spambog.ru','spambox.info','spambox.us',
  'spamcannon.com','spamcannon.net','spamcero.com','spamcorptastic.com',
  'spamcowboy.com','spamcowboy.net','spamcowboy.org','spamday.com',
  'spamex.com','spamfree.eu','spamfree24.com','spamfree24.de',
  'spamfree24.eu','spamfree24.info','spamfree24.net','spamfree24.org',
  'spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'spamherelots.com','spamhereplease.com','spamhole.com','spamify.com',
  'spaminator.de','spamkill.info','spaml.com','spaml.de','spamlots.com',
  'spamlouis.com','spamoff.de','spamslicer.com','spamspot.com',
  'spamstack.net','spamthis.co.uk','spamthisplease.com','spamtrail.com',
  'spamtrap.ro','speed.1s.fr','spoofmail.de','stuffmail.de',
  'supergreatmail.com','supermailer.jp','superrito.com',
  'superstuffed.email','surfsup.de','suspected.tk','swissmail.com',
  'swissmail.fr','swissmail.net','swissmail.org','tafmail.com',
  'tagyoureit.com','talkinator.com','teewars.org','teleworm.com',
  'teleworm.us','temp-mail.org','temp-mail.ru','temp.bf','tempalias.com',
  'tempester.com','tempemail.biz','tempemail.co.za','tempemail.com',
  'tempemail.net','tempinbox.com','tempinbox.co.uk','tempmail.eu',
  'tempmail.it','tempmail2.com','tempmaildemo.com','tempmailer.com',
  'tempmailer.de','tempomail.fr','temporarily.de','temporario.com',
  'temporario.es','temporaryemail.net','temporaryemail.us',
  'temporaryforwarding.com','temporaryinbox.com',
  'temporarymailaddress.com','tempthe.net','thankyou2010.com',
  'thc.st','thecloudindex.com','thetempmail.com','throwaway.email',
  'tittbit.in','tizi.com','tmailinator.com','toiea.com','toomail.biz',
  'topranklist.de','tradermail.info','trash-amil.com','trash-mail.at',
  'trash-mail.com','trash-mail.de','trash-me.com','trash2009.com',
  'trashdevil.de','trashemail.de','trashmail.at','trashmail.com',
  'trashmail.de','trashmail.me','trashmail.net','trashmail.org',
  'trashmail.ws','trashmailer.com','trashymail.com','trashymail.net',
  'trillianpro.com','turual.com','twinmail.de','tyldd.com',
  'uglyemail.de','umail.net','upliftnow.com','uplipht.com',
  'venompen.com','veryrealliemail.com','vidchart.com','viditag.com',
  'viewcastmedia.com','viewcastmedia.net','viewcastmedia.org',
  'vomoto.com','vpn.st','vsimcard.com','vubby.com',
  'wasteland.rfc822.org','webemail.me','weg-werf-email.de',
  'wegwerfadresse.de','wegwerfemail.com','wegwerfemail.de',
  'wegwerfmail.de','wegwerfmail.net','wegwerfmail.org',
  'wetrainbayarea.com','wetrainbayarea.org','wh4f.org','whatiaas.com',
  'whatpaas.com','whyspam.me','wikidocuslice.com','willhackforfood.biz',
  'willselfdestruct.com','winemaven.info','wronghead.com','wuzup.net',
  'wuzupmail.net','wwwnew.eu','xagloo.com','xemaps.com','xents.com',
  'xjoi.com','xmaily.com','xoxy.net','yapped.net','yeah.net',
  'yopmail.com','yopmail.fr','yopmail.gq','yopmail.net',
  'yourdomain.com','yourlivesucks.com','yubc.net','yuurok.com',
  'zaumm.co','zehnminutenmail.de',
]);

/**
 * Common email typos — suggest the correct domain
 */
const EMAIL_TYPO_MAP = {
  'gmil.com':'gmail.com','gmal.com':'gmail.com','gmaill.com':'gmail.com',
  'gmail.co':'gmail.com','gnail.com':'gmail.com','gamil.com':'gmail.com',
  'gamil.co':'gmail.com','gmaol.com':'gmail.com','gmail.com':'gmail.com',
  'yahooo.com':'yahoo.com','yaho.com':'yahoo.com','yahoo.co':'yahoo.com',
  'hotmal.com':'hotmail.com','hotmial.com':'hotmail.com',
  'hotmail.co':'hotmail.com','hotamil.com':'hotmail.com',
  'outlok.com':'outlook.com','outloo.com':'outlook.com',
  'outlook.co':'outlook.com','icloud.co':'icloud.com',
};

function getEmailDomain(email) {
  return email.split('@')[1]?.toLowerCase().trim() || '';
}

/**
 * Validate email — checks format, typos, and disposable domains
 * Returns { valid: boolean, error?: string }
 */
export function validateEmailDetailed(email) {
  if (!email || typeof email !== 'string')
    return { valid: false, error: 'Email address is required' };
  const clean = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))
    return { valid: false, error: 'Please enter a valid email address (e.g. name@example.com)' };
  const domain = getEmailDomain(clean);
  const suggested = EMAIL_TYPO_MAP[domain];
  if (suggested && suggested !== domain)
    return { valid: false, error: `Did you mean ${clean.split('@')[0]}@${suggested}? Please check your email address.` };
  if (DISPOSABLE_DOMAINS.has(domain))
    return { valid: false, error: 'Disposable or temporary email addresses are not allowed. Please use a permanent email (e.g. Gmail, Yahoo, Outlook).' };
  return { valid: true };
}

/**
 * Validate email — boolean for backwards compatibility
 */
export function validateEmail(email) {
  return validateEmailDetailed(email).valid;
}

export function validatePhone(phone) {
  if (!phone) return true; // optional
  return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''));
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

export function generateOrderId() {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `OBJ-${dateStr}-${random}`;
}
