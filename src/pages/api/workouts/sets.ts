import type { APIRoute } from "astro";
import { addWorkoutSet } from "@/lib/db/workouts";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { data, error } = await addWorkoutSet(body);
  
  if (error) return new Response(JSON.stringify({ error }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};
