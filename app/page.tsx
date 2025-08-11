"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Users, Clock, Trophy, Palette, AlertTriangle, Plus, LogIn } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CreateRoom } from "@/components/room/create-room"
import { JoinRoom } from "@/components/room/join-room"
import { RoomLobby } from "@/components/room/room-lobby"
import { authService } from "@/lib/auth-db"
import { useMultiplayer } from "@/hooks/useMultiplayer"
import type { User } from "@/lib/supabase"
import { hasSupabaseCredentials } from "@/lib/supabase"

const COLORS = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500"]

type AppView = "welcome" | "game"

export default function DrawingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [appView, setAppView] = useState<AppView>("welcome")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(3)
  const [guess, setGuess] = useState("")
  const [currentTool, setCurrentTool] = useState<"pen" | "pencil" | "eraser">("pen")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)
  const [roomView, setRoomView] = useState<"create" | "join" | "lobby" | null>(null)

  // Use multiplayer hook
  const {
    room,
    players,
    guesses,
    isLoading,
    error: multiplayerError,
    submitGuess: submitMultiplayerGuess,
    startGame: startMultiplayerGame,
    leaveRoom: leaveMultiplayerRoom,
    saveDrawingStroke,
    clearDrawing,
    refreshData,
  } = useMultiplayer(currentRoomId, currentUser)

  // Initialize user on mount
  useEffect(() => {
    const initUser = async () => {
      let user = authService.getCurrentUser()
      if (!user) {
        try {
          user = await authService.createAnonymousUser()
        } catch (error) {
          console.error("Failed to create user:", error)
        }
      }
      setCurrentUser(user)
    }
    initUser()
  }, [])

  // Listen for drawing updates
  useEffect(() => {
    const handleDrawingUpdate = (event: CustomEvent) => {
      const strokeData = event.detail
      // Apply drawing stroke to canvas
      applyDrawingStroke(strokeData)
    }

    window.addEventListener("drawingUpdate", handleDrawingUpdate as EventListener)
    return () => {
      window.removeEventListener("drawingUpdate", handleDrawingUpdate as EventListener)
    }
  }, [])

  const handleTransition = (newView: AppView) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setAppView(newView)
      setIsTransitioning(false)
    }, 150)
  }

  const submitGuess = async () => {
    if (!guess.trim()) return

    const result = await submitMultiplayerGuess(guess)
    setGuess("")

    if (result.isCorrect) {
      // Refresh user data to get updated score
      if (currentUser) {
        const updatedUser = await authService.refreshUser(currentUser.id)
        if (updatedUser) {
          setCurrentUser(updatedUser)
        }
      }
    }
  }

  const handleCreateRoom = () => {
    setRoomView("create")
  }

  const handleJoinRoom = () => {
    setRoomView("join")
  }

  const handleBackFromRoom = () => {
    setRoomView(null)
    setCurrentRoomId(null)
  }

  const handleRoomCreated = (room: any) => {
    setCurrentRoomId(room.id)
    setRoomView("lobby")
  }

  const handleJoinSuccess = (room: any) => {
    setCurrentRoomId(room.id)
    setRoomView("lobby")
  }

  const handleLeaveRoom = async () => {
    await leaveMultiplayerRoom()
    setCurrentRoomId(null)
    setRoomView(null)
  }

  const handleStartRoomGame = async () => {
    await startMultiplayerGame()
    handleTransition("game")
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Canvas drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const applyDrawingStroke = (strokeData: any) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    switch (strokeData.type) {
      case "clear":
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        break
      case "start":
        ctx.beginPath()
        ctx.moveTo(strokeData.x, strokeData.y)
        if (strokeData.tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out"
          ctx.lineWidth = strokeData.size * 2
        } else {
          ctx.globalCompositeOperation = "source-over"
          ctx.strokeStyle = strokeData.color
          ctx.lineWidth = strokeData.tool === "pencil" ? Math.max(1, strokeData.size - 1) : strokeData.size
          ctx.globalAlpha = strokeData.tool === "pencil" ? 0.7 : 1.0
        }
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        break
      case "draw":
        ctx.lineTo(strokeData.x, strokeData.y)
        ctx.stroke()
        break
    }
  }

  const startDrawing = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      const currentPlayer = players.find((p) => p.user_id === currentUser?.id)
      if (!currentPlayer?.is_drawing) return

      e.preventDefault()
      setIsDrawing(true)

      const { x, y } = getCanvasCoordinates(e)

      const strokeData = {
        type: "start" as const,
        x,
        y,
        color: currentColor,
        size: brushSize,
        tool: currentTool,
      }

      applyDrawingStroke(strokeData)
      await saveDrawingStroke(strokeData)
    },
    [players, currentUser, currentColor, brushSize, currentTool, saveDrawingStroke],
  )

  const draw = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      const currentPlayer = players.find((p) => p.user_id === currentUser?.id)
      if (!isDrawing || !currentPlayer?.is_drawing) return

      e.preventDefault()
      const { x, y } = getCanvasCoordinates(e)

      const strokeData = {
        type: "draw" as const,
        x,
        y,
      }

      applyDrawingStroke(strokeData)
      await saveDrawingStroke(strokeData)
    },
    [isDrawing, players, currentUser, saveDrawingStroke],
  )

  const stopDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(false)
  }, [])

  const clearCanvas = async () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    await clearDrawing()
    await saveDrawingStroke({ type: "clear" })
  }

  const handleLeaveGame = async () => {
    await handleLeaveRoom()
    handleTransition("welcome")
  }

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
      }
    }
  }, [appView])

  const currentPlayer = players.find((p) => p.user_id === currentUser?.id)
  const isCurrentPlayerDrawing = currentPlayer?.is_drawing || false

  // Room views
  if (roomView === "create" && currentUser) {
    return (
      <div
        className={`transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <CreateRoom user={currentUser} onBack={handleBackFromRoom} onRoomCreated={handleRoomCreated} />
      </div>
    )
  }

  if (roomView === "join" && currentUser) {
    return (
      <div
        className={`transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <JoinRoom user={currentUser} onBack={handleBackFromRoom} onJoinSuccess={handleJoinSuccess} />
      </div>
    )
  }

  if (roomView === "lobby" && currentUser && room) {
    return (
      <div
        className={`transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        <RoomLobby
          user={currentUser}
          room={room}
          players={players}
          onLeaveRoom={handleLeaveRoom}
          onStartGame={handleStartRoomGame}
          isLoading={isLoading}
        />
      </div>
    )
  }

  // Welcome page
  if (appView === "welcome") {
    return (
      <div
        className={`min-h-screen relative overflow-hidden transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        {/* Vibrant Background Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="text-[20rem] font-black text-transparent bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-blue-200/30 bg-clip-text transform -rotate-12 whitespace-nowrap animate-pulse">
            DUMB CHARADES
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="text-[15rem] font-black text-transparent bg-gradient-to-tl from-yellow-200/20 via-orange-200/20 to-red-200/20 bg-clip-text transform rotate-12 translate-x-32 translate-y-16 whitespace-nowrap animate-pulse">
            DRAWING GAME
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="relative z-20 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Palette className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-800">Dumb Charades</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1 bg-white/80 backdrop-blur-sm">
                Playing as: {currentUser?.username || "Loading..."}
              </Badge>
            </div>
          </div>
        </nav>

        {/* Development Notice */}
        {!hasSupabaseCredentials && (
          <div className="relative z-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                  <span className="font-medium text-yellow-800">Development Mode</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Running with mock data. Configure Supabase environment variables for full multiplayer functionality.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="relative z-10 bg-gradient-to-br from-purple-100/80 to-blue-100/80 backdrop-blur-sm min-h-screen flex items-center justify-center p-4 pt-0">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-6xl font-black text-purple-800 drop-shadow-lg">Welcome to Dumb Charades Game!</h1>
              <p className="text-xl text-purple-700 max-w-2xl mx-auto leading-relaxed">
                Draw, guess, and have fun with friends! Create or join a room to start playing with others in real-time.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                <Button
                  onClick={handleCreateRoom}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  disabled={!currentUser}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
                <Button
                  onClick={handleJoinRoom}
                  size="lg"
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white text-blue-700 px-6 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-blue-300"
                  disabled={!currentUser}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Join Room
                </Button>
              </div>

              <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Real-time Multiplayer</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Play with friends in real-time with synchronized drawing and guessing
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="text-3xl mb-3">🎨</div>
                  <h3 className="font-bold text-purple-800 mb-2">Draw</h3>
                  <p className="text-purple-600 text-sm">Express your creativity with real-time synchronized drawing</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="text-3xl mb-3">🤔</div>
                  <h3 className="font-bold text-purple-800 mb-2">Guess</h3>
                  <p className="text-purple-600 text-sm">Challenge your mind and compete with friends</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                  <div className="text-3xl mb-3">🏆</div>
                  <h3 className="font-bold text-purple-800 mb-2">Win</h3>
                  <p className="text-purple-600 text-sm">Earn points and climb the leaderboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (appView === "game" && room) {
    return (
      <div
        className={`min-h-screen relative overflow-hidden transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
      >
        {/* Vibrant Background Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="text-[20rem] font-black text-transparent bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-blue-200/30 bg-clip-text transform -rotate-12 whitespace-nowrap">
            DUMB CHARADES
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="text-[15rem] font-black text-transparent bg-gradient-to-tl from-yellow-200/20 via-orange-200/20 to-red-200/20 bg-clip-text transform rotate-12 translate-x-32 translate-y-16 whitespace-nowrap">
            DRAWING GAME
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <div className="text-[12rem] font-black text-transparent bg-gradient-to-r from-green-200/25 via-teal-200/25 to-cyan-200/25 bg-clip-text transform -rotate-6 -translate-x-40 -translate-y-20 whitespace-nowrap">
            GUESS & DRAW
          </div>
        </div>

        {/* Main Content with Background */}
        <div className="relative z-10 bg-gradient-to-br from-purple-100/80 to-blue-100/80 backdrop-blur-sm min-h-screen p-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <div className="text-center flex-1">
                <h1 className="text-4xl font-bold text-purple-800 mb-2 drop-shadow-lg">Drawing Guessing Game</h1>
                <div className="flex justify-center items-center gap-6 text-lg">
                  <Badge variant="secondary" className="px-3 py-1 bg-white/80 backdrop-blur-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(room.time_left)}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 bg-white/60 backdrop-blur-sm">
                    Round {room.round_number}
                  </Badge>
                  <Badge variant="default" className="px-3 py-1 bg-purple-600/90 backdrop-blur-sm">
                    <Users className="w-4 h-4 mr-1" />
                    {players.length} Players
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="secondary"
                      className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <Palette className="w-4 h-4 mr-1" />
                      Playground
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Leave Current Game?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You are currently in an active game. Opening the playground will take you away from the current
                        game. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Stay in Game</AlertDialogCancel>
                      <AlertDialogAction onClick={() => window.open("/playground", "_blank")}>
                        Open Playground
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <span className="text-purple-800 font-medium drop-shadow-sm">Playing as: {currentUser?.username}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/80 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                    >
                      Leave Game
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Leave Current Game?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You are currently in an active game. Leaving will remove you from the game and you'll lose your
                        current progress. Are you sure you want to leave?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Stay in Game</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLeaveGame}>Leave Game</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
              {/* Players Panel */}
              <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm shadow-xl border-0 transition-all duration-300 hover:shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {players.map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 backdrop-blur-sm transition-all duration-200 hover:bg-gray-100/80"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {player.users?.username}
                            {player.user_id === currentUser?.id && (
                              <Badge variant="secondary" className="text-xs">
                                You
                              </Badge>
                            )}
                            {player.is_drawing && <Palette className="w-4 h-4 text-purple-600" />}
                            {player.has_guessed && <span className="text-green-600">✓</span>}
                          </div>
                          <div className="text-sm text-gray-600">{player.score} pts</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Drawing Canvas */}
              <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm shadow-xl border-0 transition-all duration-300 hover:shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Drawing Canvas</span>
                    {isCurrentPlayerDrawing && (
                      <Badge variant="default" className="bg-purple-600 animate-pulse">
                        Your turn: "{room.current_word}"
                      </Badge>
                    )}
                    {!isCurrentPlayerDrawing && (
                      <Badge variant="secondary" className="bg-gray-200">
                        {players.find((p) => p.is_drawing)?.users?.username} is drawing
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Drawing Tools */}
                  {isCurrentPlayerDrawing && (
                    <div className="mb-4 space-y-3 animate-slide-down">
                      <div className="flex items-center gap-2 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                        <span className="text-sm font-medium">Tools:</span>
                        <Button
                          variant={currentTool === "pen" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentTool("pen")}
                          className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
                        >
                          <Palette className="w-3 h-3" />
                          Pen
                        </Button>
                        <Button
                          variant={currentTool === "pencil" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentTool("pencil")}
                          className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
                        >
                          ✏️ Pencil
                        </Button>
                        <Button
                          variant={currentTool === "eraser" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentTool("eraser")}
                          className="flex items-center gap-1 transition-all duration-200 hover:scale-105"
                        >
                          🧹 Eraser
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg">
                        <div className="flex gap-2">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              className={`w-8 h-8 rounded-full border-2 shadow-sm transition-all duration-200 hover:scale-110 ${
                                currentColor === color ? "border-gray-800 ring-2 ring-purple-300" : "border-gray-300"
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setCurrentColor(color)}
                              disabled={currentTool === "eraser"}
                            />
                          ))}
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Size:</span>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-20"
                          />
                          <span className="text-sm w-6">{brushSize}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearCanvas}
                          className="bg-white/80 transition-all duration-200 hover:scale-105"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Canvas */}
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={400}
                      className="w-full cursor-crosshair block"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      style={{
                        touchAction: "none",
                        userSelect: "none",
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Chat/Guesses Panel */}
              <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm shadow-xl border-0 transition-all duration-300 hover:shadow-2xl">
                <CardHeader>
                  <CardTitle>Guesses</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Guess Input */}
                  {!isCurrentPlayerDrawing && !currentPlayer?.has_guessed && room.is_active && (
                    <div className="mb-4 space-y-2 animate-slide-down">
                      <Input
                        placeholder="Enter your guess..."
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && submitGuess()}
                        className="bg-white/80 backdrop-blur-sm transition-all duration-200 focus:scale-105"
                      />
                      <Button
                        onClick={submitGuess}
                        className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200 hover:scale-105"
                        disabled={!guess.trim()}
                      >
                        Submit Guess
                      </Button>
                    </div>
                  )}

                  {/* Guesses List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {guesses.map((g, index) => (
                      <div
                        key={g.id}
                        className={`p-2 rounded text-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 ${g.is_correct ? "bg-green-100/80 text-green-800" : "bg-gray-100/80"}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="font-medium">{g.users?.username}:</span> {g.guess}
                        {g.is_correct && <span className="ml-2">✓ Correct!</span>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
