'use client'

import type React from 'react'

interface OrbitalLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  showText?: boolean
  className?: string
  overlay?: boolean
}

interface LoaderContentProps {
  size: 'sm' | 'md' | 'lg' | 'xl'
  text: string
  showText: boolean
  className: string
}

const LoaderContent: React.FC<LoaderContentProps> = ({ size, text, showText, className }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }

  const dotSizes = {
    sm: { outer: 'w-1.5 h-1.5', middle: 'w-1 h-1', inner: 'w-0.5 h-0.5', core: 'w-1 h-1' },
    md: { outer: 'w-2 h-2', middle: 'w-1.5 h-1.5', inner: 'w-1 h-1', core: 'w-1.5 h-1.5' },
    lg: { outer: 'w-3 h-3', middle: 'w-2 h-2', inner: 'w-1.5 h-1.5', core: 'w-2 h-2' },
    xl: { outer: 'w-4 h-4', middle: 'w-3 h-3', inner: 'w-2 h-2', core: 'w-3 h-3' },
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Orbital Rings Container */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-red-200 animate-spin"
          style={{ animationDuration: '4s' }}
        >
          <div
            className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${dotSizes[size].outer} bg-gradient-to-r from-red-600 to-red-700 rounded-full shadow-lg`}
          ></div>
          <div
            className={`absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 ${dotSizes[size].outer} bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg opacity-60`}
          ></div>
        </div>

        {/* Middle Ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-red-300 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '3s' }}
        >
          <div
            className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${dotSizes[size].middle} bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md`}
          ></div>
          <div
            className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 ${dotSizes[size].middle} bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-md opacity-70`}
          ></div>
        </div>

        {/* Inner Ring */}
        <div
          className="absolute inset-3 rounded-full border border-red-400 animate-spin"
          style={{ animationDuration: '2s' }}
        >
          <div
            className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${dotSizes[size].inner} bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-sm`}
          ></div>
        </div>

        {/* Center Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`${dotSizes[size].core} bg-gradient-to-r from-red-600 to-red-700 rounded-full animate-pulse shadow-lg`}
          ></div>
        </div>

        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-red-500 opacity-10 animate-pulse"></div>
      </div>

      {/* Loading Text */}
      {showText && (
        <div
          className={`text-red-700 font-semibold ${textSizeClasses[size]} animate-pulse tracking-wide`}
        >
          {text}
        </div>
      )}

      {/* Loading Dots */}
      {showText && (
        <div className="flex space-x-1">
          <div
            className="w-1 h-1 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="w-1 h-1 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="w-1 h-1 bg-red-500 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      )}
    </div>
  )
}

const OrbitalLoader: React.FC<OrbitalLoaderProps> = ({
  size = 'md',
  text = 'กำลังโหลด...',
  showText = true,
  className = '',
  overlay = false,
}) => {
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-8">
          <LoaderContent size={size} text={text} showText={showText} className={className} />
        </div>
      </div>
    )
  }

  return <LoaderContent size={size} text={text} showText={showText} className={className} />
}

export default OrbitalLoader
