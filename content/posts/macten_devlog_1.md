---
title: "Macten Devlog 1"
date: 2023-12-30T23:15:55+07:00
authors:
  - Ochawin Apichattakul
draft: false
tags:
 - devlog
---

`Macten` is short for macro extensions. As the name suggests, `Macten` focuses on macros. The project's goal is to offer a build step involving macros for any given text-based programming language.

# 1. Background
My first exposure to macros came from using the `#define` directive in `C`. To be honest, initially, I found it unclear why such a feature would be useful. However, as time passed and I gained more experience, I began to love it more and more. It quickly became one of my favorite features, despite its very apparent flaws and limitations.

I was frustrated to find out that other languages like `Java` and `Python` lacked any macro features (though, of course, they have constructs that replicate macro behavior). I am fully aware that a language like `C` needs macros, but the same cannot be said for other languages, especially *dynamically* typed ones. I would never advocate the usage of macros over well-defined constructs that achieve the same behavior (though I will showcase them for demonstrative purposes).

More than anything, `Macten` serves as a learning project for me. Regardless of whether it ends up being necessary or not, I want to try to implement it and see it for myself. Also, I genuinely believe that a fixation on doing only necessary things will do nothing but harm your learning potential; it serves as a terrible stance for learning.

# 2. Primer
In case you are not familiar with macros, let's have a little primer on what macros are and what they look like in the wild.

## 2.1 Parameterless macro
As the name implies, a parameterless macro is a macro which takes in no input. This is also the most basic type of macro since it is simply just string substitution.

In `C` we can define a parameterless macro using the `#define` pre-preprocessor directives.
{{< codeblock name= "C declaration example" >}}
{{< highlight c >}}
// Defining constants.
#define PI 3.14159f
{{< /highlight>}}
{{< /codeblock>}}
Now we can call it in our code like so:
{{< codeblock name= "C usage example" >}}
{{< highlight c >}}
float calculate_circle_area(float radius)
{
  // Expands into: return radius * radius * 3.14159;
  return radius * radius * PI;
}
{{</highlight>}}
{{</codeblock>}}
As you can see, macros can be used to help improve readability, instead of using magic numbers we can instead use macros. Of course it's also fully valid to use a variable but for historical reasons macros were required because there was no such thing as a const qualifier in prior versions of C.

## 2.2 Parameters
A macro can also be fed arguments as if it were a function. One thing to take note of is that the call site of the macro may look exactly identical to the call site of a function (atleast in the case of `C`'s `#define`) and this may lead to a bunch of maintenance issues. To mitigate this problem, a convention is often adopted.

Here is an example of how a macro which takes in parameters can be declared:
{{< codeblock name= "C declaration example" >}}
{{< highlight c >}}
// `##` is a special operator used by the pre-processor to concatenate tokens together.
#define JOIN(a,b) a ## b

#define PI 3.14159f
#define CALCULATE_CIRCLE_AREA_FROM_RADIUS(radius) (radius * radius * PI)
{{< /highlight>}}
{{< /codeblock>}}
Now, we can call it like this:
{{< codeblock name= "C usage example" >}}
{{< highlight c >}}
void foo()
{
  // Expands into: float var1 = (0.5f * 0.5f * PI);
  float JOIN(var, 1) = CALCULATE_CIRCLE_AREA_FROM_RADIUS(0.5f);
}
{{< /highlight>}}
{{< /codeblock>}}
It should be noted that you should always stick to using a function where applicable, unless you have a *very* good reason to use macros. Macros are *not* intended to be an alternative for functions. Macro usage should be strictly reserved for specific actions which normal functions are incapable of, like what `JOIN` does for instance.

## 2.3 Multi-line macro

While it might not exactly be a type of macro by itself, I think it's important to mention anyways. Macros are not restricted to only be one-liners. 

In C, you might have seen something like this:
{{< codeblock name= "C multi-line macro" >}}
{{< highlight c >}}
#define foo(...)    \
  do {              \
    // stmt 1...    \
    // stmt 2...    \
  } while (0)
{{< /highlight>}}
{{< /codeblock>}}
The `do {...} while (0)` is a well known trick used for bundling statements together. By using the do-while trick, we can invoke the multi-line macro and terminate it with a `;` as we would with any other function. 

While it's true that we could also just not include a `;` at the end of the last statement, the problem with this is that it introduces another point of maintenance, if another statement were to be added you would have to be mindful of it. Additionally, when you expand the macro, you can also clearly see the statements which belongs in the macro block.

Notice that at the end of each line the backslash character `\` is needed. By using the backslash character before the newline, the newline is skipped, allowing the macro to continue consuming the next line. This is required due to how macros are scanned, it seems to follow the following syntax: `<#define> <body> <newline>`. While it might not seem like a big deal, this is actually a very big flaw. If there is any other character after the newline, perhaps a space, your macro would be broken, without you being able to tell why.

