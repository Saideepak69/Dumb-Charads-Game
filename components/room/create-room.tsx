"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Copy, Users, Crown, ArrowLeft, Share2, Clock, Globe, Lock } from 'lucide-react'
import { db } from "@/lib/database"
import { type User } from "@/lib/supabase"

interface CreateRoomProps {
  user: User
  onBack: () => void
  onRoomCreated: (room: any) => void
}

export function CreateRoom({ user, onBack, onRoomCreated }: CreateRoomProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [room, setRoom] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const handleCreateRoom = async () => {
    setIsCreating(true)
    setError("")

    try {
      const { room: newRoom } = await db.createRoom(user.id, user.username, isPublic)
      setRoom(newRoom)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room")
    } finally {
      setIsCreating(false)
    }
  }

  const copyRoomCode = async () => {
    if (room?.code) {
      await navigator.clipboard.writeText(room.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareRoom = async () => {
    if (room?.code) {
      const shareData = {
        title: "Join my Dumb Charades Game!",
        text: `Join my drawing game room with code: ${room.code}`,
        url: window.location.origin,
      }

      if (navigator.share) {
        try {
          await navigator.share(shareData)
        } catch (err) {
          copyRoomCode()
        }
      } else {
        copyRoomCode()
      }
    }
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl font-bold text-purple-800">Create Room</CardTitle>
              <div className="w-10" />
            </div>
            <p className="text-gray-600">Create a room for others to join</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Room Visibility */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Room Visibility</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={isPublic ? "default" : "outline"}
                  onClick={() => setIsPublic(true)}
                  className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <Globe className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Public</div>
                    <div className="text-xs opacity-80">Others can quick join</div>
                  </div>
                </Button>
                <Button
                  variant={!isPublic ? "default" : "outline"}
                  onClick={() => setIsPublic(false)}
                  className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105"
                >
                  <Lock className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">Private</div>
                    <div className="text-xs opacity-80">Code only</div>
                  </div>
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {isPublic
                  ? "Public rooms can be found by players using Quick Join"
                  : "Private rooms can only be joined with the room code"}
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="p-6 bg-purple-50 rounded-lg">
                <Crown className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-purple-800 mb-2">You'll be the Host</h3>
                <p className="text-sm text-purple-600">
                  As the host, you can start the game when everyone joins and manage the room settings.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <div className="font-medium text-blue-800">Up to 8 Players</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <Share2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <div className="font-medium text-green-800">Share Code</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <div className="font-medium text-orange-800">10 Min Games</div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateRoom}
              className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 hover:scale-105"
              disabled={isCreating}
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Room...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onBack} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-purple-800">Room Created!</CardTitle>
            <div className="w-10" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">
              <Crown className="w-4 h-4 mr-1" />
              Host
            </Badge>
            <Badge variant={room.is_public ? "default" : "outline"}>
              {room.is_public ? (
                <>
                  <Globe className="w-4 h-4 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Share this code with others:</p>
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-3xl font-bold text-purple-800 tracking-wider mb-3">{room.code}</div>
              <div className="flex gap-2">
                <Button
                  onClick={copyRoomCode}
                  variant="outline"
                  size="sm"
                  className="flex-1 transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
                <Button
                  onClick={shareRoom}
                  variant="outline"
                  size="sm"
                  className="flex-1 transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Room Visibility Info */}
          {room.is_public && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Public Room</span>
              </div>
              <p className="text-green-700 text-sm">Others can find and join this room using Quick Join</p>
            </div>
          )}

          {/* Game Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Real-time Multiplayer</span>
            </div>
            <p className="text-blue-700 text-sm">Synchronized drawing and guessing with live updates</p>
          </div>

          {/* Start Game Button */}
          <div className="space-y-3">
            <Button
              onClick={() => onRoomCreated(room)}
              className="w-full bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105"
              size="lg"
            >
              Go to Lobby
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
