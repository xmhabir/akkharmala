import { v2 as cloudinary } from 'cloudinary';

export async function POST(request) {
    try {
        const body = await request.json();
        const { paramsToSign } = body;

        if (!paramsToSign) {
            return Response.json(
                {
                    error: 'paramsToSign is required',
                },
                { status: 400 }
            );
        }

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET
        );

        return Response.json({
            signature,
            apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        });
    } catch (error) {
        console.error('Cloudinary signature error:', error);

        return Response.json(
            {
                error: 'Failed to generate Cloudinary signature',
            },
            { status: 500 }
        );
    }
}