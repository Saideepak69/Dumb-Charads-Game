"use client"

import { useEffect, useState, useCallback } from 'react'
import { db } from '@/lib/database'
import { supabase, type User, type Room, type RoomPlayer, type Guess } from '@/lib/supabase'

export function useMultiplayer(roomId: string | null, currentUser: User | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<(RoomPlayer & { users: User })[]>([])
  const [guesses, setGuesses] = useState<(Guess & { users: User })[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load room data
  const loadRoomData = useCallback(async () => {
    if (!roomId) return

    try {
      setIsLoading(true)
      const roomData = await db.getRoomWithPlayers(roomId)
      setRoom(roomData)
      setPlayers(roomData.players)

      const guessesData = await db.getGuesses(roomId)
      setGuesses(guessesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room data')
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // Submit guess
  const submitGuess = useCallback(async (guess: string) => {
    if (!roomId || !currentUser) return

    try {
      const result = await db.submitGuess(roomId, currentUser.id, guess)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit guess')
      return { isCorrect: false, points: 0 }
    }
  }, [roomId, currentUser])

  // Start game
  const startGame = useCallback(async () => {
    if (!roomId) return

    try {
      await db.startGame(roomId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
    }
  }, [roomId])

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!roomId || !currentUser) return

    try {
      await db.leaveRoom(roomId, currentUser.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave room')
    }
  }, [roomId, currentUser])

  // Save drawing stroke
  const saveDrawingStroke = useCallback(async (strokeData: any) => {
    if (!roomId || !currentUser) return

    try {
      await db.saveDrawingStroke(roomId, currentUser.id, strokeData)
    } catch (err) {
      console.error('Failed to save drawing stroke:', err)
    }
  }, [roomId, currentUser])

  // Clear drawing
  const clearDrawing = useCallback(async () => {
    if (!roomId) return

    try {
      await db.clearDrawing(roomId)
    } catch (err) {
      console.error('Failed to clear drawing:', err)
    }
  }, [roomId])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return

    loadRoomData()

    // Subscribe to room changes
    const roomSubscription = db.subscribeToRoom(roomId, (payload) => {
      console.log('Room update:', payload)
      loadRoomData()
    })

    // Subscribe to new guesses
    const guessSubscription = db.subscribeToGuesses(roomId, async (payload) => {
      console.log('New guess:', payload)
      if (payload.eventType === 'INSERT') {
        // Reload guesses to get user data
        const guessesData = await db.getGuesses(roomId)
        setGuesses(guessesData)
      }
    })

    // Subscribe to drawing updates
    const drawingSubscription = db.subscribeToDrawing(roomId, (payload) => {
      console.log('Drawing update:', payload)
      // Handle real-time drawing updates here
      if (payload.eventType === 'INSERT') {
        const strokeData = payload.new.stroke_data
        // Emit custom event for drawing component to handle
        window.dispatchEvent(new CustomEvent('drawingUpdate', { detail: strokeData }))
      }
    })

    return () => {
      roomSubscription.unsubscribe()
      guessSubscription.unsubscribe()
      drawingSubscription.unsubscribe()
    }
  }, [roomId, loadRoomData])

  return {
    room,
    players,
    guesses,
    isLoading,
    error,
    submitGuess,
    startGame,
    leaveRoom,
    saveDrawingStroke,
    clearDrawing,
    refreshData: loadRoomData
  }
}
