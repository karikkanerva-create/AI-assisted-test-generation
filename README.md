# AI-Assisted Playwright OTP Testing

This project automates QA Practice Hub's OTP login flow with Playwright and TypeScript. The tests cover successful login and OTP validation scenarios.

## Requirements and setup

- Node.js
- npm

Install the dependencies and, if needed, the Playwright browsers:

```bash
npm install
npx playwright install
```

Create a `.env` file in the project root:

```env
URL_OTP_LOGIN=https://qapracticehub.com/#otp-login
```

`playwright.config.ts` loads the `.env` file from the project root. `.env` is listed in `.gitignore`, so local settings are not committed to the Git repository.

## Running the tests

Run the test suite in Chromium:

```bash
npx playwright test tests/login-otp.spec.ts --project=chromium --workers=1
```

Run the suite in all browsers configured in Playwright:

```bash
npx playwright test tests/login-otp.spec.ts
```

Open the HTML report after a test run:

```bash
npx playwright show-report
```

## How the test was created

### 1. Codegen recording

Playwright Codegen can record browser interactions and generate a draft of the test code:

```bash
npx playwright codegen --target=playwright-test --test-id-attribute=data-testid https://qapracticehub.com/#otp-login
```

Codegen opens a browser and the code generator. Perform the login steps in the browser, and Playwright suggests corresponding locators and actions. The `--test-id-attribute=data-testid` option tells Codegen to use the page's `data-testid` attributes.

Codegen output is a starting point, not a finished test. The recorded code was reviewed and organized to fit the project's needs.

### 2. AI-assisted review and improvement

AI was used to support test development:

- explaining error messages and how Playwright locators work
- accounting for the cookie banner and navigating to the OTP section
- reading the OTP text from the popup and filling the six separate OTP fields
- refactoring the Codegen draft into the Page Object Model

AI suggestions were verified by running the tests. The final test does not print the OTP to the log.

### 3. Page Object Model (POM)

Page locators and actions are managed by the [OtpLoginPage](tests/pages/otp-login.page.ts) class. The test itself, [login-otp.spec.ts](tests/login-otp.spec.ts), describes the scenario and checks that login succeeds.

`OtpLoginPage.fetchOtp()` waits for the popup to open and retrieves the six-digit code. `enterOtp()` fills the page's six fields one digit at a time. This keeps UI details in the page object and lets the test focus on verifying the login flow.

## AI Test Case Generation

In addition to successful login, the test suite covers negative and boundary cases. Expected messages and UI behavior were checked against the application before being added to the tests:

| Scenario | Expected result |
| --- | --- |
| Username is missing | The Fetch OTP button is disabled. |
| Only five OTP digits are entered | The form displays `Please enter all 6 OTP digits.` |
| An incorrect six-digit OTP is entered | The form displays `Invalid OTP. Check the code and try again.` |
| The fetched OTP is entered | Login succeeds, and the welcome message includes the username. |

Example prompt used to brainstorm test cases:

> Suggest positive, negative, and edge cases for OTP login. First provide the preconditions, test data, and expected result. Do not assume the wording of error messages; identify assumptions that need to be verified in the application.

AI suggestions were not treated as ground truth: expected behavior was checked in the application, and the tests were run in Chromium. The incorrect OTP is created by first fetching the valid, dynamic OTP and then changing its last digit; the valid OTP is neither hardcoded nor printed to the log.

## AI Test Data Generation

The scenarios in `tests/login-otp.spec.ts` are stored as typed test data and run as independent Playwright tests. Discriminated unions describe the supported case types: an empty-username validation and OTP submissions using a valid, incorrect, or incomplete code. The incomplete case also specifies how many digits to enter.

The OTP is fetched from the popup at runtime for every submission scenario. Test data derives the input from that value: it uses the fetched code unchanged for a successful login, changes the last digit for an incorrect code, or takes the configured number of leading digits for an incomplete code. This keeps the valid OTP dynamic while making the negative cases repeatable.

The username is a stable practice-test value; no real user data or generated credentials are used. AI helped structure the scenario data, and the generated cases were reviewed and verified by running the tests.

## Prompt Engineering for QA

This project uses a two-step prompt workflow so test intent is reviewed before implementation:

1. **Plan first; do not write code yet.** Ask AI to list assumptions, test data, and expected results. Each assumption must be labeled as verified or unverified. Unverified behavior must not be presented as fact.
2. **Review the plan, then implement.** Once the scenarios and expected behavior are agreed, ask AI to implement them using the existing `OtpLoginPage` page object.

### Prompt template

```text
We are testing the QA Practice Hub OTP login flow in Playwright with TypeScript.
The existing page object is tests/pages/otp-login.page.ts.

Before writing or changing code, provide:
1. Assumptions, clearly labeled as verified or unverified, and how to verify each unverified assumption.
2. Typed test data for each scenario, identifying which values are static and which are generated at runtime.
3. The expected result for each scenario, including the relevant UI state or message.

Do not write code in this first response. Wait for me to review the plan.

After I approve the plan, implement it with these constraints:
- Reuse the existing OtpLoginPage; do not duplicate page locators or interactions in the spec.
- Do not use waitForTimeout or other fixed delays. Prefer Playwright's auto-waiting locators and expect assertions.
- Fetch a valid OTP at runtime. Never hardcode or log the OTP.
- Derive invalid or incomplete OTP test data from the fetched OTP.
- Preserve the existing test structure and make only changes required by the approved scenarios.
```

### Applied to the current OTP scenarios

The current tests use this reviewed plan:

| Scenario | Test data | Expected result |
| --- | --- | --- |
| Username required | Empty username | Fetch OTP is disabled. |
| Incomplete OTP | First five digits of the fetched OTP | `Please enter all 6 OTP digits.` |
| Incorrect OTP | Fetched OTP with its last digit changed | `Invalid OTP. Check the code and try again.` |
| Successful login | The OTP fetched from the popup at runtime | A success message welcomes `PlaywrightAITester`. |

The current behavior and messages were observed in the practice application and verified by running the tests. Environment-specific assumptions, such as `URL_OTP_LOGIN` pointing to the intended practice page, should still be checked when running the suite in a different environment.

## Files

- `playwright.config.ts` – Playwright browsers, test directory, and `data-testid` configuration.
- `tests/login-otp.spec.ts` – typed OTP scenarios, data transformations, and validation tests.
- `tests/pages/otp-login.page.ts` – POM class containing OTP page locators and actions.
