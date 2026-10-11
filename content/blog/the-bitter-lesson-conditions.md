+++
title = "The Bitter Lesson Conditions"
author = "Christopher Laing"
date = "2021-05-27T11:30:00+13:00"
tags = ["Machine Learning", "Deep Learning"]
categories = ["Technology"]
comments = false
removeBlur = false
draft = false
description = "A modest proposal for revolutionising everything."
[[images]]
  src = "img/2021/05/network.jpg"
  alt = "Neural Network"
  stretch = "vertical"
+++

The hard truth of AI is that methods that exploit deep, hard-won human knowledge about a particular domain are outperformed by methods that cleverly exploit the increasing power of computation.

I have a modest proposal to distill this fundamental truth into a set of conditions which, when met, will revolutionise a given field.

<!-- more -->

### Lineage

I do not claim this insight about the fundamental mechanism of progress in AI as original; I have been heavily influenced by Richard Sutton's powerful essay [The Bitter Lesson](http://www.incompleteideas.net/IncIdeas/BitterLesson.html).

As he puts it, 

> The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin.

Sutton is not alone in this observation. The somewhat eccentric polymath Gwern has [made similar remarks](https://www.gwern.net/newsletter/2020/05), prompted by the success of the GPT-3 language model.

### The Bitter Lesson Conditions

The Computer Vision revolution of 2012, the Natural Language revolution of 2017, and the Speech Recognition revolution of 2020 are all concrete examples of this phenomenon, and I think that at this point it is safe to say that the mechanism behind the Bitter Lesson is the driving force in modern Deep-Learning-based AI.

If we take the Bitter Lesson seriously, these revolutions, far from being surprising, are almost inevitable. However, it's not clear to me that this observation gives us any specific predictive power. Given a particular field, under what conditions can we expect AI to revolutionise it?

I have my own modest proposal for a framework to think about answering such questions, namely, that there are three conditions to be met for a method to revolutionise a problem space:

1. The method is general.
2. The model architecture allows for scalable computation.
3. The quality of the model scales well with compute. 

For want of a more elegant term, I have dubbed these the "Bitter Lesson Conditions".

### Generality and Scalability

The first condition is that the method should be general. In this context, this means that the method should reliably address an entire problem space, rather than one or more subproblems. This definition begs the question somewhat, but a moment's thought about any specific issue will yield a suitable boundary for a problem space. Take Natural Language Processing (NLP), for example. While there are many blurry edges such as image captioning, few would disagree that for a method to be "general", it should at least address core concerns such as Named Entity Recognition, Sentiment Analysis, and Topic Extraction. The more subproblems a method can address, the more general it is, and the greater its impact is.

The second and third conditions both concern scalability, but use the term in two quite different senses. The second condition is the most commonly discussed meaning of model scalability, namely, how well the architecture lends itself to massively parallel and/or distributed computation. This is a topic of general importance, but for the Bitter Lesson it is central. If the algorithm cannot actually make use of the available computational power, then the mechanism breaks down.

The meaning of scalability in the third condition is less commonly used, but is also quite obviously necessary for the mechanism to function. The algorithm must of course scale well in the sense that adding more computing power improves the performance of the model, however there is a more subtle and important effect of this type of scalability: beyond quality as measured by simple metrics, scaling the algorithm should lead to a difference in the *kind* of behaviour the system exhibits.

In the case of GPT-3, the poster child for this type of scalability, increasing the scale of the computation led the algorithm to display entirely new, emergent properties. As [Gwern put it](https://www.gwern.net/newsletter/2020/05),

> These benefits were not merely learning more facts & text than GPT-2, but qualitatively distinct & even more surprising in showing meta-learning: while GPT-2 learned how to do common natural language tasks like text summarization, GPT-3 instead learned how to follow directions and learn new tasks from a few examples.

This more subtle sense of the term scalability is, in my view, the truly revolutionary aspect of the three conditions. The reason for not extracting it as a distinct fourth condition is that it remains to be seen whether emergent behaviour is strictly necessary for revolution, as opposed to simple improvement with scale.

### Powers of Prediction

I find the Bitter Lesson Conditions to be a useful framework for my own thinking about a problem space. It helps give structure to my own questions about whether, say, Geometric Deep Learning is about to experience a paradigm shift in capability, or whether we are still in the realm of incremental improvement.

What I don't yet know is whether the conditions are highly predictive. If I'm very brave, I may venture some predictions in the future, and test these conditions against the reality. For now, I'm content with having a framework to think about coming advances in AI.


