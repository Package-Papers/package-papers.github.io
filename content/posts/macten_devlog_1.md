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

# 0. Background
My first exposure to macros came from using the `#define` directive in `C`. To be honest, initially, I found it unclear why such a feature would be useful. However, as time passed and I gained more experience, I began to love it more and more. It quickly became one of my favorite features, despite its very apparent flaws and limitations.

I was frustrated to find out that other languages like `Java` and `Python` lacked any macro features (though, of course, they have constructs that replicate macro behavior). I am fully aware that a language like `C` needs macros, but the same cannot be said for other languages, especially *dynamically* typed ones. I would never advocate the usage of macros over well-defined constructs that achieve the same behavior (though I will showcase them for demonstrative purposes).

More than anything, `Macten` serves as a learning project for me. Regardless of whether it ends up being necessary or not, I want to try to implement it and see it for myself. Also, I genuinely believe that a fixation on doing only necessary things will do nothing but harm your learning potential; it serves as a terrible stance for learning.

# 1. Primer