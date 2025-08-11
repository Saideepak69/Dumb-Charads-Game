"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Trophy, Gamepad2Icon as GameController2, Calendar, Palette, Users, LogIn } from "lucide-react"

interface User {
  id: string
  email: string
  username: string
  avatar?: string
  gamesPlayed: number
  totalScore: number
  createdAt: string
}

interface UserProfileProps {
  user: User
  onLogout: () => void
  onStartGame: () => void
  onCreateRoom: () => void
  onJoinRoom: () => void
}

export function UserProfile({ user, onLogout, onStartGame, onCreateRoom, onJoinRoom }: UserProfileProps) {
  const averageScore = user.gamesPlayed > 0 ? Math.round(user.totalScore / user.gamesPlayed) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-purple-200 text-purple-800">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold text-purple-800">Welcome, {user.username}!</CardTitle>
          <p className="text-gray-600">{user.email}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <GameController2 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-800">{user.gamesPlayed}</div>
              <div className="text-sm text-blue-600">Games Played</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-800">{user.totalScore}</div>
              <div className="text-sm text-green-600">Total Score</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Average Score</span>
              <Badge variant="secondary">{averageScore} pts</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member Since
              </span>
              <Badge variant="outline">{user.createdAt}</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onCreateRoom}
                className="bg-purple-600 hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                size="lg"
              >
                <Users className="mr-2 h-4 w-4" />
                Create Room
              </Button>
              <Button
                onClick={onJoinRoom}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:scale-105"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Join Room
              </Button>
            </div>
            <Button
              onClick={onStartGame}
              variant="secondary"
              className="w-full bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:scale-105"
            >
              🎮 Play as Guest
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => window.open("/playground", "_blank")}>
              <Palette className="mr-2 h-4 w-4" />
              Open Playground
            </Button>
            <Button onClick={onLogout} variant="outline" className="w-full bg-transparent">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
