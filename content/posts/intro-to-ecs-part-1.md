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

**Disclaimer**\
I want to clarify that I am **not** an expert in this field. The information I'm sharing is based solely from my personal understanding and research. This tutorial was created as a means for me to enhance my understanding of the topic, but still I hope you find it useful.
___

## 1. What is ECS?
An **Entity Component System** or **ECS** for short, is basically an architectural pattern used for representing objects. An **entity** in an ECS is represented by a collection of **components** (which is just plain simple data). Then from using the knowledge of which components each entities owns, **systems** will pick only the entities which satisfies its requirements to update. 

As you might've already been able to guess, an ECS is composed of 3 components, the following is what they are in simplest terms.
- **Entity** - An identifier
- **Component** - Simple plain data
- **System** - A function

## 2. Why use ECS?
There are numerous reasons why the Entity Component System (**ECS**) is favored over Object-Oriented Programming (**OOP**). Here are some noteworthy points:

- **Flexibility**: ECS offers a lot of flexibility.
- **Simplicity**: It can help us write much shorter, simpler code.
- **Extensibility**: It makes code easily extendable.
- **Dynamic Components**: It makes dynamically changing components trivial.
- **Performance**: Better performance is achieved through improved cache utilization.
- **Decoupling**: Behaviors are matched with a set of components which can be applied to any entity; it isn't tightly coupled to a class.

The is only just scratching the surface, I won't go into more details because people much more qualified than me have already done so in ways much better than I ever could.

