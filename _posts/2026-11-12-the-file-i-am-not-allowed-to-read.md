---
title: The file in my own project I am not allowed to read
description: On a team prototype about health cover for international students, the most useful rules were about what each of us must not see and what the software must refuse to say.
tags: [Evaluation, testing, Python]
image: /assets/og/oshc-post.png
---

Overseas Student Health Cover is the insurance most international students in Australia have to hold. It is also easy to misunderstand until the first bill arrives. This year three of us at Swinburne built a learning prototype for it, with Medibank as the industry partner.

The app has short lessons, a guide to finding care, a bill explainer that works on made-up invoices, and a chat that answers general questions from the insurer's member guide. My part was the bill explainer's extraction, the benefit arithmetic, a question classifier and the evaluation code.

## Money code gets its tests first

The benefit arithmetic is the one place where a wrong answer could cost a student real money, so its tests were written before the code. The rules are short:

- Money is never a float. Every amount is a decimal, rounded half up to the cent.
- A benefit can never be more than what was charged.
- The out of pocket gap can never be negative.
- If a rule is missing, or the Medicare schedule fee it depends on is not known, the function returns nothing, and the screen says that Medibank confirms the exact benefit.

That last rule matters most. One test takes a 95.00 dollar charge for a service with a schedule fee of 41.20 and checks that the benefit comes from the fee, not the charge, which leaves a gap of 53.80. Another takes the schedule fee away and checks that the answer is no answer. A calculator that guesses is worse than one that says it does not know.

## The file I am not allowed to read

Our invoices are synthetic. One teammate wrote the script that generates them, and I wrote the code that reads them. The README names a reviewer for every file. Beside the generator it says a different teammate reviews it, and never me.

The reason is simple. Two of the invoice layouts were set aside to score my extractor. If I read the generator, I see what those layouts look like, and the score stops meaning anything. So in a three person repository there is one file I do not open.

The plan gives me the mirror image of that job on the safety side. I write the hidden test questions for the chat's safety gate, which a teammate builds, and they stay out of the repository until evaluation day. Building against the set you are scored on is not a measurement.

## An answer, or a fixed refusal

The chat follows the same idea. Every question goes through three separate steps: a review of the question, a draft written only from the member guide, and an audit of the draft. Quotes are checked against the source PDF. If any step fails, the student gets a fixed message, not a best guess.

Emergencies, symptoms and "will my policy pay for this" are stopped before anything is looked up, and pointed to the right service instead. The wording is always "this document shows", never "you are covered", because only the insurer can say that.

And no real document goes in, ever. No real invoice, policy number or student. That is a privacy rule, and it is also why the build was small enough to finish.

## What I would not claim

It is a prototype. Tests that pass with a stand-in for the model do not prove the live model is accurate, and our README says so. Parts of the planned study, including the labels coded by two people, are not finished and are not presented as finished.

What I took from the project is an order of work: decide what the system must refuse to do, and what each person must not see, before deciding what it should do.

The code is [on GitHub](https://github.com/Bikram2051/oshc-when-it-matters), and there is a short summary on the [work page](/projects/#oshc).
