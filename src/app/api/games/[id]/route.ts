import { NextResponse } from 'next/server';
import { getDocById, COLLECTIONS } from '@/lib/firebase-admin';

/**
 * GET handler for /api/games/[id]
 * Fetches a single game deal by ID from Firestore
 */
export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: 'Game ID is required' }, 
      { status: 400 }
    );
  }
  
  try {
    // Fetch the game from Firestore
    const game = await getDocById(COLLECTIONS.GAME_DEALS, id);
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' }, 
        { status: 404 }
      );
    }
    
    // Return the game data
    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game data' }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for /api/games/[id]
 * Deletes a game deal by ID from Firestore
 * This would typically include authentication checks
 */
export async function DELETE(
  request: Request, 
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // In a real application, you would check authentication here
  // if (!isAuthenticated(request)) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  
  try {
    // Import deleteDocument function only when needed
    const { deleteDocument } = await import('@/lib/firebase-admin');
    
    // Delete the game from Firestore
    const success = await deleteDocument(COLLECTIONS.GAME_DEALS, id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete game' }, 
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Game deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' }, 
      { status: 500 }
    );
  }
}

// Make this route dynamic
export const dynamic = 'force-dynamic'; 