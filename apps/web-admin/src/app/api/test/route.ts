export async function GET() {
  return Response.json({ message: "API is working!", timestamp: new Date().toISOString() });
}

