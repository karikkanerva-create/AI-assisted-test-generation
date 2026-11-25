import { expect, Locator, Page } from '@playwright/test';

export class OtpLoginPage {
  readonly usernameInput: Locator;
  readonly fetchOtpButton: Locator;
  readonly submitButton: Locator;
  readonly loginMessage: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByTestId('otp-username');
    this.fetchOtpButton = page.getByTestId('btn-fetch-otp');
    this.submitButton = page.getByTestId('otp-submit');
    this.loginMessage = page.getByTestId('otp-login-message');
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async acceptCookieConsent(): Promise<void> {
    await this.page.getByRole('button', { name: 'Accept' }).click();
  }

  async openOtpLogin(): Promise<void> {
    await this.page.getByRole('link', { name: 'OTP Login' }).click();
  }

  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async fetchOtp(): Promise<string> {
    const popupPromise = this.page.waitForEvent('popup');
    await this.fetchOtpButton.click();

    const popup = await popupPromise;
    const otpDisplay = popup.getByTestId('otp-display');
    await expect(otpDisplay).toHaveText(/\d{6}/);

    const match = (await otpDisplay.innerText()).match(/\d{6}/);
    if (!match) {
      throw new Error('The OTP popup did not contain a six-digit code.');
    }

    return match[0];
  }

  async enterOtp(otp: string): Promise<void> {
    for (const [index, digit] of [...otp].entries()) {
      await this.page.getByTestId(`otp-digit-${index + 1}`).fill(digit);
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
