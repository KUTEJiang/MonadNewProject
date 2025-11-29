'use client'

import React, { useState } from 'react'
import { useAppContext, OperationHistoryItem } from '@/contexts/AppContext'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { ImageModal } from '@/components/ui/ImageModal'

interface OperationHistoryProps {
  className?: string
}

export function OperationHistory({ className = '' }: OperationHistoryProps) {
  const { state } = useAppContext()
  const [isExpanded, setIsExpanded] = useState(false)
  const [filter, setFilter] = useState<'all' | 'generation' | 'minting'>('all')
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

  const filteredHistory = state.operationHistory.filter(item => {
    if (filter === 'all') return true
    return item.type === filter
  })

  const displayedHistory = isExpanded ? filteredHistory : filteredHistory.slice(0, 5)

  const getStatusIcon = (status: OperationHistoryItem['status']) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        )
      case 'error':
        return (
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        )
      case 'pending':
        return (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        )
    }
  }

  const getStatusText = (item: OperationHistoryItem) => {
    if (item.status === 'success') {
      return item.type === 'generation' ? 'Generated successfully' : 'Minted successfully'
    } else if (item.status === 'error') {
      return item.error || 'Operation failed'
    } else {
      return item.type === 'generation' ? 'Generating...' : 'Minting...'
    }
  }

  const getTypeIcon = (type: OperationHistoryItem['type']) => {
    if (type === 'generation') {
      return (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    }
  }

  const handleImageClick = (imageUrl: string, prompt: string) => {
    setSelectedImage({ src: imageUrl, alt: `Generated image: ${prompt}` })
  }

  const formatTxHash = (txHash: string) => {
    return `${txHash.slice(0, 6)}...${txHash.slice(-4)}`
  }

  if (state.operationHistory.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operation History</h3>
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No operations yet</p>
            <p className="text-xs text-gray-400 mt-1">Your generation and minting history will appear here</p>
          </div>
        </div>
        
        {/* Monad NFT Explorer Embed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monad NFT Explorer</h3>
          <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200">
            <iframe
              src="https://testnet.monadexplorer.com/myspace?type=NFTs"
              className="w-full h-full"
              title="Monad NFT Explorer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-3 text-center">
            <a
              href="https://testnet.monadexplorer.com/myspace?type=NFTs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Open in New Tab →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Operation History</h3>
            <span className="text-sm text-gray-500">
              {state.operationHistory.length} operation{state.operationHistory.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('generation')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === 'generation'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Generation
            </button>
            <button
              onClick={() => setFilter('minting')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === 'minting'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Minting
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {displayedHistory.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(item.status)}
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        &ldquo;{item.prompt}&rdquo;
                      </p>
                  
                  {/* Image preview for successful generation operations */}
                  {item.type === 'generation' && item.status === 'success' && item.result?.imageUrl && (
                    <div className="mb-2">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity duration-200">
                        <Image
                          src={item.result.imageUrl}
                          alt={`Generated image: ${item.prompt}`}
                          fill
                          className="object-cover"
                          onClick={() => handleImageClick(item.result!.imageUrl!, item.prompt)}
                          unoptimized
                        />

                      </div>
                    </div>
                  )}

                  {/* Blockchain information for successful minting operations */}
                  {item.type === 'minting' && item.status === 'success' && item.result?.txHash && (
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-green-800">Blockchain Transaction</span>
                      </div>
                      {item.result && item.result.txHash && (() => {
                        const txHash = item.result.txHash;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Tx Hash:</span>
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800">
                              {formatTxHash(txHash)}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(txHash)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              title="Copy transaction hash"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        );
                      })()}
                      {item.result && item.result.tokenId && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-600">Token ID:</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800">
                              #{item.result.tokenId}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(item.result!.tokenId || '')}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              title="Copy token ID"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      {item.result.tokenURI && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-600">Token URI:</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800 truncate max-w-32">
                              {item.result.tokenURI}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(item.result!.tokenURI!)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              title="Copy token URI"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          item.status === 'success' ? 'text-green-600' :
                          item.status === 'error' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {getStatusText(item)}
                        </span>
                        
                    {item.result?.txHash && (
                      <a
                        href={item.result.explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                              View on Explorer
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
            ))}
          </div>

          {filteredHistory.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {isExpanded ? 'Show Less' : `Show ${filteredHistory.length - 5} More`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Monad NFT Explorer Embed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monad NFT Explorer</h3>
        <div className="relative w-full h-96 rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src="https://testnet.monadexplorer.com/myspace?type=NFTs"
            className="w-full h-full"
            title="Monad NFT Explorer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-3 text-center">
          <a
            href="https://testnet.monadexplorer.com/myspace?type=NFTs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Open in New Tab →
          </a>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
      <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageSrc={selectedImage.src}
          alt={selectedImage.alt}
        />
      )}
    </div>
  )
}