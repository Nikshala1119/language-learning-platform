import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, Image as ImageIcon, Video, FileText, Music, Trash2, Copy, Check, X } from 'lucide-react'

interface MediaFile {
  name: string
  size: number
  type: string
  url: string
  created_at: string
}

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'documents' | 'audio'>('all')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .storage
        .from('media')
        .list()

      if (error) {
        console.error('Error fetching files:', error)

        // Show specific error messages
        if (error.message.includes('Bucket not found')) {
          alert('⚠️ Storage bucket not found!\n\nPlease create the "media" bucket in Supabase Storage.\n\nSee STORAGE_SETUP.md for instructions.')
        } else {
          alert('Error loading files: ' + error.message)
        }

        setFiles([])
        return
      }

      // Get public URLs for all files
      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase
            .storage
            .from('media')
            .getPublicUrl(file.name)

          return {
            name: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'unknown',
            url: urlData.publicUrl,
            created_at: file.created_at || new Date().toISOString(),
          }
        })
      )

      setFiles(filesWithUrls)
    } catch (error) {
      console.error('Error:', error)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create a unique filename
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload file
      const { error: uploadError } = await supabase
        .storage
        .from('media')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)

        // Provide specific error messages
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage bucket "media" not found. Please create it in Supabase Dashboard.')
        } else if (uploadError.message.includes('policy')) {
          throw new Error('Permission denied. Please set up storage policies. See STORAGE_SETUP.md')
        } else {
          throw uploadError
        }
      }

      alert('✅ File uploaded successfully!')
      setSelectedFile(null)
      setShowUploadModal(false)
      fetchFiles()
    } catch (error: any) {
      console.error('Error uploading:', error)
      alert('❌ Upload Failed\n\n' + error.message + '\n\nCheck STORAGE_SETUP.md for help.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error } = await supabase
        .storage
        .from('media')
        .remove([fileName])

      if (error) throw error

      alert('File deleted successfully!')
      fetchFiles()
    } catch (error: any) {
      console.error('Error deleting:', error)
      alert('Failed to delete file: ' + error.message)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon
    if (type.startsWith('video/')) return Video
    if (type.startsWith('audio/')) return Music
    return FileText
  }

  const getFileCategory = (type: string) => {
    if (type.startsWith('image/')) return 'images'
    if (type.startsWith('video/')) return 'videos'
    if (type.startsWith('audio/')) return 'audio'
    return 'documents'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true
    return getFileCategory(file.type) === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading media library...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your media files</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{files.length}</div>
            <p className="text-sm text-muted-foreground">Total Files</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {files.filter(f => getFileCategory(f.type) === 'images').length}
            </div>
            <p className="text-sm text-muted-foreground">Images</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {files.filter(f => getFileCategory(f.type) === 'videos').length}
            </div>
            <p className="text-sm text-muted-foreground">Videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {files.filter(f => getFileCategory(f.type) === 'documents').length}
            </div>
            <p className="text-sm text-muted-foreground">Documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All Files
            </Button>
            <Button
              variant={filter === 'images' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('images')}
            >
              Images
            </Button>
            <Button
              variant={filter === 'videos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('videos')}
            >
              Videos
            </Button>
            <Button
              variant={filter === 'documents' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('documents')}
            >
              Documents
            </Button>
            <Button
              variant={filter === 'audio' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('audio')}
            >
              Audio
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {filter === 'all' ? 'No files uploaded yet' : `No ${filter} found`}
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              Upload Your First File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.type)
            const isImage = file.type.startsWith('image/')

            return (
              <Card key={file.name} className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(file.url)}
                    >
                      {copiedUrl === file.url ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.name)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload File</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Upload images, videos, PDFs, or audio files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium mb-1">Note:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Max file size: 50MB</li>
                    <li>• Supported: Images, Videos, PDFs, Audio</li>
                    <li>• Files are stored in Supabase Storage</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false)
                      setSelectedFile(null)
                    }}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
