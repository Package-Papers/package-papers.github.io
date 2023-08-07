---
title: "Simple Entity Component System - Part 1"
date: 2023-08-07T14:35:50+07:00
authors:
  - Ochawin Apichattakul
tags:
  - Game Dev
  - ECS
  - WIP
---

## 1. What is an ECS
&nbsp;&nbsp;&nbsp;&nbsp;An **entity component system** or **ECS** for short, is basically an architectural pattern used for representing objects. An **entity** in an ECS is represented by a collection of **components** (which is just plain simple data). Then from using the knowledge of which components each entities owns, **systems** will pick only the entities which satisfies its requirements to update. 

As you might've already been able to guess, an ECS is composed of 3 components, the following is what they are in simplest terms.
- **Entity** - An identifier
- **Component** - Simple plain data
- **System** - A function

## 2. Structure & Objective
&nbsp;&nbsp;&nbsp;&nbsp;For each part of the implementation, I will try my best to break it down and clearly define the objective we are shooting for. Please make sure you understand each part completely before proceding. 

&nbsp;&nbsp;&nbsp;&nbsp;I will be showing the implementation in **C++**, but don't worry the pattern should apply to any other language. Now with that out of the way, let's begin!

## 3. Entity
Before we begin, here is what we are aiming to be able to do:
{{< codeblock name="main.cpp">}}
{{< highlight cpp >}}
int main()
{
  auto entity = ecs::create_entity(); // Create a new entity.
  ecs::entity_valid(entity);          // True.

  ecs::delete_entity(entity);         // Delete an existing entity.
  ecs::entity_valid(entity);          // False.
}
{{< /highlight >}}
{{< /codeblock >}}  

Recall that an entity is simply an **_identifier_**. Don't ever forget that. Let's define exactly that.
{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
#pragma once
#ifndef ECS_ENTITY
#define ECS_ENTITY

#include <cstdint>
#include <vector>

namespace ecs 
{

// We can simply use a number as the identifier.
using Entity = uint32_t;

} // namespace ecs

#endif /* ECS_ENTITY */ 
{{< /highlight >}}
{{< /codeblock >}}

Now since each **identifier** has to be **unique**, we should have a function which can return a new unique ID we can use. In our case, this is trivial because we can simply just increment. Take note that we are also appending the new entry into the **entities** vector.
{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
...

inline Entity next_entity_id = 0;
inline std::vector<bool> valid_entities{};

// Note that the index of the boolean value will be the entity's ID.
Entity create_entity()
{
  valid_entities.push_back(true);
  return next_entity_id++;
}

} // namespace ecs
{{< /highlight >}}
{{< /codeblock >}}

Now we can simply check if an entity is valid by checking whether the entry at the index of the identifier is true or not.
{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
...

bool entity_valid(Entity entity)
{
  return valid_entities[entity];
}

} // namespace ecs
{{< /highlight >}}
{{< /codeblock >}}  

and now we can simply delete entities by setting the bool value:
{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
...
void delete_entity(Entity entity)
{
  valid_entities[entity] = false;
}

} // namespace ecs
{{< /highlight >}}
{{< /codeblock >}}  


