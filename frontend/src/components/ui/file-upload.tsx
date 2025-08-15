import React from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  onUpload: (files: File[]) => Promise<void> | void
  onRemove?: (file: File) => void
  disabled?: boolean
  className?: string
  label?: string
  description?: string
  dragAndDrop?: boolean
  showPreview?: boolean
}

interface UploadedFile {
  file: File
  id: string
  status: 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize = 10, // 10MB default
  maxFiles = multiple ? 5 : 1,
  onUpload,
  onRemove,
  disabled = false,
  className,
  label,
  description,
  dragAndDrop = true,
  showPreview = true,
}) => {
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type
      
      const isValid = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type
        }
        return mimeType.match(type.replace('*', '.*'))
      })
      
      if (!isValid) {
        return `File type not supported. Accepted types: ${accept}`
      }
    }
    return null
  }

  const processFiles = async (fileList: FileList) => {
    if (disabled || isUploading) return

    const newFiles = Array.from(fileList)
    const totalFiles = files.length + newFiles.length

    if (totalFiles > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const validFiles: UploadedFile[] = []
    const invalidFiles: string[] = []

    newFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        invalidFiles.push(`${file.name}: ${error}`)
      } else {
        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          status: 'uploading',
          progress: 0,
        })
      }
    })

    if (invalidFiles.length > 0) {
      alert(`Invalid files:\n${invalidFiles.join('\n')}`)
    }

    if (validFiles.length === 0) return

    setFiles(prev => [...prev, ...validFiles])
    setIsUploading(true)

    try {
      // Simulate upload progress for each file
      for (const uploadedFile of validFiles) {
        // Update progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 50))
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, progress }
              : f
          ))
        }
        
        // Mark as complete
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        ))
      }

      await onUpload(validFiles.map(f => f.file))
    } catch (error) {
      // Mark all as error
      setFiles(prev => prev.map(f => 
        validFiles.find(vf => vf.id === f.id)
          ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ))
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      processFiles(fileList)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    const fileList = event.dataTransfer.files
    if (fileList) {
      processFiles(fileList)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const removeFile = (fileToRemove: UploadedFile) => {
    setFiles(prev => prev.filter(f => f.id !== fileToRemove.id))
    if (onRemove) {
      onRemove(fileToRemove.file)
    }
  }

  const openFileDialog = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 hover-lift',
          isDragOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
        onDrop={dragAndDrop ? handleDrop : undefined}
        onDragOver={dragAndDrop ? handleDragOver : undefined}
        onDragLeave={dragAndDrop ? handleDragLeave : undefined}
        onClick={openFileDialog}
      >
        <motion.div
          className="text-center"
          animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
        >
          <motion.div
            className="mx-auto mb-4"
            animate={isDragOver ? { rotate: 5 } : { rotate: 0 }}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {dragAndDrop ? 'Drop files here or click to browse' : 'Click to browse files'}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {accept && (
                <Badge variant="secondary" className="text-xs">
                  {accept}
                </Badge>
              )}
              {maxSize && (
                <Badge variant="secondary" className="text-xs">
                  Max {maxSize}MB
                </Badge>
              )}
              {multiple && (
                <Badge variant="secondary" className="text-xs">
                  Up to {maxFiles} files
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
        />
      </div>

      {/* File List */}
      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          <AnimatePresence>
            {files.map((uploadedFile) => (
              <motion.div
                key={uploadedFile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </span>
                  </div>
                  
                  {uploadedFile.status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress value={uploadedFile.progress} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        Uploading... {uploadedFile.progress}%
                      </p>
                    </div>
                  )}
                  
                  {uploadedFile.error && (
                    <p className="text-xs text-destructive">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-success" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(uploadedFile)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default FileUpload