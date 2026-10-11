+++
featured = ""
featuredalt = ""
description = ""
date = "2016-11-08T21:27:54+01:00"
categories = ["technology", "containers"
]
title = "Docker for Data Science: not all it's cracked up to be"
linktitle = ""
featuredpath = ""
author = "Christopher Laing"
draft = true

+++

If you pay any attention to the technology industry, you'll know that the last few years have seen production hardware become commodotised by public cloud architectures. One can easily rent highly scalable infrastructure from Amazon, Microsoft, Google, and a host of smaller providers. Although these providers have offered an infinite supply - for practical purposes - of virtual machines for some time, the past year has seen a move towards scalable infrastructure on an even more granular level. In particular, this has come in the form of containers and lambda functions.

<!--more-->

Lambda functions, probably best exemplified by Amazon's lambda offering, are bare, stateless functions that can be executed in response to events, or explicit calls. They offer amazing utility in certain circumstances, but their usefulness is limited to a subset of cases. In this post, I want to focus more on the former phenomenon: containerisation.

Although containerisation has been around for quite some time, and in several forms, the technology that has really taken off recently is Docker. According to the Docker website,

> Docker containers wrap a piece of software in a complete filesystem that contains everything needed to run: code, runtime, system tools, system libraries – anything that can be installed on a server. This guarantees that the software will always run the same, regardless of its environment.

Docker is commonly used to enable Service-Oriented Architectures, in particular by containerising microservices. I found [this blog post by dwmkerr](http://www.dwmkerr.com/learn-docker-by-building-a-microservice/) to be extremely helpful in getting started with this kind of architecture.
