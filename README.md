# AI-Assisted Playwright OTP Testing

This project automates QA Practice Hub's OTP login flow with Playwright and TypeScript. The tests cover successful login and OTP validation scenarios.

## Requirements and setup.

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

## 1. Prompt Engineering for QA

Prompt engineering supports every stage below rather than being a one-time step.
This project uses a two-step prompt workflow so test intent is reviewed before implementation:

1. **Plan first; do not write code yet.** Ask AI to list assumptions, test data, and expected results. Each assumption must be labeled as verified or unverified. Unverified behavior must not be presented as fact.
2. **Review the plan, then implement.** Once the scenarios and expected behavior are agreed, ask AI to implement them using the existing `OtpLoginPage` page object.

Reusable prompts are kept in [`prompts/`](prompts/). Start with [requirement analysis](prompts/requirement-analysis.md), then generate test cases and Playwright tests from the reviewed requirements. Each prompt is a separate step; review its output before moving on.

### Applied to the current OTP scenarios

The current tests use this reviewed plan:

| Scenario | Test data | Expected result |
| --- | --- | --- |
| Username required | Empty username | Fetch OTP is disabled. |
| Incomplete OTP | First five digits of the fetched OTP | `Please enter all 6 OTP digits.` |
| Incorrect OTP | Fetched OTP with its last digit changed | `Invalid OTP. Check the code and try again.` |
| Successful login | The OTP fetched from the popup at runtime | A success message welcomes `PlaywrightAITester`. |

The current behavior and messages were observed in the practice application and verified by running the tests. Environment-specific assumptions, such as `URL_OTP_LOGIN` pointing to the intended practice page, should still be checked when running the suite in a different environment.

## 2. AI Test Case Generation

In addition to successful login, the test suite covers negative and boundary cases. Expected messages and UI behavior were checked against the application before being added to the tests:

| Scenario | Expected result |
| --- | --- |
| Username is missing | The Fetch OTP button is disabled. |
| Only five OTP digits are entered | The form displays `Please enter all 6 OTP digits.` |
| An incorrect six-digit OTP is entered | The form displays `Invalid OTP. Check the code and try again.` |
| The fetched OTP is entered | Login succeeds, and the welcome message includes the username. |

Use the [test case generation prompt](prompts/test-case-generation.md) to brainstorm positive, negative, and boundary cases. It asks AI to identify assumptions and avoid guessing application messages.

AI suggestions were not treated as ground truth: expected behavior was checked in the application, and the tests were run in Chromium. The incorrect OTP is created by first fetching the valid, dynamic OTP and then changing its last digit; the valid OTP is neither hardcoded nor printed to the log.

## 3. AI Test Data Generation

The scenarios in `tests/login-otp.spec.ts` are stored as typed test data and run as independent Playwright tests. Discriminated unions describe the supported case types: an empty-username validation and OTP submissions using a valid, incorrect, or incomplete code. The incomplete case also specifies how many digits to enter.

The OTP is fetched from the popup at runtime for every submission scenario. Test data derives the input from that value: it uses the fetched code unchanged for a successful login, changes the last digit for an incorrect code, or takes the configured number of leading digits for an incomplete code. This keeps the valid OTP dynamic while making the negative cases repeatable.

The username is a stable practice-test value; no real user data or generated credentials are used.

## 4. AI Playwright Test Generation

### 1. Codegen recording

Playwright Codegen can record browser interactions and generate a draft of the test code:

```bash
npx playwright codegen --target=playwright-test --test-id-attribute=data-testid https://qapracticehub.com/#otp-login
```

Codegen opens a browser and the code generator. Perform the login steps in the browser, and Playwright suggests corresponding locators and actions. The `--test-id-attribute=data-testid` option tells Codegen to use the page's `data-testid` attributes.

Codegen output is a starting point, not a finished test, and should not be treated as ready to use without adaptation to the project.

### 2. AI-assisted implementation

AI supported the implementation by helping to:

