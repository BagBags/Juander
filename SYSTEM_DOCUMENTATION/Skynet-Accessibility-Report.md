# Detailed Web Accessibility & Compliance Report

**Generated on:** November 08, 2025  
**URL:** https://d39zx5gyblzxjs.cloudfront.net  

---

## Summary of Accessibility Categories

| Category | Passed | Failed | Notes |
|-----------|---------|--------|-------|
| Clickables | 0 | 1 | |
| Titles | 0 | 2 | |
| Graphics | 1 | 0 | |
| Forms | 1 | 2 | |
| Document | 2 | 1 | |
| Readability | 4 | 0 | |
| General | 5 | 1 | |
| Lists | N/A | N/A | Manual Audit Required |
| Tables | N/A | N/A | Manual Audit Required |
| Content | N/A | N/A | Manual Audit Required |
| Audio/Video | N/A | N/A | Manual Audit Required |

---

## Clickables

| Description | WCAG 2.0, 2.1 & 2.2 | Status |
|--------------|--------------------|---------|
| Buttons should be labelled properly | A 2.5.3, A 4.1.2, AA 2.4.6 | ❌ Failed |
| Anchor link should not be empty | A AA AAA | ⚠️ Manual Audit |
| Link should have valid attributes | A AA AAA | ⚠️ Manual Audit |
| Links that open in new tabs/windows should be tagged for assistive technology | A AA AAA | ⚠️ Manual Audit |

---

## Titles

| Description | WCAG 2.0, 2.1 & 2.2 | Status |
|--------------|--------------------|---------|
| Heading tag should not be empty | A AA AAA | ⚠️ Manual Audit |
| Titles should have a consistent hierarchy | A 1.3.1, AA 2.4.6 | ❌ Failed |
| A title should be provided for the document | A 2.4.2 | ❌ Failed |

---

## Graphics

| Description | WCAG 2.0, 2.1 & 2.2 | Status |
|--------------|--------------------|---------|
| All img tags must have alt attributes | A 1.1.1 | ✅ Passed |

---

## Forms

| Description | WCAG 2.0, 2.1 & 2.2 | Status |
|--------------|--------------------|---------|
| All form fields should be labelled properly | A 1.3.1, 4.1.2, 3.3.2 | ❌ Failed |
| Hidden input fields should not contain labels | A | ⚠️ Manual Audit |
| Autocomplete attribute must be used correctly | A | ⚠️ Manual Audit |
| Custom controls have ARIA roles and labels | A | ⚠️ Manual Audit |
| Interactive controls are keyboard focusable | A | ⚠️ Manual Audit |

---

## Document

| Description | WCAG 2.0, 2.1 & 2.2 | Status |
|--------------|--------------------|---------|
| The HTML element should have a valid lang attribute | A 3.1.1 | ✅ Passed |
| Meta viewport allows display scaling of at least 200% | AA 1.4.4 | ❌ Failed |
| Element should not have "aria-hidden" attribute | A 4.1.2 | ✅ Passed |

---

## Readability

| Description | WCAG 2.0, 2.1 & 2.2 | Status |
|--------------|--------------------|---------|
| Contrast ratio of at least 3:1 | AA 1.4.3, AAA 1.4.6 | ✅ Passed |
| Inline text spacing must be adjustable | AA 1.4.12 | ✅ Passed |
| Text line height must be adjustable | AA 1.4.12 | ✅ Passed |
| Links distinguishable from text by more than color | A | ⚠️ Manual Audit |

---

## General

| Description | WCAG 2.0, 2.1 & 2.2 | Status |
|--------------|--------------------|---------|
| Elements should not have duplicate ID attributes | A 1.3.1, 4.1.2 | ✅ Passed |
| ARIA attributes should be valid | A 1.3.1, 4.1.2 | ❌ Failed |
| While popup is opened, it should contain focusable element | A 2.4.3 | ✅ Passed |
| Elements should not have tabindex > 0 | A | ⚠️ Manual Audit |
| Visual order follows DOM order | A | ⚠️ Manual Audit |

---

## Key Element Findings (Examples)

### Buttons should be labelled properly

| Index | Element | Status |
|--------|----------|--------|
| 1 | `<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">...</button>` | ❌ Failed |

### Titles should have consistent hierarchy

| Index | Element | Status |
|--------|----------|--------|
| 1 | `<h2 class="text-2xl font-bold text-gray-800">Welcome Back</h2>` | ❌ Failed |

### A title should be provided for the document

| Index | Element | Status |
|--------|----------|--------|
| 1 | `<title></title>` | ❌ Failed |

### All img tags must have alt attributes

| Index | Element | Status |
|--------|----------|--------|
| 1 | `<img alt="Login Illustration" src="/Logo2.png">` | ✅ Passed |
| 2 | `<img alt="Mobile Logo" src="/Logo2.png">` | ✅ Passed |
| 3 | `<img alt="Salakot" src="/salakot.svg">` | ✅ Passed |

### Form Fields Labelling

| Index | Element | Status |
|--------|----------|--------|
| 1 | `<input placeholder="Password" type="password">` | ❌ Failed |
| 2 | `<input placeholder="Email" type="email">` | ❌ Failed |
| 3 | `<input placeholder="Email" type="email">` | ✅ Passed |
| 4 | `<input placeholder="Password" type="password">` | ✅ Passed |

---

## Accessibility Summary

- **Total Passed Checks:** 14  
- **Total Failed Checks:** 8  
- **Manual Audits Required:** 10+  
- **Overall Result:** Partially Accessible (Manual Review Recommended)

---

### Notes

Some criteria (WCAG 2.1, 2.2) cannot be verified automatically. Manual audit is required for:  
- Lists and Tables  
- Flashing content and multimedia  
- Keyboard and focus order testing  

For complete conformance, consider manual accessibility testing and expert remediation review.

---

**Report Provided by:** [Skynet Technologies Free Accessibility Checker](https://www.skynettechnologies.com)  
**Audit Date:** November 08, 2025