Here are some notable reads if you wish to find out more:
  - [Why is ECS more performant than OOP](https://www.simplilearn.com/entity-component-system-introductory-guide-article#:~:text=Yes%2C%20because%20an%20ECS%27s%20behaviors,at%20any%20stage%20of%20development.)
  - [Ease of composing and testing](https://engineering.classdojo.com/2021/10/29/entity-component-systems-lead-to-great-code)
  - [ECS FAQ, Sander Mertens](https://github.com/SanderMertens/ecs-faq)

## 3. Structure & Objective
I will be covering how to implement a **bitset based** ECS. As we move forward with each part of the implementation, I'll do my best to break it down and explain the specific goal we're aiming to achieve. It's important that you have a solid grasp of each section before you continue.

## 4. Entity 
The code below displays how we should be able to create and delete entities. One thing to note is that we also want to be able to reuse deleted entities because we don't always want to create new entries unnecessarily, you will see this later.
{{< codeblock name="main.cpp">}}
{{< highlight cpp >}}
int main()
{
  auto entity = ecs::create_entity();   // Create a new entity. ID=0
  ecs::entity_valid(entity);            // True.
  
  auto entity_2 = ecs::create_entity(); // Create a new entity. ID=1
  ecs::entity_valid(entity_2);          // True.

  ecs::delete_entity(entity);           // Delete an existing entity.
  ecs::entity_valid(entity);            // False.

  auto entity_3 = ecs::create_entity(); // Reuse deleted entity ID. ID=0
  ecs::entity_valid(entity_3);          // True.
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

Now since each **identifier** has to be **unique**, we should have a function which can return a new unique ID we can use. In our case, this is trivial because we can simply just increment. Take note that we are also appending to the **valid_entities** vector.
{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
...

inline Entity next_entity_id = 0;
inline std::vector<bool> valid_entities{};

// Note that the index of the boolean value will be the entity's ID.
inline Entity create_entity()
{
  valid_entities.push_back(true);
  return next_entity_id++;
}

} // namespace ecs
{{< /highlight >}}
{{< /codeblock >}}

Now, we can easily determine if an entity is valid by checking whether the entry at the identifier's index is set to true or not.
{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
...

inline bool entity_valid(Entity entity)
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
inline void delete_entity(Entity entity)
{
  valid_entities[entity] = false;
}

} // namespace ecs
{{< /highlight >}}
{{< /codeblock >}}  

Okay but at this point you might already realize that this isn't too good because we're always going to be extending, so let's actually refactor our code a little bit to reuse entries which we have deleted.

{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
...
inline std::vector<bool> valid_entities{};
inline std::vector<Entity> reusable_entities{};      ///< Deleted entities go here

inline Entity create_entity()
{
  if (!reusable_entities.empty())                    ///< Check if any entity can be reused
  {
    auto entity_to_reuse = reusable_entities.back(); ///< Take the reusable entity ID
    valid_entities[entity_to_reuse] = true;          ///< Make the entity valid again
    reusable_entities.pop_back();                    ///< Remove it from the reusable queue
    return entity_to_reuse;                         
  }
  valid_entities.push_back(true);
  return next_entity_id;
}
...
inline void delete_entity(Entity entity)
{
  valid_entities[entity] = false;
  reusable_entities.push_back(entity);               ///< Queue the deleted entity for reuse
}

} // namespace ecs
{{< /highlight >}}
{{< /codeblock >}}  

People with a keen eye might realize that there is a huge problem that comes from validating our entity using only a boolean value. Consider the following scenario.

{{< codeblock name="Zombie entities">}}
{{< highlight cpp >}}
auto monster = ecs::create_entity();  // Create a new monster. ID=0
ecs::delete_entity(monster);          // Delete it and make it reusable.

auto new_hero = ecs::create_entity(); // Reuse deleted monster ID. ID=0

ecs::entity_valid(new_hero);          // True.
ecs::entity_valid(monster);           // True... wait what?
{{< /highlight >}}
{{< /codeblock >}}  

This problem arises because we lack enough information. Using just the entity ID as the index isn't sufficient – it can't tell the difference between `monster` and `new_hero`. To fix this, we need to tag additional details, like a version number. Since our entity identifier has 32 bits, we can set aside some of those bits for the version number, maybe the top 16 bits. The other 16 bits can still be used for the index. Now whenever we reuse an entity index we can simply just increment the entity version. This ensures that `create_entity()` will always return a unique entity ID.

{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
// Let's define our new types
using EntityVersion = uint16_t; ///< High order 16 bits of an entity ID
using EntityIndex   = uint16_t; ///< Low order 16 bits of an entity ID

inline EntityVersion get_entity_version(Entity entity)
{
  return entity >> 16;
}

inline EntityIndex get_entity_index(Entity entity)
{
  return static_cast<EntityIndex>(entity);
}

inline Entity construct_entity(EntityVersion entity_version, EntityIndex entity_index)
{
  return (entity_version << 16) | entity_index;
}

inline Entity increment_entity_version(Entity entity)
{
  EntityVersion new_version = get_entity_version(entity) + 1;
  EntityIndex entity_index = get_entity_index(entity);
  return construct_entity(new_version, entity_index);
}
{{< /highlight >}}
{{< /codeblock >}}  

Now we can replace wherever we used the `entity` as an index with the `get_entity_index(entity)`. We also have to create a new array to keep track of the current active version for each of the entities we have created.

{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
inline std::vector<EntityVersion> active_entity_version{};

inline Entity create_entity()
{
  if (!reusable_entities.empty())                    
  {
    Entity new_entity = increment_entity_version(reusable_entities.back()); 
    EntityVersion new_entity_version = get_entity_version(new_entity);
    EntityIndex new_entity_index = get_entity_index(new_entity);

    valid_entities[new_entity_index] = true;          
    active_entity_version[new_entity_index] = new_entity_version; ///< New version number

    reusable_entities.pop_back();                    
    return new_entity;                      
  }

  // ... (rest of the code)
  
  active_entity_version.push_back(0);                             ///< First version is 0
  return next_entity_id;
}

// Check for matching version
inline bool entity_valid(Entity entity)
{
  EntityIndex entity_index = get_entity_index(entity);
  return valid_entities[entity_index] 
      && active_entity_version[entity_index] == get_entity_version(entity);
}

{{< /highlight >}}
{{< /codeblock >}}  

And that's it. Now we are done with our `Entity`! Pretty simple right? 

Here is the whole file:

{{< codeblock name="entity.hpp">}}
{{< highlight cpp >}}
#pragma once
#ifndef ECS_ENTITY
#define ECS_ENTITY

#include <cstdint>
#include <vector>

namespace ecs
{
  /**
   *  Entity ID
   *  Types and functions regarding entity ID.
   */
  using Entity = uint32_t;
  using EntityVersion = uint16_t; ///< High order 16 bits of an entity ID
  using EntityIndex   = uint16_t; ///< Low order 16 bits of an entity ID

  inline EntityVersion get_entity_version(Entity entity)
  {
    return entity >> 16;
  }

  inline EntityIndex get_entity_index(Entity entity)
  {
    return static_cast<EntityIndex>(entity);
  }

  inline Entity construct_entity(EntityVersion entity_version, EntityIndex entity_index)
  {
    return (entity_version << 16) | entity_index;
  }

  inline Entity increment_entity_version(Entity entity)
  {
    EntityVersion new_version = get_entity_version(entity) + 1;
    EntityIndex entity_index = get_entity_index(entity);
    return construct_entity(new_version, entity_index);
  }

  /**
   *  Entity Management
   *  Creating, deleting and reusing entities.
   */
  inline Entity next_entity_id = 0;
  inline std::vector<bool> valid_entities{};
  inline std::vector<Entity> reusable_entities{};
  inline std::vector<EntityVersion> active_entity_version{};

  inline Entity create_entity()
  {
    // Reuse an entity if there is one available.
    if (!reusable_entities.empty())                    
    {
      Entity new_entity = increment_entity_version(reusable_entities.back()); 
      EntityVersion new_entity_version = get_entity_version(new_entity);
      EntityIndex new_entity_index = get_entity_index(new_entity);

      valid_entities[new_entity_index] = true;          
      active_entity_version[new_entity_index] = new_entity_version; ///< New version number

      reusable_entities.pop_back();                    
      return new_entity;                      
    }
    valid_entities.push_back(true);
    active_entity_version.push_back(0);
    return next_entity_id++;
  }

  inline bool entity_valid(Entity entity)
  {
    EntityIndex entity_index = get_entity_index(entity);
    return valid_entities[entity_index] 
        && active_entity_version[entity_index] == get_entity_version(entity);
  }

  inline void delete_entity(Entity entity)
  {
    valid_entities[get_entity_index(entity)] = false;
    reusable_entities.push_back(entity);
  }
}

#endif /* ECS_ENTITY */
{{< /highlight >}}
{{< /codeblock >}}  

## Remarks
You may have noticed that dedicating two separate vectors for managing entities (`valid_entities` and `active_entity_version`) seems somewhat wasteful. It's possible to refactor further and utilize only one vector. One approach to achieve this is to dedicate a single bit from the entity ID to represent the valid status of the entity. Another approach is to set either the index or version to a specific value, such as `0xFF`, to convey whether the entity is valid or not.
