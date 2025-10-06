import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the Clerk JWT token
    const { getToken } = await auth();
    const token = await getToken({ template: "bard-backend" });
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get backend URL from environment
    const API_BASE_URL = process.env.NEXT_PUBLIC_BARD_BACKEND_API_BASE_URL || "http://localhost:8000";
    
    // Create the backend authorization URL
    const backendAuthUrl = `${API_BASE_URL}/auth/google/authorize?token=${encodeURIComponent(token)}`;
    
    // Redirect to the backend auth endpoint
    return NextResponse.redirect(backendAuthUrl);
    
  } catch (error) {
    console.error("Error starting Google auth:", error);
    return NextResponse.json(
      { error: "Failed to start Google authentication" },
      { status: 500 }
    );
  }
}