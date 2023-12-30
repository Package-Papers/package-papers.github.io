---
title: "Macten Devlog 1"
date: 2023-12-30T23:15:55+07:00
authors:
  - Ochawin Apichattakul
draft: true
tags:
 - devlog
---

`Macten` is the short from of `macro extensions`. As the name suggests, Macten is about macros. To be more specific, the goal of the project is to be able to provide a build step involving macros to any text based programming language. 

# 1. Background
I am an avid enjoyer of writing C/C++. Without a doubt, I'm well acquainted with using (and occasionally overusing) pre-processor directive macros. It might be a bit controversial to admit, but I thoroughly enjoy crafting macros. In C/C++, you can define a single type of macro, known as the `declarative macro` using the `#define` pre-processor directive. Essentially, a declarative macro is just basic string substitution, yet its apparent simplicity shouldn't deceive you. Despite its straightforward nature, it undeniably stands as one of the most powerful features of the language.