- explaining error messages and how Playwright locators work
- accounting for the cookie banner and navigating to the OTP section
- reading the OTP text from the popup and filling the six separate OTP fields
- organizing the generated interactions into the existing Page Object Model

Use the [Playwright generation prompt](prompts/playwright-generation.md) to implement reviewed scenarios. It includes this project's requirements for the existing page object, dynamic OTP handling, and Playwright synchronization.

### 3. Page Object Model (POM)

Page locators and actions are managed by the [OtpLoginPage](tests/pages/otp-login.page.ts) class. The test itself, [login-otp.spec.ts](tests/login-otp.spec.ts), describes the scenario and checks that login succeeds.

`OtpLoginPage.fetchOtp()` waits for the popup to open and retrieves the six-digit code. `enterOtp()` fills the page's six fields one digit at a time. This keeps UI details in the page object and lets the test focus on verifying the login flow.

## 5. AI Bug Analysis

AI can help investigate a failing test, but a test failure is evidence of unexpected behavior, not proof of an application bug. Use the Playwright result and trace to identify what happened, then verify the proposed cause in the application.

Run the OTP tests with a trace and HTML report:

```bash
npx playwright test tests/login-otp.spec.ts --project=chromium --workers=1 --trace on
npx playwright show-report
```

In the report, open the failed test and inspect its error, steps, and trace. Share only relevant failure output, trace observations, and test code with AI. Traces can contain page content and test data; review and redact them before sharing. The OTP is dynamic and should not be copied into prompts. Use the [bug analysis prompt](prompts/bug-analysis.md) to distinguish evidence from hypotheses and avoid treating a test failure as proof of an application defect.

For example, if the “rejects an incorrect OTP” test fails, first compare the submitted code and visible login message in the report and trace with the expected message in `tests/login-otp.spec.ts`. Do not conclude that OTP validation is broken until the trace confirms the application received the derived incorrect code and the observed result contradicts the verified expected behavior.

## 6. AI Review and Refactoring

This final stage reviews the generated tests and page object for quality after test generation. It is separate from AI Bug Analysis: bug analysis investigates a specific failure, while this review checks the test code even when the suite passes.

Review `tests/login-otp.spec.ts` and `tests/pages/otp-login.page.ts` for:

- correct test intent, expected results, and coverage of the agreed scenarios
- reliable Playwright locators, auto-waiting, and assertions; avoid fixed delays
- duplicated interactions or locators that belong in the page object
- clear test data and maintainable, narrowly scoped code
- accidental exposure of OTPs or other sensitive values in output or logs

Ask AI to report findings before making changes. Apply only relevant, approved changes; do not change verified application behavior or refactor unrelated code. Run the affected Playwright tests after refactoring and inspect the diff.

Use the [review and refactoring prompt](prompts/review-and-refactoring.md) to collect findings before making changes, then verify approved refactoring by running the affected tests.

## Files

- `playwright.config.ts` – Playwright browsers, test directory, and `data-testid` configuration.
- `tests/login-otp.spec.ts` – typed OTP scenarios, data transformations, and validation tests.
- `tests/pages/otp-login.page.ts` – POM class containing OTP page locators and actions.
- `prompts/requirement-analysis.md` – prompt for clarifying and structuring requirements.
- `prompts/test-case-generation.md` – prompt for generating test scenarios from reviewed requirements.
- `prompts/playwright-generation.md` – prompt for implementing reviewed scenarios with Playwright.
- `prompts/bug-analysis.md` – prompt for evidence-based analysis of a failing test.
- `prompts/review-and-refactoring.md` – prompt for reviewing and safely refactoring tests.


## Lessons Learned

• AI can generate useful test cases but requires human review.<br>
• AI-generated Playwright code should be refactored before production use.<br>
• Business requirements have a significant impact on AI-generated test quality.<br>
• Prompt quality directly affects test quality.<br>


## Author

Kari Kanerva<br>
Bachelor of Computer Science<br>
ISTQB Foundation Level Tester CTFL 4.0<br>
ISTQB Foundation Agile Tester<br>
email: kari.k.kanerva@gmail.com