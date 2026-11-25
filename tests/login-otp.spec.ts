import { test, expect, Page } from '@playwright/test';
import { OtpLoginPage } from './pages/otp-login.page';

const urlOtpLogin = process.env.URL_OTP_LOGIN;

type OtpSubmission =
  | { type: 'valid' }
  | { type: 'incorrect' }
  | { type: 'incomplete'; digitsToEnter: number };

type OtpTestCase =
  | {
      name: string;
      type: 'username-required';
      username: '';
    }
  | {
      name: string;
      type: 'submit-otp';
      username: string;
      otp: OtpSubmission;
      expectedMessage: string;
    };

const otpTestCases: OtpTestCase[] = [
  {
    name: 'keeps OTP fetching disabled when the username is empty',
    type: 'username-required',
    username: '',
  },
  {
    name: 'logs in with a valid OTP',
    type: 'submit-otp',
    username: 'PlaywrightAITester',
    otp: { type: 'valid' },
    expectedMessage: 'Login successful! Welcome, PlaywrightAITester.',
  },
  {
    name: 'rejects an OTP with fewer than six digits',
    type: 'submit-otp',
    username: 'PlaywrightAITester',
    otp: { type: 'incomplete', digitsToEnter: 5 },
    expectedMessage: 'Please enter all 6 OTP digits.',
  },
  {
    name: 'rejects an incorrect OTP',
    type: 'submit-otp',
    username: 'PlaywrightAITester',
    otp: { type: 'incorrect' },
    expectedMessage: 'Invalid OTP. Check the code and try again.',
  },
];

async function openOtpLogin(page: Page): Promise<OtpLoginPage> {
  if (!urlOtpLogin) {
    throw new Error('URL_OTP_LOGIN is missing. Set it in the project root .env file.');
  }

  const otpLoginPage = new OtpLoginPage(page);
  await otpLoginPage.goto(urlOtpLogin);
  await otpLoginPage.acceptCookieConsent();
  await otpLoginPage.openOtpLogin();

  return otpLoginPage;
}

async function fetchOtpForUsername(
  otpLoginPage: OtpLoginPage,
  username: string,
): Promise<string> {
  await otpLoginPage.enterUsername(username);
  return otpLoginPage.fetchOtp();
}

function createOtpInput(validOtp: string, submission: OtpSubmission): string {
  switch (submission.type) {
    case 'valid':
      return validOtp;
    case 'incorrect': {
      const lastDigit = Number(validOtp[validOtp.length - 1]);
      return `${validOtp.slice(0, -1)}${(lastDigit + 1) % 10}`;
    }
    case 'incomplete':
      return validOtp.slice(0, submission.digitsToEnter);
  }
}

for (const testCase of otpTestCases) {
  test(testCase.name, async ({ page }) => {
    const otpLoginPage = await openOtpLogin(page);

    if (testCase.type === 'username-required') {
      await otpLoginPage.enterUsername(testCase.username);
      await expect(otpLoginPage.fetchOtpButton).toBeDisabled();
      return;
    }

    const validOtp = await fetchOtpForUsername(otpLoginPage, testCase.username);
    const otpInput = createOtpInput(validOtp, testCase.otp);
    await otpLoginPage.enterOtp(otpInput);
    await otpLoginPage.submit();

    await expect(otpLoginPage.loginMessage).toContainText(
      testCase.expectedMessage,
    );
  });
}