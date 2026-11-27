We are implementing reviewed tests for the QA Practice Hub OTP login flow in
Playwright with TypeScript. The existing page object is
`tests/pages/otp-login.page.ts`, and the test file is
`tests/login-otp.spec.ts`.

Approved scenarios and expected results:
[Paste the reviewed scenarios and acceptance criteria.]

Before changing code, summarize the proposed implementation and identify any
remaining unverified assumptions. Do not write or change code until the plan
is approved.

After approval, implement only the approved scenarios and follow these
constraints:
- Reuse the existing `OtpLoginPage`; do not duplicate page locators or
  interactions in the spec.
- Use Playwright locator auto-waiting and `expect` assertions. Do not use
  `waitForTimeout` or other fixed delays.
- Fetch a valid OTP at runtime. Never hardcode or log the OTP.
- Derive invalid or incomplete OTP test data from the fetched OTP.
- Preserve the existing test structure and project conventions.
- Run the relevant Playwright tests and report their results.
