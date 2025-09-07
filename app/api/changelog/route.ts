export async function GET() {
  try {
    return Response.json({
      changelog: [],
      version: '1.0.0'
    });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}