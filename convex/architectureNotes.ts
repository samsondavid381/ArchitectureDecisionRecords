// convex/architectureNotes.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("architectureNotes").collect();
  },
});

export const getByAdrId = query({
  args: { adrId: v.string() },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("architectureNotes")
      .filter((q) => q.eq(q.field("adrId"), args.adrId))
      .collect();
      
    return notes;
  },
});

export const getById = query({
  args: { id: v.id("architectureNotes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    codeReferences: v.array(
      v.object({
        id: v.string(),
        path: v.string(),
        snippet: v.optional(v.string()),
        description: v.string(),
      })
    ),
    adrId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Add createdAt here in the handler, not from the client
    const now = new Date().toISOString();
    
    return await ctx.db.insert("architectureNotes", {
      ...args,
      createdAt: now, // This is added server-side
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("architectureNotes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    codeReferences: v.optional(
      v.array(
        v.object({
          id: v.string(),
          path: v.string(),
          snippet: v.optional(v.string()),
          description: v.string(),
        })
      )
    ),
    adrId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    return await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("architectureNotes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const convertToADR = mutation({
  args: {
    id: v.id("architectureNotes"),
    adrId: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, adrId } = args;
    
    return await ctx.db.patch(id, {
      adrId,
    });
  },
});