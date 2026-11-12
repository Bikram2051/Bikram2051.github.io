---
title: What 57,217 crashes say about car weight
description: When two cars collide in Victoria, the driver of the lighter one is hurt twice as often. Notes from a semester with the state's crash data, including three things the data corrected me on.
tags: [road safety, statistics, R]
---

This semester a classmate and I took one question to Victoria's road crash data: when two cars collide, how much does weight decide which driver is badly hurt?

The short answer is a lot. In crashes where exactly one driver was killed or seriously injured, it was the driver of the lighter car two times out of three. After adjusting for driver age and sex, vehicle age, seatbelt use and point of impact, each 10% of extra weight went with about 20% lower odds for that car's driver.

The [full case study](/projects/crash-weight/) has the charts and the numbers. This note is about how we got there.

## Compare the two drivers, not all drivers

People who drive small cars are not the same people who drive large utes, and they do not drive on the same roads at the same times. A model that compares all drivers has to adjust for every one of those differences.

We avoided most of that by comparing the two drivers inside the same crash. They share the road, the weather, the speed limit and the moment, so none of those can explain why one was hurt and the other was not. The method is conditional logistic regression.

It has a cost. A crash only tells you something when the two outcomes differ. We started with 57,217 crashes, and 12,078 of them did the work.

## Three things the data corrected

**The shape.** Our plan said the risk would change by a fixed amount per 100 kg. I tested that straight line against a flexible curve before trusting it, and it did not hold. What matters is the ratio of the two weights. An extra 340 kg roughly doubles the odds between two small cars and adds about half between two large ones.

**The confounder.** We expected vehicle age to explain part of the weight effect, because older cars are lighter and less safe. It explained almost nothing. Driver sex explained two thirds of the shift. Women in the data drove lighter cars and had higher odds of serious injury, so weight had been taking the credit for some of that.

**The codes.** A speed zone of 999 is not a very fast road. It means unknown. We read every column as text and checked each one against the data dictionary before turning anything into a number.

## What it does not show

This is an association in police-reported data. Heavy vehicles are also taller and stiffer, and without make and model we cannot separate weight from design.

It is also only the driver's side of the story. Other research has found that heavier vehicles are deadlier for the pedestrians they hit. A heavier fleet protects the people inside it and costs the people outside it, and any honest summary needs both halves.
