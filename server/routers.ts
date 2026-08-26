import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createRelationProposal, listPendingRelationProposals, listRelationProposalsBySubmitter, reviewRelationProposal } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

export const relationProposalInput = z.object({
  sourceActor: z.string().trim().min(2).max(120),
  targetActor: z.string().trim().min(2).max(120),
  relationType: z.string().trim().min(3).max(64),
  title: z.string().trim().min(4).max(255),
  detail: z.string().trim().min(20).max(5000),
  sourceUrl: z.string().url().max(1000),
  startYear: z.number().int().min(1800).max(2100).optional(),
  endYear: z.number().int().min(1800).max(2100).optional(),
}).refine((proposal) => proposal.endYear === undefined || proposal.startYear === undefined || proposal.endYear >= proposal.startYear, { message: "La fin doit être postérieure au début.", path: ["endYear"] });

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  relationProposals: router({
    mine: protectedProcedure.query(({ ctx }) => listRelationProposalsBySubmitter(ctx.user.id)),
    submit: protectedProcedure.input(relationProposalInput).mutation(async ({ ctx, input }) => {
      await createRelationProposal({ ...input, submitterId: ctx.user.id });
      return { success: true } as const;
    }),
    pending: adminProcedure.query(() => listPendingRelationProposals()),
    review: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reviewNote: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      await reviewRelationProposal(input.id, ctx.user.id, input.status, input.reviewNote);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
