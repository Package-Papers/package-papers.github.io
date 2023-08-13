---
title: "Pratt Parsing"
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
So before anything, I'd like to make sure we're on the same page here. It's important you understand what parsing is.

Parsing is like taking apart a sentence to understand its structure using certain rules. Imagine you have a bunch of words, and you want to arrange them in a way that makes sense. You follow some rules to do this, and once you're done, you can see patterns in how the words fit together, making the sentence meaningful.

I think the concept can be best explained with an example. Consider the following expression:
$$
V = 2 \cdot 3 + 3.
$$
What is the resulting value of `V` here? You see, in this example there is actually two different ways we can evaluate the expression which will give us two very different results.

Way **A**:
$$
(2 \cdot 3) + 3 = 9,
$$
Way **B**:
$$
2 \cdot (3 + 3) = 12.
$$

So... what's the right answer? Well, it's whatever we want it to be. In our case, with respect to **BIDMAS** (or **PEMDAS**), we know that multiplication $(2 \cdot 3)$ takes prece-
dence over the addition operation $(3 + 3)$, which results in expression of way `A`.

It might not be obvious, but internally, what we just did was parsing the expression using the grammatical rules of **BIDMAS**.

So, in short, parsing is kind of like the process of stitching a bunch of symbols together, guided by a set of rules to produce a result which is meaningful in the language of the grammar it conforms to. It is a **translation**.

```c
                                                         (+)
                                          Parse          / \
                             2 * 3 + 3    ----->       (*)   3
                                                       / \
                                                      2   3
```       
<blockquote>
Note: The top of the expression/parse tree is evaluated last. 
<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;As we traverse down the tree, the precedence level increases.
</blockquote>

So before I get into the actual meat of this post, let me just say, parsing is *very* important, especially in programming language processing. It is responsible for translating our human-readable source code into machine-executable instructions. Without effective parsing we would not be able to enjoy the convenience of high level programmming languages.

## 2. The Goal 
To demonstrate how the Pratt parser works, we're going to be building a basic Pratt parser for evaluating mathematical expressions from scratch. I could bore you with heaps of nitty-gritty details about the technique but that's probably not what you're here for, and quite frankly, neither of us would enjoy that. So instead, I will sprinkle relevant details I think you should know at each stage of the implementation.

Let's get started.

## 3. Lexical Analysis
Since I'm building everything from complete scratch, I'm going to have to build a lexer first. The role of the lexer is to simply convert raw strings of the source code into tokens which represents what it is supposed to be. The reason we need to tokenize everything is because by classifying each component, it becomes easier to work with.

Since this is only for demonstrative purposes I'm going to keep it as simple as possible. 

So first, we can define our tokens as a simple enum:
{{< codeblock name= "Defining tokens" >}}
{{< highlight python >}}
from enum import Enum

# This enum represents the tokens for each type of symbol. 
# There are only three main cases for us.
# 1. Number
# 2. Operator
# 3. Parenthesis
Token = Enum(
    "Token", ["ILLEGAL", "INTEGER", "PLUS", "MINUS", "MULT", "DIV", "LPAREN", "RPAREN"]
)
{{< /highlight>}}
{{< /codeblock>}}

Now that we have defined our tokens, we can make a function to match and return an appropriate token given an input string.
{{< codeblock name= "The tokenizer" >}}
{{< highlight python >}}
def tokenize(input: str) -> Token:
    """
    Given a string, return its relevant token.
    """

    if input == "+":
        return Token.PLUS
    elif input == "-":
        return Token.MINUS
    elif input == "/":
        return Token.DIV
    elif input == "*":
        return Token.MULT
    elif input == "(":
        return Token.LPAREN
    elif input == ")":
        return Token.RPAREN
    elif input.isnumeric():
        return Token.INTEGER
    else:
        return Token.ILLEGAL
{{< /highlight>}}
{{< /codeblock>}}

Now implementing our (crude) lexer becomes trivial.

{{< codeblock name= "The lexer" >}}
{{< highlight python >}}
def lex(input: str) -> List[Token]:
    """
    Given an input, split all symbols by
    space and tokenize each of the symbols.
    """

    return [tokenize(word.strip()) for word in input.split(" ")]
{{< /highlight>}}
{{< /codeblock>}}

<blockquote>
Note: With this approach, the usage of split means that every single symbol has to 
&emsp;&emsp;&emsp;be separated by a single space. It isn't ideal but this can be fixed later.
</blockquote>

So now we can properly tokenize any given expression like this:
{{< codeblock name= "Tokenizing an expression" >}}
{{< highlight python >}}
input = "1 + ( 2 * 3 ) - 4 / 2"
token_stream = lex(input)
# [
#  <Token.INTEGER: 2>,
#  <Token.PLUS:    3>,
#  <Token.LPAREN:  7>,
#  <Token.INTEGER: 2>,
#  <Token.MULT:    5>,
#  <Token.INTEGER: 2>,
#  <Token.RPAREN:  8>,
#  <Token.MINUS:   4>,
#  <Token.INTEGER: 2>,
#  <Token.DIV:     6>,
#  <Token.INTEGER: 2>
# ]

{{< /highlight>}}
{{< /codeblock>}}

