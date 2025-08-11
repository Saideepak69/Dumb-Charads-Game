"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Palette,
  Eraser,
  Download,
  Upload,
  RotateCcw,
  Home,
  Minus,
  Plus,
  Square,
  Circle,
  Edit3,
  PenTool,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
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

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#C0C0C0",
  "#800000",
  "#008000",
]

type Tool = "pen" | "pencil" | "marker" | "eraser" | "rectangle" | "circle" | "line"

export default function Playground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [currentTool, setCurrentTool] = useState<Tool>("pen")
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [hasDrawn, setHasDrawn] = useState(false)

  // Initialize canvas on mount
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Set white background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // Set default drawing properties
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
      }
    }
  }, [])

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

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      setIsDrawing(true)
      setHasDrawn(true)

      const { x, y } = getCanvasCoordinates(e)
      setStartPos({ x, y })

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.beginPath()
        ctx.moveTo(x, y)

        // Set properties based on current tool
        if (currentTool === "pen") {
          ctx.globalCompositeOperation = "source-over"
          ctx.strokeStyle = currentColor
          ctx.lineWidth = brushSize
          ctx.globalAlpha = 1.0
        } else if (currentTool === "pencil") {
          ctx.globalCompositeOperation = "source-over"
          ctx.strokeStyle = currentColor
          ctx.lineWidth = Math.max(1, brushSize - 1)
          ctx.globalAlpha = 0.7
        } else if (currentTool === "marker") {
          ctx.globalCompositeOperation = "source-over"
          ctx.strokeStyle = currentColor
          ctx.lineWidth = brushSize + 2
          ctx.globalAlpha = 0.6
        } else if (currentTool === "eraser") {
          ctx.globalCompositeOperation = "destination-out"
          ctx.lineWidth = brushSize * 2
          ctx.globalAlpha = 1.0
        }

        ctx.lineCap = "round"
        ctx.lineJoin = "round"
      }
    },
    [currentTool, currentColor, brushSize],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      e.preventDefault()

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const { x, y } = getCanvasCoordinates(e)

      // For drawing tools, continue the line
      if (["pen", "pencil", "marker", "eraser"].includes(currentTool)) {
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    },
    [isDrawing, currentTool],
  )

  const stopDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      e.preventDefault()
      setIsDrawing(false)

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const { x, y } = getCanvasCoordinates(e)

      // Reset properties for shape drawing
      ctx.globalAlpha = 1.0
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = currentColor
      ctx.lineWidth = brushSize

      // Draw shapes
      if (currentTool === "rectangle") {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y)
      } else if (currentTool === "circle") {
        const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2))
        ctx.beginPath()
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (currentTool === "line") {
        ctx.beginPath()
        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    },
    [isDrawing, currentColor, brushSize, currentTool, startPos],
  )

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Set white background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    setHasDrawn(false)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement("a")
      link.download = "drawing.png"
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = "#FFFFFF"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            setHasDrawn(true)
          }
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {hasDrawn ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Home className="w-4 h-4 mr-1" />
                    Back to Game
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Leave Playground?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You have unsaved work in the playground. Leaving will discard your current drawing. Are you sure
                      you want to go back to the game?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stay in Playground</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Link href="/">Go Back to Game</Link>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-1" />
                  Back to Game
                </Button>
              </Link>
            )}
            <h1 className="text-3xl font-bold text-purple-800">Drawing Playground</h1>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            <Palette className="w-4 h-4 mr-1" />
            Free Draw Mode
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tools Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drawing Tools */}
              <div>
                <h3 className="font-medium mb-3">Drawing Tools</h3>
                <div className="space-y-2">
                  <Button
                    variant={currentTool === "pen" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTool("pen")}
                    className="w-full justify-start"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Pen
                  </Button>
                  <Button
                    variant={currentTool === "pencil" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTool("pencil")}
                    className="w-full justify-start"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Pencil
                  </Button>
                  <Button
                    variant={currentTool === "marker" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTool("marker")}
                    className="w-full justify-start"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Marker
                  </Button>
                  <Button
                    variant={currentTool === "eraser" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTool("eraser")}
                    className="w-full justify-start"
                  >
                    <Eraser className="w-4 h-4 mr-2" />
                    Eraser
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Shape Tools */}
              <div>
                <h3 className="font-medium mb-3">Shape Tools</h3>
                <div className="space-y-2">
                  <Button
                    variant={currentTool === "rectangle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTool("rectangle")}
                    className="w-full justify-start"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Rectangle
                  </Button>
                  <Button
                    variant={currentTool === "circle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTool("circle")}
                    className="w-full justify-start"
                  >
                    <Circle className="w-4 h-4 mr-2" />
                    Circle
                  </Button>
                  <Button
                    variant={currentTool === "line" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTool("line")}
                    className="w-full justify-start"
                  >
                    ➖ Line
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Brush Size */}
              <div>
                <h3 className="font-medium mb-3">{currentTool === "eraser" ? "Eraser" : "Brush"} Size</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Button variant="outline" size="sm" onClick={() => setBrushSize(Math.max(1, brushSize - 1))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-medium w-8 text-center">{brushSize}</span>
                  <Button variant="outline" size="sm" onClick={() => setBrushSize(Math.min(50, brushSize + 1))}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Colors */}
              <div>
                <h3 className="font-medium mb-3">Colors</h3>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 ${
                        currentColor === color ? "border-gray-800 ring-2 ring-purple-300" : "border-gray-300"
                      } ${currentTool === "eraser" ? "opacity-50 cursor-not-allowed" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentColor(color)}
                      disabled={currentTool === "eraser"}
                    />
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-full h-8 rounded border border-gray-300"
                    disabled={currentTool === "eraser"}
                  />
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                {hasDrawn ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full bg-transparent">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Clear Canvas
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          Clear Canvas?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your current drawing. This action cannot be undone. Are you sure
                          you want to clear the canvas?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Drawing</AlertDialogCancel>
                        <AlertDialogAction onClick={clearCanvas}>Clear Canvas</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button onClick={clearCanvas} variant="outline" className="w-full bg-transparent">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear Canvas
                  </Button>
                )}
                <Button onClick={downloadImage} variant="outline" className="w-full bg-transparent">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <div>
                  <input type="file" accept="image/*" onChange={uploadImage} className="hidden" id="upload-image" />
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <label htmlFor="upload-image" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </label>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Canvas</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Tool: {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}</Badge>
                  <Badge variant="outline">Size: {brushSize}px</Badge>
                  {currentTool !== "eraser" && (
                    <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: currentColor }} />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
                <canvas
                  ref={canvasRef}
                  width={1000}
                  height={600}
                  className="w-full cursor-crosshair block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{
                    touchAction: "none",
                    userSelect: "none",
                    imageRendering: "pixelated",
                  }}
                />
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>
                  Use your mouse to draw on the canvas. Select different tools and colors from the panel on the left.
                </p>
                <p className="mt-1">
                  <strong>Current tool:</strong> {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
                  {currentTool !== "eraser" && ` • Color: ${currentColor}`} • Size: {brushSize}px
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
