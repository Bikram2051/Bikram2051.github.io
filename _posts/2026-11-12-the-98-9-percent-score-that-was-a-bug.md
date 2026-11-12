---
title: The 98.9% score that was a bug
description: One of our sentiment models scored 98.9% when every other model sat near 85%. Notes from the data side of a team project, where the best result we had was the one we threw away.
tags: [Data engineering, NLP, evaluation]
---

In first semester this year I was the data engineer on a six person sentiment analysis project at Swinburne. The question was how well a model trained on everyday writing carries over to financial writing, and what kind of extra training helps.

We used two public datasets. GoEmotions is Reddit comments, 43,404 of them once its emotions were mapped onto our five labels. The Financial PhraseBank is 4,846 sentences from financial news. My job was to get both into one shape and hand the team data they could trust.

## One script, and a rule

All cleaning and splitting lived in a single script, and the README carried one rule in bold: do not write data cleaning or splitting code inside your modelling notebooks. Everyone loaded the same files.

The finance sentences were split 70/15/15 into training, validation and test sets, with a fixed seed, keeping the label mix the same in each part. That gave a test set of 727 sentences that no model was meant to see during training.

## The score that was too good

Most of our models scored between 82% and 85% accuracy on that test set. Then the model trained on both datasets together came back at 98.9%.

A jump like that is a symptom, not a win. The cause was in the data. The combined training file had been built from the full finance dataset, all 4,846 rows, which included the 727 test sentences. The model was being marked on sentences it had already seen.

The fix was to rebuild the combined file from the Reddit comments plus the finance training set only, 46,796 rows, check that no test sentence was left in it, and retrain. The score fell to 84.7%, in line with everything else.

## What the clean numbers said

With the leak gone, the results were less exciting and more useful.

- A TF-IDF model with a linear SVM, trained only on Reddit comments, got 56% on the finance sentences. The same model trained on finance sentences got 76%. General writing does not transfer for free.
- For BERT, adding 43,404 Reddit comments to 3,392 finance sentences moved accuracy by a point or so in either direction: 83.9% with finance data alone, 84.7% with the two mixed, 82.4% when trained on one and then the other.
- Every one of those BERT models scored zero on the "fear" label. The test set had only 7 fear sentences, and there were 32 to learn from. Accuracy hid that completely, which is why we reported macro F1 beside it: 0.57 to 0.60, a long way under 85%.

The stratified split matters for the same reason. Fear is under 1% of the finance data. A plain random split could easily put 4 fear sentences in the test set, or 10, and the comparison between models would change with the draw.

## What I took from it

I did not build the models. My teammates did, and the modelling choices are theirs. What I owned was whether the numbers could be believed.

The habit I kept is that a split is something you verify, not something you assume. And the result you are happiest about is the first one to check.

The code and the dashboard are [on GitHub](https://github.com/TDP-2026-Repository/TECHNOLOGY-DESIGN-PROJECT), and there is a short summary on the [work page](/projects/#sentiment).
