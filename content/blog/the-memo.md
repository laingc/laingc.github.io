+++
title = "The Memo"
description = ""
author = "Christopher Laing"
date = "2021-06-20T14:00:00+13:00"
tags = ["Opinion"]
categories = ["Business", "Technology"]
comments = false
draft = false
removeBlur = true
[[images]]
  src = "img/2021/06/memo.jpg"
  alt = "A Memo"
  stretch = "vertical"
+++

In 2002, Amazon's Jeff Bezos issued a memo that has entered tech industry canon. The memo, known as the "API Mandate", is generally perceived as being a statement about technology at Amazon, and is therefore widely admired by technologists and wholly ignored by executives. This is unfortunate, because it's no exaggeration to say that the API Mandate completely transformed Amazon as a business and laid the foundation for its success. Better still, unlike many things that global technology titans do, it is something that can be replicated and put to use by almost any business. 

In this post, we'll talk about the memo, and how it created the systems and incentives for radical organisational transformation.

<!--more-->

### The Memo

The memo itself is reported[^0] to have read,

> 1. All teams will henceforth expose their data and functionality through service interfaces.
> 2. Teams must communicate with each other through these interfaces.
> 3. There will be no other form of interprocess communication allowed: no direct linking, no direct reads of another team’s data store, no shared-memory model, no back-doors whatsoever. The only communication allowed is via service interface calls over the network.
> 4. It doesn’t matter what technology they use. HTTP, Corba, Pubsub, custom protocols — doesn’t matter.
> 5. All service interfaces, without exception, must be designed from the ground up to be externalizable. That is to say, the team must plan and design to be able to expose the interface to developers in the outside world. No exceptions.
> 6. Anyone who doesn’t do this will be fired.
> 7. Thank you; have a nice day!

To understand what this means, let's take an example. Suppose you are hired by Amazon to start selling home improvement products to the Australian market. There are a bunch of things you're going to do to get started, like getting some new product categories set up in the database, putting listings on the Amazon website, figuring out which products to stock and how many, and getting Amazon warehouses to store those products[^1]. 

At Amazon, each of these atomic functions is a series of API calls. An API - an Application Programming Interface - is a piece of software that allows other software to talk to it and access its functionality. APIs are found everywhere in all kinds of technologies, and this is what Bezos is referring to when he writes "service interfaces".

### Business Programming Interfaces

There may be several hundred of these atomic functions necessary to achieve a business outcome. In most organisations, each of them is accomplished by holding multiple meetings with myriad stakeholders, achieving alignment between teams, getting others to prioritise your work in their schedules, and other high-touch, human-centric processes. Anybody who has seen this in action at an organisation of any size will know that this can result in delays of months or years - if anything happens at all.

In our example, the API Mandate requires the team responsible for listings on the website to expose the things that their team does as an API, rather than requiring interpersonal communication. You want a new listing? Call the API - there's your listing. No interminable meetings, misalignments, delays, or self-inflicted organisational chaos[^2]. These APIs are not so much *APIs* as *BPIs* -- Business Programming Interfaces.

The importance of this difference cannot be overstated. This is the secret to Amazon's ability to rapidly enter any market that it sets its eye on. It might seem improbable, but Amazon's incredible growth can largely be attributed to the API Mandate[^3]. [To paraphrase Benedict Evans](https://www.ben-evans.com/benedictevans/2017/12/12/the-amazon-machine), it has turned Amazon into "a machine for making more Amazon".

### Systems Eat Culture

The critical mechanisms for the proper operation of the API mandate are that it is systematic and that it aligns incentives.

It is common for attempted organisational transformations to fail because enacting the transformation requires many hundreds or thousands of people to pull in the same direction, often against their own self-interest. This often devolves into a "war for hearts and minds" or a "culture shift", ignoring the reasons why those hearts and minds and cultures aren't already pulling in that direction.

For transformations to take hold, they need to be based on a system of mechanisms that incentivise every individual or unit to independently reinforce the system. The systematic implications of the API Mandate are now clear, but the effectiveness of the system relies on incentive mechanisms to ensure participation.

Amazon's system of openly available metrics incentivises every team to provide their function in a way that maximises the ability of other teams to make use of that function. In many ways, this mimics the function of the market itself - the best way to make money in a competitive market is to be as useful as possible to your customers.

Together, the system and its incentives create a natural force pushing in the direction of organisational transformation. There is no ongoing need to cajole or threaten recalcitrant units into taking part, but rather a continual process of evolution and improvement along the vectors created by the system. Culture is an effect, not a cause.

### Three Lessons

The API Mandate reads as if it were written by an Engineering leader rather than the CEO. It doesn't mention anything about business goals, strategy, targets, or even products or customers. All of the things that business people care about are noticeably absent, and yet when the impact of the mandate is understood, it's probably the most important single memo in the history of business. There are three lessons to be drawn from this. 

The first lesson is that any corporate of sufficient complexity could implement the API Mandate itself and achieve at least a good approximation of Amazon's flexibility and scalability. Whether every corporate has leadership skilled enough to know how to exploit those advantages is, of course, another matter.

The second lesson is that organisational change is achieved through systems and incentives, rather than culture. Technology is a prime catalyst for this type of change, as its structured and orderly nature lends itself to systematic application.

The third lesson is that technology is not only much more important in business than executives would like to think, but that realising the potential of technology means fundamentally transforming the core operations of the business to exploit the characteristics of the technology. If business strategy is not developed by people with a strong, big-picture understanding of technology, then that strategy is almost certainly doomed to underperform.

### Where Are All The Amazons?

One significant reason why there are so few businesses like Amazon might be that very few executives understand or even like technology enough to be able to effectively exploit it for competitive advantage. It's common to see even highly sophisticated companies ignoring the incentives that structure their business and ignoring the systematic approaches to business transformation that technology enables.

The good news is that companies like Amazon have blazed clear trails for the rest of us to follow. With a clear understanding of what the API Mandate really means, real transformation is within any organisation's grasp.

All you need is a strongly-worded memo.


[^0]: Like an Arthurian legend, the memo has entered the realm of myth. Whether or not it existed in this exact form, the API Mandate was and is real at Amazon.

[^1]: These details are complete conjecture, but the point stands.

[^2]: At least in theory. I'm sure some of this still happens in practice.

[^3]: At the very least as an emblem of Amazon's systematic institutional approach to scaling its organisation.
