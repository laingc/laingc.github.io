+++
title = "The Decomposition of Large Language Models"
description = ""
author = "Christopher Laing"
date = "2023-05-30T09:00:00+13:00"
tags = ["LLMs", "AI"]
categories = ["Technology"]
comments = false
draft = false
removeBlur = false
[[images]]
  src = "img/2023/05/circuit.jpeg"
  alt = "a circuitboard"
  stretch = "vertical"
+++

While many AI systems can be very complex, Large Language Models (LLMs) seem to be refreshingly simple to understand. With their ability to generate human-like text, applications like ChatGPT have captured the popular imagination. However, as compelling an experience as chatbots are, the tradeoffs that they make can lead us to misunderstand LLMs as a whole. In this post, we will explore the idea that the functions of LLMs can be thought of as discrete capabilities, and how different composition of these functions leads to a much wider variety of user experiences.

<!--more-->

### The Discrete Capabilities of Large Language Models

We can think of LLMs as being composed of several functions that work together to produce the final output. These functions include, but are not limited to, input interpretation, embedding and embedding search, synthesis, and generation. 

* Input Interpretation: the LLM takes the user's query and interprets it in a way that it can understand and respond to. This function is crucial for effective communication between the user and the model.
* Embedding and Embedding Search: the LLM takes the interpreted input and transforms it into a numerical representation, known as an embedding. This embedding can then be searched to find similar embeddings in the model's knowledge base, allowing it to draw on relevant information when generating a response.
* Synthesis: the LLM takes a set of documents and combines them into a coherent narrative. This involves connecting disparate pieces of information and presenting them in a way that makes sense to the user.
* Generation: the LLM generates a natural-language response. This is the function that most users interact with and see the results of.

### The Implicit Composition of ChatGPT

ChatGPT, one of the most well-known LLM-powered applications, composes these functions implicitly. It takes a user's query and generates a response in a zero-shot manner, drawing on all of the knowledge it has gathered during its training phase. This approach has its advantages, such as the ability to generate diverse and creative responses. However, it also has its drawbacks, the most notable of which is the tendency to hallucinate, or generate information that is not accurate or grounded in reality. This has led many to believe that such hallucination is an inherent feature of LLMs, but this is not necessarily the case.

### Different Composition Equals Different Experience

By composing the functions of an LLM differently, we can achieve a different tradeoff of functionality and, consequently, a different user experience. For instance, we can use the LLM's embedding function to create a searchable index. This index can return results using embedding search, which can then be combined with the LLM's interpretive capability to transform imprecise user queries into precise lookups.

The results of this search can then be synthesised from a disconnected group of documents into a coherent narrative, based on verifiable sources. This approach can help mitigate the issue of hallucination, as the responses are grounded in verified information, leading to a more accurate and reliable user experience.

This is just one example among multitudes of the recomposition of LLM functions. The key to understanding the true capabilities of LLMs is to cease viewing them as autonomous agents possessing intelligence in the human sense. Instead, they are better viewed as mathematical constructs that can be manipulated by computer programs. These functions, when combined in the manner of "traditional" programming, can pave the way for more nuanced and precise user experiences. This approach allows us to harness the capabilities of LLMs in a more controlled and directed manner, mitigating some of the limitations associated with their use as chatbots.

### The Potential of LLMs Lies Beyond Chatbots

By viewing LLMs through this lens, we can also uncover a broader range of applications than what might be apparent from an experience with chatbots alone. The discrete functions of LLMs can be leveraged in numerous ways, each offering unique possibilities for innovation and advancement. While chatbots are a compelling user experience for demonstrating the power of the technology, they are both limiting and misleading as paradigms of what LLMs can be used to achieve.

