export async function GET() {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL ? "SET" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
    NODE_ENV: process.env.NODE_ENV || "undefined"
  };

  return Response.json({
    ok: true,
    env,
    timestamp: new Date().toISOString(),
    message: "Environment variables status check"
  });
}
