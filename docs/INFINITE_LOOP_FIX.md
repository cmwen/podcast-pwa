# Infinite Loop Bug Fix

## Problem
The audio player was stuck in an infinite loop with these repeating console messages:
- `[Player] Loading episode: ...`
- `[Player] Episode loaded, ready to play`
- `[Player] Play state changed to: false`
- `[Player] Audio paused`

This pattern repeated endlessly, preventing audio playback.

## Root Causes

### 1. **useEffect Dependency Issues**
The useEffect hooks were triggering each other in a cycle:
- Loading effect triggered by whole `state.currentEpisode` object
- Play/pause effect triggered by both `state.isPlaying` AND `state.currentEpisode`
- This caused unnecessary re-renders and state resets

### 2. **Automatic State Reset on Audio Errors**
When `audio.play()` failed (due to CORS), the code automatically reset `isPlaying: false`, which triggered the useEffect again, creating an infinite loop.

### 3. **Real Podcast URL CORS Issues**
The URL `https://traffic.megaphone.fm/SCIM6622063277.mp3` is a real podcast URL that's blocked by CORS policy, causing repeated failures.

## Fixes Applied

### 1. **Fixed useEffect Dependencies**
```typescript
// Before - triggers on any episode object change
useEffect(() => {
  // ... episode loading logic
}, [state.currentEpisode])

// After - only triggers when episode ID changes
useEffect(() => {
  // ... episode loading logic  
}, [state.currentEpisode?.id])
```

```typescript
// Before - triggers on both isPlaying AND currentEpisode changes
useEffect(() => {
  // ... play/pause logic
}, [state.isPlaying, state.currentEpisode])

// After - only triggers on isPlaying changes
useEffect(() => {
  // ... play/pause logic
}, [state.isPlaying])
```

### 2. **Removed Automatic State Reset**
```typescript
// Before - caused infinite loops
.catch((error) => {
  console.error('[Player] Failed to start audio:', error)
  appState.value = { ...appState.value, isPlaying: false } // ❌ Triggers loop
})

// After - just logs error
.catch((error) => {
  console.error('[Player] Failed to start audio:', error)
  // Don't automatically reset state to prevent infinite loop
})
```

### 3. **Added Audio Ready State Check**
```typescript
if (state.isPlaying) {
  // Check if audio is ready before trying to play
  if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    audio.play().then(/* ... */).catch(/* ... */)
  } else {
    console.log('[Player] Audio not ready yet, waiting...')
    // Don't reset state, just wait for audio to be ready
  }
}
```

### 4. **Improved Source Loading**
```typescript
// Only update src if it's different to avoid unnecessary reloads
if (audio.src !== state.currentEpisode.audioUrl) {
  audio.src = state.currentEpisode.audioUrl
  audio.load()
}
```

### 5. **Added CORS Detection and Warning**
```typescript
// Detect real podcast URLs that will have CORS issues
if (state.currentEpisode.audioUrl.includes('megaphone.fm') || 
    state.currentEpisode.audioUrl.includes('libsyn.com') ||
    (!state.currentEpisode.audioUrl.startsWith('test://') && 
     !state.currentEpisode.audioUrl.includes('learningcontainer.com'))) {
  alert('This appears to be a real podcast URL which may not work due to CORS restrictions. Try using test://huberman or test://rogan for demo purposes.')
}
```

### 6. **Added Recovery Tools**
- **Debug Audio Button**: Inspect audio element state
- **Reset Player Button**: Clear player state to recover from errors

## Testing Instructions

### 1. **Use Mock Feeds (Recommended)**
```
test://huberman
test://rogan
```
These feeds use CORS-friendly audio URLs that will actually play.

### 2. **If Using Real Feeds**
- Expect CORS errors with real podcast URLs
- Use the "Reset Player" button to recover from infinite loops
- Check console for CORS-related errors

### 3. **Debug Tools**
- Click "Debug Audio" to see audio element state
- Click "Reset Player" if the player gets stuck
- Check browser console for detailed logging

## Files Modified
- `src/components/views/PlayerView.tsx` - Fixed infinite loop and improved error handling

The player should now work properly with mock feeds and handle real podcast URL errors gracefully without infinite loops.
