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
---
I was first introduced to the concept of `Pratt parsing` (top down operator precedence) while reading [Bob Nystrom](https://journal.stuffwithstuff.com/)'s remarkable [crafting interpreters](https://craftinginterpreters.com/), a book which I think everyone should read at least once in their career. Pratt parsing, named after its creator [Vaughan Pratt](https://en.wikipedia.org/wiki/Vaughan_Pratt), is a powerful technique used in programming language parsing.

In this post, I will be demonstrating the concept of Pratt parsing by showing you how we can implement it for a basic expression calculator.

Admittedly it has been quite some time since I've done any parsing, but I'm hoping to brush off the dust and refresh my memory and hopefully be able to cement the concept for good after this post.

Now with the introduction out of the way, let's dive straight in.

## 1. What is Parsing
So before anything, I'd like to make sure we're on the same page here. It's important you understand what parsing is.

Parsing is the process of taking apart a sentence to understand its structure using certain rules. Imagine you have a bunch of words, and you want to arrange them in a way that makes sense. You follow some rules to do this, and once you're done, you can see patterns in how the words fit together, making the sentence meaningful.

I think the concept can be best explained with an example. Consider the following expression:
$$
V = 2 \cdot 3 + 3.
$$
What is the resulting value of `V` here? 

You see, in this example there is actually two different ways we can evaluate the expression which will give us two very different results.

Way **A**:
$$
(2 \cdot 3) + 3 = 9,
$$
Way **B**:
$$
2 \cdot (3 + 3) = 12.
$$

So... what's the right answer? Well, with respect to **BIDMAS** (or **PEMDAS**), we know that multiplication $(2 \cdot 3)$ takes precedence over the addition operation $(3 + 3)$, which results in expression `A`.

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

So before I get into the actual meat of this post, let me just say, parsing is *very* important, especially in programming language processing. It is responsible for translating our human-readable source code into machine-executable instructions. In fact, without effective parsing we would not be able to enjoy the convenience of high level programming languages.

## 2. The Goal 
To demonstrate how the Pratt parser works, we're going to be building a basic Pratt parser for evaluating math expressions from scratch. I could bore you with heaps of nitty-gritty details about the technique but that's probably not what you're here for, and quite frankly, neither of us would enjoy that. So instead, I will sprinkle relevant details I think you should know at each stage of the implementation.

Let's get started.

## 3. Lexical Analysis
Since I'm building everything from complete scratch, I'm going to have to build a lexer first. The role of the lexer is to simply convert raw strings of the source code into tokens. The reason we need to tokenize everything is because by classifying each component, they become easier to work with.

Since this is only for demonstrative purposes I'm going to keep it as simple as possible. 

Our token will only contain the token type and its string value (referred to as the lexeme).
{{< codeblock name= "Defining tokens" >}}
{{< highlight python >}}
from enum import Enum
from dataclasses import dataclass

# All different token types we have:
# 1. Number
# 2. Operator
# 3. Parenthesis
# 4. Illegal & End Of File
TokenType = Enum(
    "Token",
    ["ILLEGAL", "NUMBER", "PLUS", "MINUS", "MULT", "DIV", "POW", "LPAREN", "RPAREN", "EOF"],
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

def isnumber(input: str) -> bool:
    """
    Returns true if the input represents an integer or float.
    """
    return input.replace(".", "").isdigit()

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
    elif input == "^":
        token_type = TokenType.POW
    elif isnumber(input):
        token_type = TokenType.NUMBER
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
# [Token(token_type=<Token.NUMBER: 2>, lexeme='1'), Token(token_type=<Token.PLUS: 3>, ...
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
    def expect(self, token: TokenType) -> bool:
        return self.read().token_type == token 
{{< /highlight>}}
{{< /codeblock>}}

Alright great, now our parser is sufficient.

## 4. Prefix Expressions
Alas, we've reached the first boss. Incase you're unfamiliar, a prefix expression is either a **number** `2, 5, 10`, or an **unary** expression which is an expression preceded by an operator `-2, -5, -(-10)`.  In Pratt parsing, this is the first thing you parse, so let's setup to do exactly that.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
Expression = Any

class Parser:
    # Code omitted...

    def parseExpression(self) -> Expression:
        token = self.advance()

        # Parse the prefix expression based on current token.
        expr = self.parsePrefixExpression(token)

        # We always expect an expression, if there isn't one then it is an error.
        if expr is None:
            return None

        return expr
        
{{< /highlight>}}
{{< /codeblock>}}

<ins>**Constant Expressions**</ins>

Great, now we can start with parsing the simplest form of an expression: **constant expressions** (`2, 5, 10`). We'll begin by defining a new type.

{{< codeblock name= "Defining the ConstantExpression type" >}}
{{< highlight python >}}
Expression = Any

@dataclass 
class ConstantExpression:
    expr: float

    # For debugging.
    def __str__(self):
        return self.expr
{{< /highlight>}}
{{< /codeblock>}}

Parsing a constant value is trivial, we just have to convert the lexeme into its numerical value.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseConstantExpression(self, token: Token) -> ConstantExpression:
    return ConstantExpression(float(token.lexeme))
{{< /highlight>}}
{{< /codeblock>}}

Now we just have to wire it into our `parsePrefixExpression` method.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parsePrefixExpression(self, token: Token) -> Expression:
    match token.token_type:
        case TokenType.NUMBER: # Constant Expression
            return self.parseConstantExpression(token)
        case _: # Unexpected token found
            print(f"Error, no matching prefix rule found for: {token}")
            return None
{{< /highlight>}}
{{< /codeblock>}}

And now we can actually parse numbers! Let's give it a try.

{{< codeblock name= "Parsing constant expressions" >}}
{{< highlight python >}}
Parser("2").parseExpression()   # ConstantExpression(expr=2.0)
Parser("42").parseExpression()  # ConstantExpression(expr=42.0)
Parser("900").parseExpression() # ConstantExpression(expr=900.0)
{{< /highlight>}}
{{< /codeblock>}}

<ins>**Unary Expressions**</ins>

Now let's move onto parsing **unary expressions**. Again, we have to add a new type.
{{< codeblock name= "Defining the UnaryExpression type" >}}
{{< highlight python >}}
@dataclass
class UnaryExpression:
    operator_token: Token
    expr: Expression

    # For debugging.
    def __str__(self):
        return f"{self.operator_token.lexeme}({self.expr})"
{{< /highlight>}}
{{< /codeblock>}}

Notice that the **unary** expression object consists of two members, one holding the prefix operator token (`+`, `-`, etc) and the other one holding the expression it applies to. 

Getting the operator token is trivial, we can extract it straight from the current token we're reading. But now here's the real question, how on Earth will we work out the expression? If only we had a function which could figure it out for us... 

Oh! There is nothing stopping us from calling `parseExpression`! We can just throw the work of figuring out the expression to it. Now parsing unary expressions becomes trivial.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseUnaryExpression(self, token: Token) -> UnaryExpression:
    return UnaryExpression(token, self.parseExpression())
{{< /highlight>}}
{{< /codeblock>}}
Now we wire it back.

<blockquote>Note: We can easily support more unary operators by just adding more cases.</blockquote>

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


Great, now we can try parsing some unary expressions.

{{< codeblock name= "Parsing unary expressions" >}}
{{< highlight python >}}
a = Parser("- 2").parseExpression()
# a = UnaryExpression(
#       operator_token=<Token.MINUS: 4>,  
#       expr=ConstantExpression(expr=2.0)
# )

print(a) # -(2)

b = Parser("- - 42").parseExpression()
# b = UnaryExpression(
#       operator_token=<Token.MINUS: 4>, 
#       expr=UnaryExpression(
#               operator_token=<Token.MINUS: 4>, 
#               expr=ConstantExpression(expr=42.0)
#       )
# )

print(b) # -(-(42))
{{< /highlight>}}
{{< /codeblock>}}

Now that the expression tree can be constructed properly, let's take it a step further and actually be able to evaluate the expression.

{{< codeblock name= "Adding a method to evaluate prefix expressions" >}}
{{< highlight python >}}
@dataclass
class ConstantExpression:
    # ...
    # Return the constant value
    def value(self):
        return self.expr

@dataclass
class UnaryExpression:
    # ...
    def value(self):
        match self.operator_token:
            # Negate the result of the expression
            case TokenType.MINUS:
                return -self.expr.value()
            case _:
                print(f"Error! Can't evaluate the value for {self.operator_token}")
                return None
{{< /highlight>}}
{{< /codeblock>}}

As you can see the evaluation process is very simple. The constant expression is our base case, the call to **value()** will simply return the integer which it holds. As for the unary expression, we simply have to call **value()** on the expression and apply the operator.

{{< codeblock name= "Evaluating prefix expressions" >}}
{{< highlight python >}}
Parser("- 2").parseExpression().value()       # -2.0
Parser("- - 42").parseExpression().value()    # 42.0
Parser("- - - 900").parseExpression().value() # -900.0
{{< /highlight>}}
{{< /codeblock>}}

And now we're done, yep that's it for prefixes.

## 5. Infix Expressions

It's time for the second boss, the *infix expression*. Again, incase you're unfamiliar, an infix expressions is an expression with an operator *in* between two operands.

As a first step, we are aiming to parse the following expression: `2 + 2`.

Let's see how our parser fares so far.

{{< codeblock name= "Evaluating infix expressions" >}}
{{< highlight python >}}
Parser("2 + 2").parseExpression() # ConstantExpression(expr=2.0)
{{< /highlight>}}
{{< /codeblock>}}

To no surprise, it isn't working properly, but thankfully we can clearly see why. The problem is that we stop parsing right after we have finished with the **prefix** expression. 

Let's fix that.

Once again, we begin by defining a new expression type.

{{< codeblock name= "Defining the BinaryExpression Type" >}}
{{< highlight python >}}
@dataclass
class BinaryExpression:
    lhs: Expression
    operator_token: Token
    rhs: Expression

    # For debugging.
    def __str__(self):
        return f"({self.lhs} {self.operator_token.lexeme} {self.rhs})"
{{< /highlight>}}
{{< /codeblock>}}
Now we can modify our `parseExpression` method to check whether the current token is **EOF** or not. If it isn't then we parse the infix expression.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseExpression(self) -> Expression:
    # Parse prefix...

    # Parse infix expression
    if !self.expect(TokenType.EOF):    
        token = self.advance()
        expr = self.parseInfixExpression(token, expr)

    return expr
{{< /highlight>}}
{{< /codeblock>}}

The `parseInfixExpression` method is almost a mirror of the `parsePrefixExpression`, the only difference is that we need to also pass in the left hand side expression.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseInfixExpression(self, token: Token, expr: Expression):
    match token.token_type:
        case: ... # all binary tokens... (+ - ^ * /)
            return BinaryExpression(
                expr, 
                token, 
                self.parseExpression()
            )
        case _:
            print(f"Error, no matching infix rule found for: {token}")
            return None
{{< /highlight>}}
{{< /codeblock>}}

Ha, wasn't that easy? Let's try parsing again.
{{< codeblock name= "Evaluating infix expressions" >}}
{{< highlight python >}}
print(Parser("2 + 2").parseExpression())             # (2 + 2)
print(Parser("2 + 2 + 3").parseExpression())         # (2 + (2 + 3))
print(Parser("1 + 2 + 3 + 4 + 5").parseExpression()) # (1 + (2 + (3 + (4 + 5))))
{{< /highlight>}}
{{< /codeblock>}}

Great now that we can parse infixes, let's make a method for evaluating them.

{{< codeblock name= "Adding a method to evaluate binary expressions" >}}
{{< highlight python >}}
@dataclass
class BinaryExpression:
    # ...

    def value(self):
        match self.operator_token.token_type:
            case TokenType.PLUS:
                return self.lhs.value() + self.rhs.value()
            case TokenType.MINUS:
                return self.lhs.value() - self.rhs.value()
            case TokenType.MULT:
                return self.lhs.value() * self.rhs.value()
            case TokenType.DIV:
                return self.lhs.value() / self.rhs.value()
            case TokenType.POW:
                return self.lhs.value() ** self.rhs.value()
            case _:
                print(f"Error! Can't evaluate the value for {self.operator_token}")
                return None
{{< /highlight>}}
{{< /codeblock>}}

{{< codeblock name= "Evaluating infix expressions" >}}
{{< highlight python >}}
print(Parser("2 + 2").parseExpression().value())             # 4.0
print(Parser("2 + 2 + 3").parseExpression().value())         # 7.0
print(Parser("1 + 2 + 3 + 4 + 5").parseExpression().value()) # 15.0
{{< /highlight>}}
{{< /codeblock>}}

Okay, but we have a new problem now, consider the following:

{{< codeblock name= "Not handling infix precedence" >}}
{{< highlight python >}}
a = Parser("2 * 3 + 3").parseExpression()
# BinaryExpression(
#     lhs=ConstantExpression(expr=2.0), 
#     operator_token=<Token.MULT: 5>, 
#     rhs=BinaryExpression(
#         lhs=ConstantExpression(expr=3.0),
#         operator_token=<Token.PLUS: 3>, 
#         rhs=ConstantExpression(expr=3.0)
#     )
# )

print(a) # (2 * (3 + 3))  <-- Oh no!
{{< /highlight>}}
{{< /codeblock>}}

As you can see the parser is grouping all operands to the right, it is treating all operators as *right-associative*. To fix this, we have to introduce the concept of **operator precedence** to the parser.

## 6. Handling Precedence

Allow me to introduce you to the <ins>**precedence table**</ins>, it should look familiar.

{{< codeblock name= "The precedence table" >}}
{{< highlight python >}}
# Precedence: Low -> High
# This is just BIDMAS
class Precedence(IntEnum):
    NONE           = 0 # Reserved for parsing termination.
    SUBTRACTION    = 1
    ADDITION       = 2
    MULTIPLICATION = 3
    DIVISION       = 4
    INDICES        = 5

def getPrecedence(token: TokenType) -> Precedence:
    """
    Given an infix operator, return its precedence level.
    """

    match token:
        case TokenType.PLUS:
            return Precedence.ADDITION
        case TokenType.MINUS:
            return Precedence.SUBTRACTION
        case TokenType.MULT:
            return Precedence.MULTIPLICATION
        case TokenType.DIV:
            return Precedence.DIVISION
        case TokenType.LPAREN:
            return Precedence.BRACKET
        case TokenType.POW:
            return Precedence.INDICES
        case _:
            return Precedence.NONE
{{< /highlight>}}
{{< /codeblock>}}

<blockquote>
Note: The precedence table will differ depending on what you are parsing.
</blockquote>

Now we refactor the `parseExpression` method to pass in the precedence as a parameter. We will use it to determine whether we parse the infix or not.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
# Note: I am setting a default value so parsePrefixExpression does not throw an error.
def parseExpression(self, precedence: Precedence = Precedence.SUBTRACTION) -> Expression:
    # Parse prefix expression...

    # We will parse the infix IF the precedence of the 
    # operator is higher or equal to the current context's precedence.
    if precedence <= getPrecedence(self.read().token_type):
        token = self.advance()
        expr = self.parseInfixExpression(token, expr)

    return expr
{{< /highlight>}}
{{< /codeblock>}}

We have to refactor `parseInfixExpression` to use the infix operator's precedence.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseInfixExpression(self, token: Token, expr: Expression):
    match token.token_type:
        case TokenType.PLUS | TokenType.MINUS | ...:
            return BinaryExpression(
                expr,
                token,
                self.parseExpression(getPrecedence(token.token_type)),
            )
        case _:
            ...
{{< /highlight>}}
{{< /codeblock>}}

While we're at it, lets also create a new entry point for parsing.
{{< codeblock name= "The parser class" >}}
{{< highlight python >}}

# We parse starting from the lowest valid precedence possible. 
# This means that it will only stop once we reach EOF, since Precedence.NONE is lower.
def parse(self) -> Expression:
    return self.parseExpression(Precedence.SUBTRACTION)
{{< /highlight>}}
{{< /codeblock>}}

Now we can try to parse again.

{{< codeblock name= "Evaluating infix with proper priority" >}}
{{< highlight python >}}
Parser("2 * 3 + 3").parse()
# BinaryExpression(
#     lhs=ConstantExpression(expr=2.0), 
#     operator_token=<Token.MULT: 5>,     ---->    (2 * 3)
#     rhs=ConstantExpression(expr=3.0)
# )
{{< /highlight>}}
{{< /codeblock>}}

Great, now we can prioritize grouping `2 * 3` over `3 + 3`. But where is the `+ 3`? 

Well, after the first infix is parsed (`2 * 3`) the context's precedence level became `MULTIPLICATION`. The next infix `3 + 3` has the precedence level of `ADDITION` which is lower than `MULTIPLICATION` so it isn't parsed.

The way we can fix this is quite simple, we just have to be able to fall back down to the last context which can parse it. 

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseExpression(self, precedence: Precedence) -> Expression:
    # Parse prefix expression...

    # Parse infix expression
    while precedence <= getPrecedence(self.read().token_type): # if --> while
        ...

    return expr
{{< /highlight>}}
{{< /codeblock>}}
By turning the process of parsing an infix into a while loop, we can now return to the previous context once the current one is terminated.

<blockquote>
Note: We will always be able to parse since we can always fallback onto the initial 
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`parseExpression` context which has the lowest precedence level.
</blockquote>

And now we can try to parse our expression again.

{{< codeblock name= "Evaluating infix with proper precedence handling" >}}
{{< highlight python >}}
Parser("2 * 3 + 3").parse()
# BinaryExpression(
#     lhs=BinaryExpression(
#         lhs=ConstantExpression(expr=2.0),
#         operator_token=<Token.MULT: 5>, 
#         rhs=ConstantExpression(expr=3.0)    ---->    ((2 * 3) + 3)
#     ), 
#     operator_token=<Token.PLUS: 3>, 
#     rhs=ConstantExpression(expr=3.0)
# )
{{< /highlight>}}
{{< /codeblock>}}

## 7. Prefix Precedence

At the moment, we are parsing prefix expressions with the precedence level of `Precedence.SUBTRACTION` which is the default value of `parseExpression`. This isn't ideal because the `parseExpression` call of `parseUnaryExpression` will overextend and grab more than it should. 

Consider the following example:

{{< codeblock name= "Not handling prefix precedence" >}}
{{< highlight python >}}
a = Parser("- 2 + 2").parse()
# UnaryExpression(
#   operator_token=<Token.MINUS: 4>,
#   expr=BinaryExpression(
#           lhs=ConstantExpression(expr=2.0),
#           operator_token=<Token.PLUS: 3>, 
#           rhs=ConstantExpression(expr=2.0)
#       )
#   )

print(a) # -((2 + 2))  <-- Wrong
{{< /highlight>}}
{{< /codeblock>}}

In order to support proper prefix precedence, we'll add a new precedence level. Since we know that indices takes precedence over the prefix, we'll insert it right before `Precedence.INDICES`.
{{< codeblock name= "The precedence table" >}}
{{< highlight python >}}
class Precedence(IntEnum):
    # ...
    DIVISION       = 4
    PREFIX         = 5
    INDICES        = 6
    # ...
{{< /highlight>}}
{{< /codeblock>}}

Now we refactor `parseUnaryExpression` to call `parseExpression` with `precedence.PREFIX`.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseUnaryExpression(self, token: Token) -> UnaryExpression:
    return UnaryExpression(token, self.parseExpression(Precedence.PREFIX))
{{< /highlight>}}
{{< /codeblock>}}

And that's it! Yep, that's all we had to do it fix it.

{{< codeblock name= "Evaluating with proper prefix precedence" >}}
{{< highlight python >}}
print(Parser("- 2 + 2").parse()) # (-(2) + 2)
{{< /highlight>}}
{{< /codeblock>}}


## 8. Grouped Expressions

Here is our final boss. Grouped expressions are exactly as the name implies, they are expressions which are grouped together via parentheses. E.g. `-(2+2)`, `(2+3)*3`.

Thankfully with the experience we have so far, we are quite well equipped to deal with them.

The first observation we can make is that the `(` operator appears before the operand, we know right away that this must be a type of *prefix* expression. So let's wire it up.

{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
# We wire it here.
def parsePrefixExpression(self, token: Token) -> Expression:
    match token.token_type:
        # ...
        case TokenType.LPAREN:
            return self.parseGroupedExpression()
        # ...
{{< /highlight>}}
{{< /codeblock>}}

And here comes the implementation.
        
{{< codeblock name= "The parser class" >}}
{{< highlight python >}}
def parseGroupedExpression(self):
    # Parse from the lowest valid precedence. We will consume everything up 
    # until we reach either `)` or `EOF` is reached. (They both return `Precedence.NONE`)
    expr = self.parseExpression(Precedence.SUBTRACTION)

    # After we finish parsing the expression, we expect the current token to be `)`.
    if self.expect(TokenType.RPAREN):
        # We consume the `)` token so the context we jump back to can 
        # continue parsing properly, starting from the next token.
        self.advance()
        return expr
    else:
        print("Error: Missing closing parenthesis")
        return None
{{< /highlight>}}
{{< /codeblock>}}

This blew my mind when I first saw it.

Here's a little explanation. Since we know that the expression should be able to parse everything starting from the opening parenthesis up until the closing parenthesis, we have start our precedence at the very *bottom* (`SUBTRACTION`!). We know that the parsing process for the expression should only stop once we reach the matching `)` token, this means that we just have to set the precedence of the closing parenthesis to `NONE` (Which is already true thanks to our default case in `getPrecedence`).

And with that we are officially done with our parser!

## Remarks
Writing this was *much* more difficult than I thought it would be, but it was also quite enjoyable. More than anything, I hope that you've found it resourceful.

I apologize if you found the format to be a little annoying to follow. I tend to begin with an incomplete implementation which partially works then slowly correct it, rather than just showing you the correct implementation right away. Doing so requires quite a lot of jumping around and refactoring which might be annoying, but I think that slowly building up to the solution is much better for learning than just giving one.

On a side note, images and figures aren't properly integrated yet so most of the content is just a wall of text, but you can expect that to change in newer posts.

Thankyou for reading!