'use client'

import { useState, useEffect } from 'react'

type SudokuGrid = (number | null)[][]

// API Response tipi
interface SudokuApiResponse {
  newboard: {
    grids: Array<{
      value: number[][]
      solution: number[][]
      difficulty: string
    }>
    results: number
    message: string
  }
}

// Başlangıç Sudoku bulmacası (bazı hücreler dolu)
const initialPuzzle: SudokuGrid = [
  [5, 3, null, null, 7, null, null, null, null],
  [6, null, null, 1, 9, 5, null, null, null],
  [null, 9, 8, null, null, null, null, 6, null],
  [8, null, null, null, 6, null, null, null, 3],
  [4, null, null, 8, null, 3, null, null, 1],
  [7, null, null, null, 2, null, null, null, 6],
  [null, 6, null, null, null, null, 2, 8, null],
  [null, null, null, 4, 1, 9, null, null, 5],
  [null, null, null, null, 8, null, null, 7, 9]
]

export default function SudokuGame() {
  const [grid, setGrid] = useState<SudokuGrid>(initialPuzzle)
  const [originalPuzzle, setOriginalPuzzle] = useState<SudokuGrid>(initialPuzzle)
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null)
  const [conflicts, setConflicts] = useState<Set<string>>(new Set())
  const [difficulty, setDifficulty] = useState<string>('Medium')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // API'den yeni bulmaca getir
  const fetchNewPuzzle = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('https://sudoku-api.vercel.app/api/dosuku')
      const data: SudokuApiResponse = await response.json()
      
      if (data.newboard && data.newboard.grids && data.newboard.grids.length > 0) {
        const puzzle = data.newboard.grids[0]
        
        // API'den gelen 0 değerlerini null'a çevir
        const convertedGrid: SudokuGrid = puzzle.value.map(row =>
          row.map(cell => cell === 0 ? null : cell)
        )
        
        setGrid(convertedGrid)
        setOriginalPuzzle(convertedGrid)
        setDifficulty(puzzle.difficulty)
        setSelectedCell(null)
      }
    } catch (error) {
      console.error('Yeni bulmaca getirilemedi:', error)
      // Hata durumunda varsayılan bulmacayı kullan
      setGrid(initialPuzzle)
      setOriginalPuzzle(initialPuzzle)
      setDifficulty('Medium')
    }
    setIsLoading(false)
  }

  // Çakışmaları kontrol et
  const checkConflicts = (newGrid: SudokuGrid) => {
    const newConflicts = new Set<string>()
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = newGrid[row][col]
        if (value === null) continue
        
        // Satır kontrolü
        for (let c = 0; c < 9; c++) {
          if (c !== col && newGrid[row][c] === value) {
            newConflicts.add(`${row}-${col}`)
            newConflicts.add(`${row}-${c}`)
          }
        }
        
        // Sütun kontrolü
        for (let r = 0; r < 9; r++) {
          if (r !== row && newGrid[r][col] === value) {
            newConflicts.add(`${row}-${col}`)
            newConflicts.add(`${r}-${col}`)
          }
        }
        
        // 3x3 kutu kontrolü
        const boxRow = Math.floor(row / 3) * 3
        const boxCol = Math.floor(col / 3) * 3
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            if ((r !== row || c !== col) && newGrid[r][c] === value) {
              newConflicts.add(`${row}-${col}`)
              newConflicts.add(`${r}-${c}`)
            }
          }
        }
      }
    }
    
    setConflicts(newConflicts)
  }

  useEffect(() => {
    checkConflicts(grid)
  }, [grid])

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({row, col})
  }

  const handleNumberInput = (number: number) => {
    if (!selectedCell) return
    
    const newGrid = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === selectedCell.row && colIndex === selectedCell.col) {
          return number
        }
        return cell
      })
    )
    
    setGrid(newGrid)
  }

  const clearCell = () => {
    if (!selectedCell) return
    
    const newGrid = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === selectedCell.row && colIndex === selectedCell.col) {
          return null
        }
        return cell
      })
    )
    
    setGrid(newGrid)
  }

  const resetGame = () => {
    setGrid(originalPuzzle)
    setSelectedCell(null)
  }

  const isCellFixed = (row: number, col: number) => {
    return originalPuzzle[row][col] !== null
  }

  return (
    <div className="min-h-screen bg-pink-50 p-2 sm:p-4" style={{background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%)'}}>
      <div className="max-w-sm mx-auto sm:max-w-lg">
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
            💕 Buse & Oğuzcan 💕
          </h1>
          <h2 className="text-lg sm:text-xl font-semibold text-purple-600">
            Sudoku Oyunu
          </h2>
        </div>
        
        {/* Zorluk seviyesi göstergesi */}
        <div className="text-center mb-4">
          <span className="inline-block bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full border border-purple-200">
            Zorluk: {difficulty} 💪
          </span>
        </div>
        
        {/* Sudoku Grid - Mobil için optimize edilmiş */}
        <div className="bg-white rounded-lg shadow-xl p-2 sm:p-4 mb-4 relative border-2 border-pink-200">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
              <div className="text-purple-600 font-semibold text-center">
                <div className="text-2xl mb-2">💖</div>
                <div>Yeni bulmaca hazırlıyorum...</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-9 gap-0.5 sm:gap-1 w-fit mx-auto">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                const isFixed = isCellFixed(rowIndex, colIndex)
                const hasConflict = conflicts.has(`${rowIndex}-${colIndex}`)
                const isInSameRow = selectedCell?.row === rowIndex
                const isInSameCol = selectedCell?.col === colIndex
                const isInSameBox = selectedCell && 
                  Math.floor(selectedCell.row / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selectedCell.col / 3) === Math.floor(colIndex / 3)
                
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={isLoading}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base font-semibold border border-gray-400 transition-all duration-200 active:scale-95
                      ${isSelected ? 'bg-pink-200 border-pink-500 border-2' : 'border-gray-400'}
                      ${isFixed ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-white text-purple-600'}
                      ${hasConflict ? 'bg-red-100 text-red-600 border-red-400' : ''}
                      ${(isInSameRow || isInSameCol || isInSameBox) && !isSelected ? 'bg-pink-50' : ''}
                      hover:bg-pink-100 focus:outline-none focus:ring-1 focus:ring-pink-500
                      ${(rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-2 border-b-purple-800' : ''}
                      ${(colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-2 border-r-purple-800' : ''}
                      ${rowIndex === 0 ? 'border-t-2 border-t-purple-800' : ''}
                      ${colIndex === 0 ? 'border-l-2 border-l-purple-800' : ''}
                      ${rowIndex === 8 ? 'border-b-2 border-b-purple-800' : ''}
                      ${colIndex === 8 ? 'border-r-2 border-r-purple-800' : ''}
                      ${isLoading ? 'opacity-50' : ''}
                    `}
                  >
                    {cell || ''}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Number Input Buttons - Mobil için optimize edilmiş */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 mb-4 border-2 border-pink-200">
          <h3 className="text-sm sm:text-base font-semibold mb-3 text-center text-purple-700">
            Sayı seç aşkitomm
          </h3>
          <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <button
                key={number}
                onClick={() => handleNumberInput(number)}
                disabled={isLoading}
                className={`w-12 h-12 sm:w-14 sm:h-14 text-white font-bold rounded-lg transition-all duration-200 focus:outline-none active:scale-95 text-lg shadow-md border-2 border-pink-300 ${isLoading ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700'}`}
                style={{
                  background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  color: '#ffffff'
                }}
              >
                {number}
              </button>
            ))}
            <button
              onClick={clearCell}
              disabled={isLoading}
              className={`w-12 h-12 sm:w-14 sm:h-14 text-white font-bold rounded-lg transition-all duration-200 focus:outline-none active:scale-95 text-lg shadow-md border-2 border-red-300 ${isLoading ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-red-500 hover:bg-red-600 active:bg-red-700'}`}
              style={{
                background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
                color: '#ffffff'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Control Buttons - Mobil için optimize edilmiş */}
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={fetchNewPuzzle}
            disabled={isLoading}
            className={`px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none active:scale-95 shadow-md border-2 border-green-300 ${isLoading ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-green-500 hover:bg-green-600 active:bg-green-700'}`}
            style={{
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff'
            }}
          >
            {isLoading ? '💖 Hazırlıyorum...' : '🎲 Yeni Bulmaca'}
          </button>
          <button
            onClick={resetGame}
            disabled={isLoading}
            className={`px-4 py-2 sm:px-6 sm:py-3 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none active:scale-95 shadow-md border-2 border-gray-300 ${isLoading ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-gray-500 hover:bg-gray-600 active:bg-gray-700'}`}
            style={{
              background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: '#ffffff'
            }}
          >
            🔄 Baştan Başla
          </button>
        </div>

      </div>
    </div>
  )
}
