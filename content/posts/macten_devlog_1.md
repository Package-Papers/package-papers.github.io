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
## 2.1 C
Let's start with the most basic example of a macro system in a langauge, of course it's from our beloved `C`.
### 2.1.1 Parameterless
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

### 2.1.2 Macro with args
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

### 2.1.3 Multi-line macro

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

Notice that at the end of each line the backslash character `\` is needed. By using the backslash character before the newline, the newline is skipped, allowing the macro to continue consuming the next line. This is required due to how macros are parsed, it seems to follow the following syntax: `<#define> <*> <newline>`. While it might not seem like a big deal, this is actually a very big flaw. If there is any other character after the newline, perhaps a space, your macro would be broken, without you being able to tell why.

## 2.2 Rust
Now we're going to move onto something more modern. Rust also offers a macro system in the form of `macro_rules!`. Here are the previous examples rewritten in `rust`.
{{< codeblock name= "C multi-line macro" >}}
{{< highlight rust >}}
// Parameterless.
macro_rules! PI {
    () => {
        3.14159
    }
}

// With arguments.
macro_rules! CALCULATE_CIRCLE_AREA_FROM_RADIUS {
  ($radius: expr) => {
    ($radius * $radius * PI![])
  }
}

// Usage.
fn main () {
  // Notice that `println` is also a macro.
  // We can either use `()`/`[]` for macro args.
  println!("{}", CALCULATE_CIRCLE_AREA_FROM_RADIUS![5.0]);
}
{{< /highlight>}}
{{< /codeblock>}}
As you can probably tell it is a little more advanced than the simple `#define`. Notice that the invocation of a macro is clearly distinct from an invocation of a function thanks to the postfix `!`. It mgiht be a small detail but it is important nonetheless.

One additional thing you might notice is the `expr` annotation after the argument. In `Rust`, this is called a `designator`. You can think of them as type annotation for the argument. I won't discuss them here for the sake of brevity, but you can check them out [here](https://doc.rust-lang.org/rust-by-example/macros/designators.html#:~:text=expr%20is%20used%20for%20expressions,is%20used%20for%20literal%20constants).






