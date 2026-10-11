+++
date = "2016-11-13"
title = "Keybase: Keys for everyone! Part I"
author = "Christopher Laing"
categories = ["cryptography", "technology"
]
draft=false

+++

{{< figure src="/img/2016/11/chrislaing_keybase_proof_graph.png" alt="Graph of Keybase proofs for Keybase user chrislaing" type="right" >}}
Encryption is a topic that has fascinated me for years, less because of its mathematical basis than its applications, both existing and potential. By far my favourite project in this realm is [Keybase](https://keybase.io).

<!--more-->
Keybase cleverly solves several major problems with PGP-based encryption technology by taking the attitude that online, your identity is functionally the sum of your online profiles. With Keybase, you can automatically verify that [@cjlaing](https://twitter.com/CJLaing) on twitter has a particular key, and can encrypt messages or files for him without having to ascertain and validate his key through some other medium. The client software is open source, and works seamlessly with both PGP and NaCl keys.

One of the truly excellent features of Keybase's design is its trust model; although their website and file hosting service offers a centralised interface, that interface is entirely orthogonal to the operation of the service. When you want to id someone and verify their key ([me, for example](https://keybase.io/chrislaing)), the Keybase client goes to each of their listed web identities, finds the proof, and verifies it, without needing to trust the [keybase.io](https://keybase.io) website at all. Every time a user verifies someone's identity by tracking them, this proof is written into the blockchain. The entire chain can then be independently verified, without requiring anyone to trust Keybase itself.

The [Keybase filesystem](https://keybase.io/docs/kbfs) is an extremely clever extension of the core Keybase concept. What I find most interesting is the idea that, in principle, data can be securely shared with someone who hasn't yet signed up for Keybase, whom you know purely through one of their online identities. When they join Keybase and prove their ownership of that identity, your client will verify the proof and encrypt the file for them.

Keybase is still in an invitation-only testing phase, however they already have over 100,000 users as of the time of writing. The project is bringing a lot of great new ideas together with solid, tried, and tested cryptography, and I'm excited to see where the project goes next.

In Part II of this post, we'll take a look at how to verify Keybase proofs yourself, and traverse a user's cryptographic chain using Python.
