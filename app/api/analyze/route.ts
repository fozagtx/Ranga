import { analyzeCase } from '../../../lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return Response.json(
        { error: 'Send multipart form data with image and location fields.' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const image = formData.get('image');
    const location = String(formData.get('location') || '').trim();

    if (!(image instanceof File)) {
      return Response.json({ error: 'Upload a PNG or JPEG trail-camera image.' }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const result = await analyzeCase({
      imageBuffer,
      mimeType: image.type,
      location,
    });

    return Response.json(result);
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? Number(error.statusCode) : 502;
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Analysis failed.',
      },
      { status: statusCode },
    );
  }
}
