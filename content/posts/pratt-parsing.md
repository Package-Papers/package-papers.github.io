---
title: "Pratt Parsing"
date: 2023-08-12T15:31:12+07:00
authors:
  - Ochawin Apichattakul
tags:
  - compiler
  - parsing
  - python
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

Our token will simply contain the token type and its string value (referred to as the lexeme).
{{< codeblock name= "Defining tokens" >}}
{{< highlight python >}}
from enum import Enum
from dataclasses import dataclass

# All different token types we have:
# 1. Number
# 2. Operator
# 3. Parenthesis
# 4. ILLEGAL & End Of File
TokenType = Enum(
    "Token", ["ILLEGAL", "INTEGER", "PLUS",
              "MINUS", "MULT", "DIV", "LPAREN", "RPAREN", "EOF"]
)

# A token is just a dataclass holding the
# type of the token and it's raw string value.
@dataclass
class Token:
    token_type: TokenType
    lexeme: str

# The End of File token. We have to place this manually.
EOF_TOKEN = Token(TokenType.EOF, "")
{{< /highlight>}}
{{< /codeblock>}}

Now that we have defined our tokens, we can make a function to match and return an appropriate token given an input string.
{{< codeblock name= "The tokenizer" >}}
{{< highlight python >}}
def tokenize(input: str) -> Token:
    """
    Given a string, return its relevant token.
    """
    token_type: TokenType

    if input == "+":
        token_type = TokenType.PLUS
    elif input == "-":
        token_type = TokenType.MINUS
    elif input == "/":
        token_type = TokenType.DIV
    elif input == "*":
        token_type = TokenType.MULT
    elif input == "(":
        token_type = TokenType.LPAREN
    elif input == ")":
        token_type = TokenType.RPAREN
    elif input.isnumeric():
        token_type = TokenType.INTEGER
    else:
        token_type = TokenType.ILLEGAL

    return Token(token_type, input)
{{< /highlight>}}
{{< /codeblock>}}

Now implementing our (crude) lexer becomes trivial.

{{< codeblock name= "The lexer" >}}
{{< highlight python >}}
def lex(input: str) -> List[Token]:
    """
    Given an input, split all words by a single
    space, trim and tokenize each of the words.
    Note: The EOF token is manually appended.
    """
    return [tokenize(word.strip()) for word in input.split(" ")] + [EOF_TOKEN]
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
# [Token(token_type=<Token.INTEGER: 2>, lexeme='1'), Token(token_type=<Token.PLUS: 3>, ...
{{< /highlight>}}
{{< /codeblock>}}

Superb, everything is almost ready, we just have to set up our parser class now. Here are the methods we need:
* A method to read the current token
* A method to increment the position of the current token
* A method to return the next token
* A method to check whether our current token matches what we expect

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
class Parser:

    # Lex the input source and store
    def __init__(self, input: str):
        self.current = 0
        self.tokens = lex(input)

    # Returns the current token
    def read(self) -> Token:
        return self.tokens[self.current]

    # Returns the current token and increment the position
    def advance(self) -> Token:
        token = self.read()
        self.current += 1
        return token

    # Returns the next token
    def peakNext(self) -> Token:
        return self.tokens[self.current + 1]

    # Returns whether the current token matches the expected token
    def expect(self, token: Token) -> bool:
        return self.read() == token 
{{< /highlight>}}
{{< /codeblock>}}

Alright great, now our parser is sufficient. Let's get started.

## 4. Prefix expressions
Alas, we've reached the first boss. Incase you're unfamiliar, a prefix expression is either a **number** [2, 5, 10], or an **unary** expression which is an expression preceded by an operator [-2, -5, -(-10)].  In Pratt parsing, this is the first thing you parse, so let's setup to do exactly that.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
Expression = Any

class Parser:
    # Code omitted...

    def parseExpression(self) -> Expression:
        token = self.advance()

        # Parse the prefix expression based on current token.
        expr = self.parsePrefixExpression(token)

        # We always expect an expression, if there isn't one, parser error.
        if expr is None:
            return None

        return expr
        
{{< /highlight>}}
{{< /codeblock>}}

Great, now we can start with parsing the simplest form of an expression: constant expressions (2, 5, 10). We'll need to add another type for that.

{{< codeblock name= "Expression Types" >}}
{{< highlight python >}}
Expression = Any

@dataclass 
class ConstantExpression:
    expr: int
{{< /highlight>}}
{{< /codeblock>}}

Parsing a constant value is trivial, we just have to convert the lexeme into an integer.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseConstantExpression(self, token: Token) -> ConstantExpression:
    return ConstantExpression(int(token.lexeme))
{{< /highlight>}}
{{< /codeblock>}}

Now we just have to wire it into our **parsePrefixExpression** method.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parsePrefixExpression(self, token: Token) -> Expression:
    match token.token_type:
        case TokenType.INTEGER: # Constant Expression
            return self.parseConstantExpression(token)
        case _: # Unexpected token found
            print(f"Error, no matching prefix rule found for: {token}")
            return None
{{< /highlight>}}
{{< /codeblock>}}

And now with just this, we can actually parse numbers! Let's give it a whirl.

{{< codeblock name= "Parsing constant expressions" >}}
{{< highlight python >}}
Parser("2").parseExpression()   # ConstantExpression(expr=2)
Parser("42").parseExpression()  # ConstantExpression(expr=42)
Parser("900").parseExpression() # ConstantExpression(expr=900)
{{< /highlight>}}
{{< /codeblock>}}

Now let's move onto parsing unary expressions. Again, we have to add a new type.
{{< codeblock name= "Expression Types" >}}
{{< highlight python >}}
@dataclass
class UnaryExpression:
    operator_token: TokenType
    expr: Expression
{{< /highlight>}}
{{< /codeblock>}}

Notice that the **unary** expression class consists of two members, one holding the prefix operator token (+, -, etc) and the other one holding the expression it applies to. 

Getting the operator token is trivial, we can extract it straight from the current token we're reading. But now here's a thought provoking question, how on Earth will we work out the expression? If only we had a function which could figure it out for us... 

Oh! There is nothing stopping us from calling **parseExpression**! We can just throw the work of figuring out the expression to it. Now parsing unary expression becomes trivial.

{{< codeblock name= "Expression Types" >}}
{{< highlight python >}}
def parseUnaryExpression(self, token: Token) -> UnaryExpression:
    return UnaryExpression(token.token_type, self.parseExpression())
{{< /highlight>}}
{{< /codeblock>}}
Now we wire it back.

<blockquote>Note: We can easily support for more unary operators by just adding more cases.</blockquote>

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parsePrefixExpression(self, token: Token) -> Expression:
    match token.token_type:
        # ...
        case TokenType.MINUS: # Unary Expression
            return self.parseUnaryExpression(token)
        # ...
{{< /highlight>}}
{{< /codeblock>}}


Great, now we can try parsing some unary expressions

{{< codeblock name= "Parsing unary expressions" >}}
{{< highlight python >}}
a = Parser("- 2").parseExpression()
# a = UnaryExpression(
#       operator_token=<Token.MINUS: 4>,  
#       expr=ConstantExpression(expr=2)
# )

b = Parser("- - 42").parseExpression()
# b = UnaryExpression(
#       operator_token=<Token.MINUS: 4>, 
#       expr=UnaryExpression(
#               operator_token=<Token.MINUS: 4>, 
#               expr=ConstantExpression(expr=42)
#       )
# )
{{< /highlight>}}
{{< /codeblock>}}
