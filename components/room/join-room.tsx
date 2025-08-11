"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, ArrowLeft, Clock, Shuffle, Hash } from 'lucide-react'
import { db } from "@/lib/database"
import { type User } from "@/lib/supabase"

interface JoinRoomProps {
  user: User
  onBack: () => void
  onJoinSuccess: (room: any) => void
}

export function JoinRoom({ user, onBack, onJoinSuccess }: JoinRoomProps) {
  const [joinMethod, setJoinMethod] = useState<"code" | "random">("code")
  const [roomCode, setRoomCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return

    setIsJoining(true)
    setError("")

    try {
      const room = await db.joinRoomByCode(roomCode.trim(), user.id)
      onJoinSuccess(room)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room")
    } finally {
      setIsJoining(false)
    }
  }

  const handleQuickJoin = async () => {
    setIsJoining(true)
    setError("")

    try {
      const room = await db.joinRandomRoom(user.id)
      onJoinSuccess(room)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find available room")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-purple-800">Join Room</CardTitle>
            <div className="w-10" />
          </div>
          <p className="text-gray-600">Choose how you want to join a game</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Join Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={joinMethod === "code" ? "default" : "outline"}
              onClick={() => setJoinMethod("code")}
              className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <Hash className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">With Code</div>
                <div className="text-xs opacity-80">Enter room code</div>
              </div>
            </Button>
            <Button
              variant={joinMethod === "random" ? "default" : "outline"}
              onClick={() => setJoinMethod("random")}
              className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105"
            >
              <Shuffle className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Quick Join</div>
                <div className="text-xs opacity-80">Random room</div>
              </div>
            </Button>
          </div>

          {/* Join with Code */}
          {joinMethod === "code" && (
            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  type="text"
                  placeholder="Enter 6-character code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider bg-white/80 backdrop-blur-sm"
                  required
                />
                <p className="text-xs text-gray-500 text-center">Ask someone for their room code</p>
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                disabled={isJoining || roomCode.length !== 6}
                size="lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining Room...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </form>
          )}

          {/* Quick Join */}
          {joinMethod === "random" && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shuffle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Quick Join</span>
                </div>
                <p className="text-green-700 text-sm mb-3">
                  We'll automatically find an available room that's about to start and add you to it.
                </p>
                <ul className="text-xs text-green-600 space-y-1">
                  <li>• Joins rooms with other players waiting</li>
                  <li>• No code needed</li>
                  <li>• Instant matchmaking</li>
                </ul>
              </div>

              <Button
                onClick={handleQuickJoin}
                className="w-full bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105"
                disabled={isJoining}
                size="lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Room...
                  </>
                ) : (
                  <>
                    <Shuffle className="mr-2 h-4 w-4" />
                    Quick Join
                  </>
                )}
              </Button>
            </div>
          )}

          {/* User Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Joining as:</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-sm font-medium text-purple-800">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{user.username}</span>
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-orange-800">Real-time Multiplayer</span>
            </div>
            <p className="text-orange-700 text-sm">Synchronized drawing and guessing with live updates</p>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {joinMethod === "code" ? "Don't have a room code?" : "Want to join a specific room?"}
            </p>
            <p className="text-xs text-gray-500">
              {joinMethod === "code"
                ? "Try Quick Join to find available rooms, or create your own room."
                : "Use 'With Code' option if you have a specific room code to join."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
