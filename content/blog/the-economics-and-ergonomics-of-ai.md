+++
title = "On the Economics and Ergonomics of LLMs"
author = "Christopher Laing"
date = "2024-07-16T10:00:00+13:00"
tags = ["LLMs", "Business", "AI"]
categories = ["Business", "Technology"]
comments = false
removeBlur = false
draft = false
[[images]]
  src = "img/2024/07/llm-economics.webp"
  alt = "Large Language Model Economics"
  stretch = "vertical"
+++

For all the millions of words that have been devoted to the capabilities of LLMs, the economics and ergonomics of these systems seem to me to be under-discussed. In much the same way that technology changes - from records to CDs to streaming - have been a dominant factor in the evolution of popular music, prosaic matters such as cost structures will have a substantial influence on the development and impact of AI. While it is still early days for LLMs, there are already signs that economic factors are impacting everything from product design and technology choice to adoption and even regulation.

<!--more-->
### LLM Economics 101

Let's start with a very high-level view of the fundamental economics of LLM-based AI systems. These systems are extremely large and run on hardware that is very expensive to buy and run. This means that there are significant CAPEX and OPEX associated with providing a first-class LLM offering, such as OpenAI or Anthropic. Importantly, there is a quantifiable per-unit cost incurred by LLM invocations; more precisely, a per-token cost. This cost structure creates an incentive structure unfamiliar to the modern software world. For many applications, the software is not valuable enough to any one company to justify all the cost of its creation and maintenance. Software companies solve this by building once and selling to a massive global market. The fixed cost of software is high, but the marginal cost is zero (or close to it). With LLMs, the fixed cost is high, and the marginal cost is also high. This means that companies need to attract large numbers of consumers, but also need to either limit their consumption or charge for it.

### Conversational, Embedded, and Agentic AI

Currently, users consume LLMs through three principal mechanisms: conversational AI, embedded AI, and agentic AI. Conversational AI is the familiar ChatGPT experience - the user experiences a discussion with an LLM that has access to your discussion history, any documents you upload, and often basic tools such as web browsing and function execution. The economics of this interaction are simple: the user pays a fixed monthly fee, and they consume the service as much as they like, usually up to some rate limit of messages per hour. The provider manages the cost. The ergonomics of this interaction are a mixed bag; while well-suited to simple questions and answers, actually getting this AI to do anything for you usually involves some form of copying and pasting between the chat application and the application where you want to do work. This is unergonomic and very limiting in terms of capability.

Embedded AI is the AI that you experience as part of another application that has integrated LLM functionality. An example might be Notion’s built-in AI writer, or Microsoft’s Copilot inside Word or Excel. For providers of this software, the LLM is an enhancement to an existing value proposition. Just like any feature, by integrating it into their software, the developer is hoping to either gain an advantage in the market or - as is increasingly the case with AI - maintain feature parity with competitors (“table stakes”). The ergonomics of embedded AI are very good for the application you are engaging with, but non-existent for all other applications. This means that the value of the AI to the customer is a strict subset of the value provided by the application itself. The economics of embedded AI come in one of two flavours - either the functionality is charged for in a modular way like GitHub Copilot, or it is provided to the user as straight consumer surplus like Notion AI. In either form, the economics of the AI system rest on the role of the functionality securing revenue for the primary product.

Agentic AI is an emerging type of AI that strings multiple LLM invocations together, with both hardcoded and LLM-supervised logic to coordinate their activity. These AI agents work together to achieve higher-level, more abstract, or more wide-ranging goals, using many LLMs in narrow and specific ways to achieve specific outcomes within the system. These AI systems are usually capable of using a wide variety of tools, and are granted significant agency by the user to pursue end goals by whatever means they have available. Agentic AI is a nascent and currently niche use of LLM technology, but it comes the closest to achieving the classical conception of an AI assistant. The ergonomics of agentic AI are fantastic when the systems work as intended. At their current stage of development, the systems are quite “hit and miss”, but they can achieve impressive results. The economics of these systems are proportionally expensive. Each task the agents perform potentially involves multiple LLM invocations, with each invocation creating a marginal cost. Coupled with the probability that getting the desired result from an agentic system may require a trial-and-error approach, the costs of achieving an outcome can become unexpectedly large.

### Having Your Cake...

One way to avoid the per-token economic costs of using a third-party LLM provider such as OpenAI is to host your own LLM. Thanks to open-source efforts from companies such as Meta, there are world-class LLMs freely available for commercial use. Hosting your own first-class LLM is a daunting task for many companies, not to mention an expensive one. While the per-use cost of the system can be quite low, there needs to be a high level of confidence in the business that LLM usage will be high for a sustained period of time. While this is not dissimilar from the familiar Total Cost of Ownership (TCO) calculation that enterprise IT departments do as a matter of course, few enterprise technologies have seen as much rapid growth and rapid change as LLMs, making a standard TCO calculation extremely difficult.

### ... and Eating it Too

Enter LLM routers. A router is a system that sits between a client application and an LLM, and routes requests to the appropriate LLM. This allows a single client application to use multiple LLMs, either to achieve better performance, or to achieve better economics. Routers can be used to route requests to different LLMs based on the type of request, the size of the request, the performance characteristics of the service, latency, or any other factor that the router’s administrator can think of. Importantly from our perspective, routers can also be used to route requests to different LLMs based on the cost of the request, allowing companies to prioritise their spend according to their own needs.

The approach of using an LLM router which routes between a smaller, easier-to-self-host LLM and a first-class, third-party service allows companies to have their cake and eat it too. Requests that require top performance can be routed to the third-party service, while requests that are less performance-critical can be routed to the self-hosted LLM. In particular, the multitude of requests initiated by agentic AI systems can be initially handled by the self-hosted LLM with its fixed cost structure, only resorting to third-party services when the smaller LLM is not up to the task, or once the task has been fully refined through trial and error. This is a highly ergonomic approach for users, with predictable and manageable economic characteristics.

### Caveat Promptor

The economics and ergonomics of LLM-based AI systems are an important and under-discussed element of the current technological revolution. The expensive nature of first-class LLMs makes enterprise adoption at scale - particularly of agentic AI - a somewhat risky business. Fortunately, as we have seen time and time again, where technology creates a problem, the solution is usually more technology. LLM routers, open source, self-hosting, and other software-centric approaches to managing these systems are emerging rapidly. As usual, those companies that lean into these trends will reap the greatest benefits.

