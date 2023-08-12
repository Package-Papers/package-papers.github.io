---
title: "Pratt Parser"
date: 2023-08-12T15:31:12+07:00
authors:
  - Ochawin Apichattakul
tags:
  - compiler
  - parsing
math: true
draft: true
---
I was first introduced to the concept of `Pratt Parsing` (top down operator precedence) while reading [Bob Nystrom](https://journal.stuffwithstuff.com/)'s remarkable [crafting interpreters](https://craftinginterpreters.com/), a book which I think everyone should read atleast once in their career. Pratt Parsing, named after its creator [Vaughan Pratt](https://en.wikipedia.org/wiki/Vaughan_Pratt), is a powerful technique used in programming language parsing. It's like having a super-smart friend who can understand complex sentences and break them down into understandable pieces.

Admittedly it has been quite a while since I've touched the topic of parsing, but I'm hoping to brush off the dust and refresh my memory and hopefully be able to cement the concept for good after this post.

Now with that our introduction out of the way, let's dive straight in.

## 1. What is Parsing
Parsing is like taking apart a sentence to understand its structure using certain rules. Imagine you have a bunch of words, and you want to arrange them in a way that makes sense. You follow some rules to do this, and once you're done, you can see patterns in how the words fit together, making the sentence meaningful.

I think the concept can be best explained with an example. Consider the following expression:
$$
V = 2 \cdot 3 + 3.
$$
What is the resulting value of `V` here? You see, in this example there is actually two different ways we can evaluate the expression which will give us two very different results.

Option **A**:
$$
(2 \cdot 3) + 3 = 9,
$$
Option **B**:
$$
2 \cdot (3 + 3) = 12.
$$

So... what's the right answer? Well, it's whatever we want it to be. In our case, with respect to **BIDMAS** (or **PEMDAS**), we know that multiplication $(2 \cdot 3)$ takes prece-
dence over the addition operation $(3 + 3)$, which results in expression `A`.

It might not be obvious, but what we just did internally was actually parsing the expression using **BIDMAS** as our grammar. 

So, in short, parsing is basically the process of applying grammatical rules to a stream of symbols to form expression tree.

```c
                                                         (+)
                                          Parse          / \
                             2 * 3 + 3    ----->       (*)   3
                                                       / \
                                                      2   3
```       
<blockquote>
Note: The top of the expression tree is evaluated last. As we traverse down the 
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tree, the precedence level increases.
</blockquote>

## 2. Pratt Parsing
As the name suggests, Pratt parsing is just one of the many techniques in the realm of parsing. One may think of Pratt parsing as a refactorization/modficiation of the famous [recursive descent](https://en.wikipedia.org/wiki/Recursive_descent_parser) technique - well, I'd say it's more like an upgrade. Ofcourse the recursive descent is a very powerful technique which has aided us since the dawn of time. Sure it works perfectly most of the time because most syntax begins with a *keyword* (`if`, `struct`, ...), but where it falls short is when we introduce **infix** operators and **postfix** operators.