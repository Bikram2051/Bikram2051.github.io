---
title: Deleting a chat on two devices is harder than it sounds
description: I built a small AI chat client for my own use. Calling the model was the easy part. Keeping secrets out of the browser and keeping deleted chats deleted took the real thought.
tags: [JavaScript, Cloudflare Workers, sync]
---

AlVik is a chat client I built for my own use. It is one HTML file with no framework and no build step, and it talks to language models through a small Cloudflare Worker.

Calling a model's API is the easy part of a project like this. Two other problems took the thought.

## Nothing secret in the browser

A page that calls a paid API directly has to carry the key, and anything in a page can be read by whoever opens it. So the page holds no secrets at all.

The Worker keeps the provider keys and the password. When I sign in, it compares the password in constant time and hands back a signed token that expires after 30 days. Every chat request carries the token, and the Worker checks the signature and the expiry before it passes anything on. It also only answers pages on a list of allowed origins.

Rules like this fade unless something enforces them. A check runs on every push. It fails the build if anything that looks like a key appears in any tracked file, or if a password ever turns up in the page.

## Keeping deleted chats deleted

Chats live in the browser. Sync copies them to a small key-value store so my other devices can pull them.

The awkward case is deletion. Say I delete a chat on my laptop while my phone is offline. When the phone comes back, it still has the chat. A simple merge sees a chat that exists on one device and not the other, and helpfully puts it back.

The fix is to never really delete. A deleted chat leaves a tombstone: a small record of what was deleted and when. When two devices merge:

1. A chat that exists on only one device is kept.
2. A chat on both resolves to the newer edit.
3. A chat is dropped when its tombstone is newer than its last edit.

The third rule stops the offline phone from bringing the chat back, and it still lets an edit made after a deletion win.

There is one more guard. The store keeps a version number. If a device tries to save on top of a version it has not seen, the Worker refuses, sends back the current state, and the device merges and tries again. Nothing is silently overwritten.

## What it is not

It is a personal tool, not a product. There is one password and one user, the limit on login attempts is best effort, and history sits in the browser's local storage, so it is only as private as the device.

The merge rules are covered by tests, including the two cases above: a stale device cannot bring back a deleted chat, and an edit newer than the tombstone wins.

I keep coming back to this project because the same two questions turn up in data work all the time. Where do the credentials live? And what happens when two copies of the same record disagree?

The code is [on GitHub](https://github.com/Bikram2051/AlVik), and there is a short summary on the [work page](/projects/#alvik).
