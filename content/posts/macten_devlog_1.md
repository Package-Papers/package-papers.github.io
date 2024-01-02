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
#define PI 3.14159
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
{{< /highlight>}}
{{< /codeblock>}}
