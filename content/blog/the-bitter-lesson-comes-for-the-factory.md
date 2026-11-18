+++
title = "The Bitter Lesson Comes for the Factory"
description = "Prompts, harnesses, factories, and the speed of the lesson."
author = "Christopher Laing"
date = '2026-11-18T23:31:12+13:00'
draft = false
tags = ["Machine Learning", "AI", "Software Engineering"]
categories = ["Technology"]
[diagram]
  src = "diagrams/the-bitter-lesson-comes-for-the-factory.svg"
  alt = "Three stepped terraces, labelled prompts, harnesses, and factories, stand on level ground. A copper waterline labelled frontier models, with an arrow pointing up, has covered the first two and is climbing the factory, whose upper floors hold a small org chart."
[[images]]
  src = "img/diagrams/the-bitter-lesson-comes-for-the-factory.png"
+++

Every year or so, the people most serious about building software with AI settle on a new craft. First it was prompt engineering, then harness engineering, and now it is the agentic factory. Each was necessary in its moment, each delivered real gains to the people who mastered it, and each is falling to the same force: the Bitter Lesson.

What has changed is not the lesson but the speed at which it is taught. Frontier models are now improving quickly enough that the lesson is outpacing even the people most engaged with the state of the art, and nowhere more so than in software.

<!--more-->

## The Lesson

In 2019, Richard Sutton published [The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html), a short essay with an uncomfortable thesis:

> The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin.

He summarises the pattern in four steps:

> 1) AI researchers have often tried to build knowledge into their agents, 2) this always helps in the short term, and is personally satisfying to the researcher, but 3) in the long run it plateaus and even inhibits further progress, and 4) breakthrough progress eventually arrives by an opposing approach based on scaling computation by search and learning.

Sutton's agents were not the ones we talk about today, but the sentence needs no editing.

Two years later, I tried to turn his observation into something closer to a predictive tool. In [The Bitter Lesson Conditions](https://laing.nz/blog/the-bitter-lesson-conditions/), I proposed that a method will revolutionise a problem space when three conditions hold: the method is general, its architecture allows for scalable computation, and its quality scales well with compute. At the time, I wasn't sure how predictive those conditions would be. Frontier LLMs meet all three comfortably, and their progress since then is about what the framework would lead you to expect.

## Incantations, Harnesses, and Factories

Prompt engineering was the first craft. Early models were sensitive to phrasing in ways that rewarded careful study, and a body of folk knowledge grew up: tell the model it is an expert, ask it to think step by step, and, in one memorable case, tell it to take a deep breath first (a phrase that was, fittingly, found by a model optimising prompts rather than by a person). For a while, prompt engineer was even a job title.[^1] The techniques worked, which is exactly why people learned them. Then reasoning was trained into the models themselves, and the incantations became unnecessary.

Harness engineering moved the craft from the prompt to the system around the model. Once models could use tools, the important work was deciding which tools to give them, how to assemble their context, how to retrieve the right code, when to plan, when to retry, and what to remember between sessions. Each harness encoded someone's theory of what the model could not yet do for itself. Each new generation of models did more of that work itself, and carefully engineered retrieval pipelines started losing to models that simply search the codebase the way a developer would.

The agentic factory is the current craft. Rather than one agent in one harness, a factory runs many agents in parallel, organised into roles - a planner, an implementer, a reviewer, and a tester - with queues, handoffs, and gates between them. The results can be impressive, and the people building factories today are getting real work out of them.

It's worth noticing what the factory is modelled on. It's an org chart. The roles, handoffs, and review gates are our best understanding of how a team of people builds software, translated into a system for models. Sutton warned that "building in how we think we think does not work in the long run." The factory builds in how we think we work.

## Why the Factory Falls

Apply the Bitter Lesson Conditions and the problem becomes clear. The frontier model is general, its architecture scales, and its quality improves with compute. The factory fails the conditions where it matters. It isn't general: it is designed around the gaps in a particular generation of models. Running more agents certainly uses more computation, but the factory's ceiling is set by its design, and the design is set by a person.

When the next model arrives, the gaps move. A reviewer agent tuned to catch mistakes the new model no longer makes is overhead. A pipeline that splits a task into pieces because the old model couldn't hold it whole now cuts the work along the wrong lines. This is Sutton's third step: the built-in knowledge plateaus, and then it gets in the way.

None of this makes the factory a mistake. Sutton's second step matters just as much: building in knowledge always helps in the short term. If you need to ship software this quarter, a factory may well be the best way to do it with the models you have. The mistake is treating it as a destination rather than scaffolding.

## The Speed of the Lesson

What makes the present moment different is the timescale. In Sutton's examples, the Bitter Lesson played out over decades. Deep search beat Kasparov in 1997, computer Go followed the same pattern "only delayed by a further 20 years", and speech recognition changed gradually over decades. A researcher could build an entire career on human-knowledge methods before computation caught up with them. It's no surprise that, as Sutton puts it, they "were not good losers".

Prompt engineering, harness engineering, and agentic factories have each emerged within the space of a few years, and the first two are already well on their way to being absorbed into the models. The people being outpaced are not laggards. They are the ones reading every release note, building their own tooling, and writing up their techniques for everyone else. By the time a technique is understood well enough to be taught, the next model has often made it redundant. The half-life of a technique is now shorter than the time it takes to master it.

Software is where this is most acute, and I suspect that isn't an accident. Code has an unusual property for creative work: you can check it. It compiles or it doesn't; the tests pass or they don't. That makes software an ideal domain for exactly the search and learning that Sutton identified as the methods that scale, and it appears to be where much of the frontier labs' effort is pointed. The people building better ways to use AI for software are racing AI that is itself getting better at software, and the AI is faster.

## Scaffolding

The practical response is not to stop building factories, harnesses, or careful prompts. They are necessary in the moment, and the moment is where software gets shipped. The response is to hold them lightly: build them cheaply, expect to throw them away, and re-test every piece against each new model to see whether it still earns its place.

The open question is which parts, if any, survive. My guess is that the durable parts will be the ones that give the model more to work with rather than telling it how to work: an environment where it can run the code, tests it can check itself against, and a clear account of what we actually want. Those describe the problem, not the method. That guess is, of course, subject to the same lesson as everything else.

Sutton observed that the chess researchers were not good losers. At this pace, we don't have time to be.

[^1]: Sometimes a very well-paid one. In early 2023, Anthropic advertised for a [Prompt Engineer and Librarian](https://web.archive.org/web/20230301173255/https://jobs.lever.co/Anthropic/e3cde481-d446-460f-b576-93cab67bd1ed) with an expected salary of US$175,000 to US$335,000.
