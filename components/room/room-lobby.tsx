"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Crown, Copy, Share2, LogOut, Play, Clock, Globe, Lock } from 'lucide-react'
import { type User, type Room, type RoomPlayer } from "@/lib/supabase"

interface RoomLobbyProps {
  user: User
  room: Room
  players: (RoomPlayer & { users: User })[]
  onLeaveRoom: () => void
  onStartGame: () => void
  isLoading: boolean
}

export function RoomLobby({ user, room, players, onLeaveRoom, onStartGame, isLoading }: RoomLobbyProps) {
  const [copied, setCopied] = useState(false)

  const isHost = room.host_id === user.id

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={onLeaveRoom} className="p-2 text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold text-purple-800">Room Lobby</CardTitle>
            <div className="flex items-center gap-2">
              {isHost && (
                <Badge variant="secondary">
                  <Crown className="w-4 h-4 mr-1" />
                  Host
                </Badge>
              )}
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Room Code:</p>
            <div className="bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-2xl font-bold text-purple-800 tracking-wider mb-2">{room.code}</div>
              <div className="flex gap-2">
                <Button
                  onClick={copyRoomCode}
                  variant="outline"
                  size="sm"
                  className="flex-1 transition-all duration-200 hover:scale-105 bg-transparent"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
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

          {/* Game Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Real-time Multiplayer</span>
            </div>
            <p className="text-blue-700 text-sm">Synchronized drawing and guessing with live updates</p>
          </div>

          {/* Players List */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players ({players.length}/{room.max_players})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-sm font-medium text-purple-800">
                      {player.users?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-medium">{player.users?.username}</span>
                      {player.user_id === user.id && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                  </div>
                  {player.user_id === room.host_id && (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Host
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Game Status */}
          {isHost ? (
            <div className="space-y-3">
              <Button
                onClick={onStartGame}
                className="w-full bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105"
                size="lg"
                disabled={players.length < 2 || isLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
              {players.length < 2 && (
                <Alert>
                  <AlertDescription className="text-center">
                    Need at least 2 players to start the game. Share the room code with others!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription className="text-center">
                Waiting for the host to start the game...
              </AlertDescription>
            </Alert>
          )}

          {/* Leave Room */}
          <div className="pt-4 border-t">
            <Button
              onClick={onLeaveRoom}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 bg-transparent"
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
