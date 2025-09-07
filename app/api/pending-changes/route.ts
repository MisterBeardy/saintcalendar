export async function GET() {
  try {
    return Response.json({
      pendingChanges: []
    });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}