/**
 * Merges imported artists with existing artists, handling duplicates based on email, legal name, or artist name
 * @param existingArtists - Array of existing artists
 * @param importedArtists - Array of artists to be imported
 * @returns Array of merged artists
 */
export function mergeArtists(existingArtists: any[], importedArtists: any[]): any[] {
  // Create a new array to store the merged artists
  const mergedArtists = [...existingArtists];
  
  // Merge importedArtists into existing artists
  importedArtists.forEach((importedArtist: any) => {
    // Check for matches based on email, legal name, or artist name
    const matchingIndex = mergedArtists.findIndex((existing: any) => {
      return (
        (importedArtist.email && existing.email && importedArtist.email.toLowerCase() === existing.email.toLowerCase()) ||
        (importedArtist.legalName && existing.legalName && importedArtist.legalName.toLowerCase() === existing.legalName.toLowerCase()) ||
        (importedArtist.artistName && existing.artistName && importedArtist.artistName.toLowerCase() === existing.artistName.toLowerCase())
      );
    });
    
    if (matchingIndex !== -1) {
      // Remove empty strings, null, or undefined fields from importedArtist
      const cleanedImportedArtist = Object.fromEntries(
        Object.entries(importedArtist).filter(([key, value]) => 
          value !== null && value !== undefined && value !== ""
        )
      );
      
      // Merge the objects, prioritizing existing data
      mergedArtists[matchingIndex] = {
        ...mergedArtists[matchingIndex],
        ...cleanedImportedArtist,
        ...mergedArtists[matchingIndex], // Existing data takes precedence
      };
    } else {
      // No match found, add as new artist
      mergedArtists.push(importedArtist);
    }
  });
  
  return mergedArtists;
} 