export async function GET() {
  try {
    return Response.json({
      pendingLocationChanges: []
    });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}