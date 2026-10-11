
+++
date = "2017-02-20"
title = "Keybase: Keys for everyone! Part II"
author = "Christopher Laing"
categories = ["cryptography", "technology"
]
draft=false

+++

In a [previous post]({{< ref "/blog/keybase-keys-for-everyone-part-i.md" >}}), we discussed [Keybase](https://keybase.io), a clever company that is solving a lot of the classic problems that users have had with PGP: managing keys, verifying identities, trusting third parties, and user experience.

<!--more-->

I also mentioned that Keybase insures iteself against an attack on its servers by writing the root of its Merkle tree into the blockchain. In this post, we'll explore what this means, and go through the process of verifying this ourselves step-by-step. 

Before we rush ahead to the verification, let's take a moment to understand what a Merkle root is, and why Keybase is using them.

Suppose that we have some discrete blocks of data, and that we would like to be able to verify the integrity of these data. Concretely, let's suppose that every time I do something on Keybase, such as verify myself on some social media account or revoke a device key, Keybase creates a JSON file which describes this activity, and stores this on its servers. Another user of Keybase can then go to Keybase's servers and collect this JSON blob from them, in order to verify my public activity. To be even more precise, the data that the other user really wants is my signature chain; a cryptographically signed chain that records my activity.

However, there's a problem. Servers are notoriously hackable, and if someone were to compromise Keybase's server, I could be downloading a JSON file that is telling me any old lies. Now, a compromised server's ability to lie is dramatically restricted by the fact that any user can verify the signature chain themselves, checking external social media sites for the claimed proofs. However, a compromised server would be able to show different versions of the server state to different users.

This is where the Merkle tree enters the equation. A Merkle tree takes each of the pieces of data we would like to verify, the "leaves" of the tree, and hashes them. Several of these hashes are then collected together according to a defined algorithm, and the concatenation of them is then itself hashed. These concatenations are then also grouped and hashed, and so on. This heirarchical grouping forms a tree, with each concatenated hash forming a node of the tree. Eventually, we end up with one final, concatenated hash. This hash is the root of the tree. Once in possession of the root hash and the algorithm used to group and concatenate the hashes, we can verify the state of every single leaf node at the point in time that they were hashed, giving us a picture of a consistent server state. All that is needed now is for us to be able to trust the root hash of the Merkle tree, which is achieved by signing the root hash with a private key.

The utility of a Merkle tree for keybase now becomes obvious. This system is, however, potentially vulnerable to a sophisticated "forking" attack. One example of such an attack might be that I revoke a compromised key, and publish this change to the comprimised Keybase server. The attacker chooses not to present an updated version of the Merkle tree to another user, and exploits his lack of knowledge of my published revokation.

Keybase solves this problem by writing the root of the Merkle tree to the Bitcoin blockchain by sending bitcoins from a known address to another. Instead of using the bitcoins, Keybase is using 160 bits of the receiving address to encode the root hash of the Merkle tree. To be a little more precise, Keybase generates a Merkle tree, then signs the root hash of the tree with its private key. It then generates a 160-bit hash of this signature, and sends Bitcoins from their address to the address represented by this hash. Once we know the address receiving the Bitcoins, we can compare the root hash of the Merkle tree presented to us by Keybase's servers to that stored in the blockchain, rendering the forking attack useless.

{{< figure src="/img/2017/02/Hash_Tree.png" alt="from:https://en.wikipedia.org/wiki/Merkle_tree">}}

Let's go through this process step by step, pausing where appropriate to make sure that we really understand what's going on. We'll use Python 3.5 to do this, partly because it is my language of choice for most tasks, but mostly because the [original keybase security documentation](https://keybase.io/docs/server_security/merkle_root_in_bitcoin_blockchain) uses Python, albeit version 2.7. Let me be clear right from the outset that the code is taken almost entirely from the keybase security documentation, and credit for it should be attributed to the Keybase team. My contribution is limited to making the code work with Python 3.5, and a few cosmetic edits for legibility.

We start by importing the packages that we'll need.


```python
import requests, datetime, json, re, gnupg
from base64 import b64decode
from pycoin.encoding import bitcoin_address_to_hash160_sec, hash160
from binascii import hexlify
from hashlib import sha512, sha256
```

Recall that what we need to find is the 160-bit hash of the signed root of the Keybase Merkle tree, which is stored in the blockchain as the receiving address for the latest transaction from the sending address `1HUCBSJeHnkhzrVKVjaVmWg2QtZS1mdfaz`. Without downloading the multi-gigabyte Bitcoin blockchain in its entirity, the easiest way to find this address is to query [blockchain.info](https://blockchain.info) using the requests library. Requests is a beautifully written python library, that is often cited as the gold standard for clean, pythonic APIs. I recommend learning to use its basic functionality even for simple cases such as ours.

We use a simple GET request to query the blockchain.info API.


```python
from_addr = "1HUCBSJeHnkhzrVKVjaVmWg2QtZS1mdfaz"
uri       = "https://blockchain.info/address/%s?format=json" % (from_addr)
r = requests.get(uri)
to_addr   = r.json()['txs'][0]['out'][0]['addr']
to_addr_hash = hexlify(bitcoin_address_to_hash160_sec(to_addr)).decode('utf-8')
print(to_addr_hash)
```
```text
1eeea91d88d3578e3e718fa97da8ec79d7227304
```

Notice that we have decoded the string from UTF-8. We will see this decoding and encoding of strings to and from UTF-8 appears several times as we progress. The difference from the keybase.io example arises because of the different way that Python 3.5 handles strings, and the encoding expectations of the different libraries that we are using. 

Given that our code varies from that presented on keybase.io, it would be reasonable to ask whether this encoding and decoding in some way invalidates the verification that we are undertaking. These processes merely alter the representation of the string, not its content. It is not the string object as it appears in computer memory that we are verifying, but the evaluated content of the string. Theoretically, we could even perform the verification process by hand, separating the content of the string entirely from its representation in computer memory. We are therefore on farily safe ground.

The variable `to_addr_hash` now contains a hexadecimal hash, which corresponds to a root block on the Keybase servers. We can query the Keybase API to find that block.


```python
kb        = "https://keybase.io/_/api/1.0"
uri       = "%s/merkle/root.json?hash160=%s" % (kb, to_addr_hash)
r = requests.get(uri)
root_desc = json.loads(r.text)
```

The `root_desc` variable now holds a JSON file full of information about the root block. What we need is the signature of the hash of the root block, which is contained in the `sig` field. Noting again the string encoding and decoding, we use a regular expression to extract the signature itself from the surrounding ASCII armouring, and verify with an assert statement that the hexadecimal hash of the signature matches the hexadecimal hash of the receiving bitcoin address that we found in the first step.


```python
sig = b64decode(re.compile(r"\n\n((\S|\n)*?)\n=").search(root_desc['sig']).group(1).encode('utf-8', 'ignore'))
if to_addr_hash == hexlify(hash160(sig)).decode('utf-8', 'ignore'):
    print("We have the correct block.")
else:
    print("Oops, wrong block!")
```

```text
We have the correct block.
```

Recall that this hash is not the root hash itself. Rather, it is the 160-bit hash of the Keybase PGP signature of the root hash. This makes sense, as we would like to be sure not just that the Merkle tree is intact, but that Keybase has verified it as being correct.

Keybase's Merkle key has the fingerprint `03E146CDAF8136680AD566912A32340CEC8C9492`, and is imported into my GPG keyring. The gnupg python package allows us to inspect this signature and verify it.


```python
gpg = gnupg.GPG()
verified = gpg.verify(sig)

print('Signed by {0},\n with public key fingerprint {1},\n on {2}.\n'.format(verified.username, 
                                                                                  verified.pubkey_fingerprint,
                                                                                 datetime.datetime.utcfromtimestamp(
                                                                                float(verified.sig_timestamp))
                                                                                  .strftime('%d/%m/%Y')))

if verified.valid:
    print('Signature is valid.')
else:
    print('Signature invalid!')
```

```text
Signed by Keybase.io Merkle Signing (v1) <merkle@keybase.io>,
 with public key fingerprint 03E146CDAF8136680AD566912A32340CEC8C9492,
 on 20/02/2017.
    
Signature is valid.
```

Now we know that not only is the Merkle tree is intact, but that Keybase has verified it as being correct, and when they did so. The signature object contains the root hash of the root block of the Merkle tree. We can use another regular expression to find it.


```python
root_hash = json.loads(re.compile(r"({[\x00-\x7f]*})").search(sig.decode('utf-8', 'ignore')).group(1))['body']['root']
print('Root block hash: %s' % root_hash)
```
```text
Root block hash: 55a8731fdb7141f0e8441d01f0431624de9d275952e7dcb19bb35088a0e5cf90312c67cb0fc876a5a888b61fa545c1261bc2732ac2d759e6f9488b30ff902f28
```

Now that we have the hash of the root block, let's check that the Keybase server wasn't lying to us about the contents of the block. 


```python
uri = "%s/merkle/block.json?hash=%s" % (kb, root_hash)
value_string = requests.get(uri).json()['value_string']
computed_hash = hexlify(sha512(value_string.encode('utf-8')).digest()).decode('utf-8')
if computed_hash == root_hash:
    print('Root hash and computed hash match.')
else:
    print('Root hash: %s,\n'%root_hash, 'Computed hash: %s'%computed_hash)

```
```text
Root hash and computed hash match.
```

Let's pause and think about what we've discovered. We know that Keybase created a Merkle tree, which encodes the exact status of every user's signature chain at the time that the tree was written. The root hash of this tree was then signed by Keybase, and then this signature was hashed and written into the blockchain.

To verify this, we walked backwards through the process. We went to the blockchain and found the latest hash, and asked Keybase for the signed Merkle tree corresponding to this hash. We verified that the hash of this signature corresponded to the hash that we found in the blockchain, and then verified that the signature came from Keybase. Having done that, we checked that the hash we were given is correct by computing the hash ourselves, and comparing the two.

We can now descend the Merkle tree to find the last thing I signed into my sigchain. You can use any user, as this is public information (indeed, that's the point!), so try your own.


```python
username = "chrislaing"
uri      = "%s/user/lookup.json?username=%s" % (kb, username)
r = requests.get(uri)
uid = r.json()['them']['id']
```

Let's define a couple of helper functions to make descending the tree easier. The trees are written in such a way that the JSON string returned by the API has as keys the first few characters of the hash. The method I use in `traverse_tree` is actually quite ugly, as it simply checks each potential key length until it finds a match. The data is so small, however, that I didn't see the need to write a prettier way of doing it - if you'd like to do this, then please leave a comment, and I'll update the post.



```python
def traverse_tree(start_hash):
    uri = "%s/merkle/block.json?hash=%s" % (kb, start_hash)
    value_string = requests.get(uri).json()['value_string']
    computed_hash = hexlify(sha512(value_string.encode('utf-8')).digest()).decode('utf-8')
    assert(computed_hash == start_hash)
    tab = json.loads(value_string)['tab']
    for i in range(len(uid)+1):
        if uid[:i] in tab.keys():
            print('key length %d of %d'%(i, len(uid)))
            nxt = tab[uid[:i]]
            if i == len(uid):
                return nxt[1][1]
            else:
                return nxt

def verify_link_hash(link_hash):
    uri = "%s/sig/get.json?uid=%s" % (kb, uid)
    payload = requests.get(uri).json()['sigs'][-1]['payload_json']
    computed_hash = hexlify(sha256(payload.encode('utf-8')).digest()).decode('utf-8')
    return (computed_hash == link_hash.encode('utf-8'))

def get_computed_hash(uid):
    uri = "%s/sig/get.json?uid=%s" % (kb, uid)
    payload = requests.get(uri).json()['sigs'][-1]['payload_json']
    computed_hash = hexlify(sha256(payload.encode('utf-8')).digest()).decode('utf-8')
    return computed_hash

def get_payload(uid):
    uri = "%s/sig/get.json?uid=%s" % (kb, uid)
    payload = requests.get(uri).json()['sigs'][-1]['payload_json']
    return payload        
```


The idea is very simple. Using my user ID, we query the Keybase api for the last action that I signed into my sigchain. To verify that this exists in the version of the Merkle tree that we verified above, we walk down the Merkle tree, progressively querying the Keybase API for each new node, and then comparing the hash of what Keybase tells us to the hash we expect. In this way, we verify all the contents of the Merkle tree from the root, down the branches that lead to my leaf, until we arrive at my leaf block itself.


```python
link_hash = root_hash
computed_hash = get_computed_hash(uid)
while link_hash != computed_hash:
    link_hash = traverse_tree(link_hash)
    
if link_hash == computed_hash:
    print('Leaf node found in the Merkle tree.')
else:
    print('Leaf node is not part of the Merkle tree!')
```
```text
key length 1 of 32
key length 2 of 32
key length 3 of 32
key length 4 of 32
key length 32 of 32
Leaf node found in the Merkle tree.
```

Now that we know that the server state that Keybase is reporting to us is correct, consistent, and signed by Keybase, we can inspect the payload we got from the API to see what I actually did.


```python
json.loads(get_payload(uid))
```



```text
{  
   'body':{  
      'key':{  
         'eldest_kid':'0101c0eab8dc42e80f0a754adc7d5504249ca3dc2d6c848407e6e148729c800a25010a',
         'host':'keybase.io',
         'kid':'0120d945e916db5015ff9e8d5605e822e3808c90602a043fe08aa43b91449a5de6b40a',
         'uid':'4ac28b770f9cd1199981621a42eac000',
         'username':'chrislaing'
      },
      'service':{  
         'name':'reddit',
         'username':'laing_c'
      },
      'type':'web_service_binding',
      'version':1
   },
   'client':{  
      'name':'keybase.io go client',
      'version':'1.0.18'
   },
   'ctime':1487579548,
   'expire_in':504576000,
   'merkle_root':{  
      'ctime':1487579413,
      'hash':'f37e1e249b16110bb5ad4fdaba7cc044ee86ce6aae1efb1c51eedf6ca9d955a6cd400e19dc9211e68ad9cf74a4b2082aa767c831ff625417a936e82b6d6857fd',
      'seqno':907120
   },
   'prev':'bf84e1e3dd41765dd105ee814bc4b81dcba6a3988f5c12896b56ab2d430ecb9b',
   'seqno':45,
   'tag':'signature'
}
```


In this case, I proved my reddit identity, `laing_c`. The JSON blob also contains lots of useful details about the proof, such as the time that I signed it, the details of the client used to sign the proof, and so on.

In case you're curious, [here's the proof.](https://www.reddit.com/r/KeybaseProofs/comments/5v3hy8/my_keybase_proof_redditlaing_c_keybasechrislaing/)

{{< figure src="/img/2017/02/reddit_keybase_proof.png" alt="My Keybase proof on Reddit">}}


Now we know how to verify that Keybase hasn't been taken over by a malicious third party, who is seeking to lie to us - either actively or by omission - about the state of the Keybase server.

I really applaud the team at Keybase for going to this extent. It's fantastic that they have managed to combine a very accessible day-to-day user experience with a completely open and verifiable trust system. I haven't even touched on some of the other magic they've been working, such as the [Keybase file system](https://keybase.io/docs/kbfs), but I might come to that in a future post.

I hope that you enjoyed this little walk through the Keybase blockchain verification system, and that you found it somewhat helpful in understanding how Keybase works.
